import { Coupon, Order, User } from '../models/index.js';
import ShopSettings, { defaultShopSettings } from '../models/ShopSettings.js';
import { fail, checkId, transaction } from '../services/checkout.js';
import { pagination, scalar, enumFilter, aggregatePage } from '../services/analytics.js';
const wrap = fn => async (req, res, next) => { try { await fn(req, res); } catch (error) { next(error); } };
const bodyFor = (body, keys) => {
  if (!body || typeof body !== 'object' || Array.isArray(body)) fail('A JSON object is required.');
  if (Object.keys(body).some(key => !keys.includes(key))) fail('Unsupported field.');
  return body;
};
const text = (value, name, max, required = false) => {
  if (typeof value !== 'string' || value.trim().length > max || (required && !value.trim())) fail(`Invalid ${name}.`);
  return value.trim();
};
const searchFilter = query => {
  const search = scalar(query.search, 'search') || '';
  if (search.length > 100) fail('Search is too long.');
  return search ? new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') : null;
};
const paged = (rows, count, paging) => ({ rows, pagination: { ...paging, totalItems: count, totalPages: Math.ceil(count / paging.limit) } });
export const listCoupons = wrap(async (req, res) => {
  const paging = pagination(req.query), search = searchFilter(req.query), status = enumFilter(req.query.status, ['active', 'inactive'], 'status');
  const filter = { ...(search ? { code: search } : {}), ...(status ? { status } : {}) };
  const [rows, count] = await Promise.all([Coupon.find(filter).sort({ createdAt: -1, _id: -1 }).skip((paging.page - 1) * paging.limit).limit(paging.limit).lean(), Coupon.countDocuments(filter)]);
  res.json(paged(rows.map(row => ({ ...row, availability: row.status === 'inactive' ? 'Inactive' : new Date(row.startDate) > new Date() ? 'Scheduled' : new Date(row.expiryDate) <= new Date() ? 'Expired' : row.usageLimit && row.usageCount >= row.usageLimit ? 'Exhausted' : 'Available' })), count, paging));
});
const couponKeys = ['code','description','discountType','discountValue','minimumOrderValue','maximumDiscount','startDate','expiryDate','usageLimit','status'];
function couponFields(body, existing) {
  bodyFor(body, couponKeys);
  const next = existing ? Object.fromEntries(couponKeys.map(key => [key, existing[key]])) : { minimumOrderValue: 0, status: 'active', description: '' };
  for (const [key, value] of Object.entries(body)) {
    if (['maximumDiscount','usageLimit'].includes(key) && value === null) { next[key] = undefined; continue; }
    if (['code','description'].includes(key)) next[key] = text(value, key, key === 'code' ? 40 : 1000, key === 'code');
    else if (['discountType','status'].includes(key)) next[key] = enumFilter(value, key === 'status' ? ['active','inactive'] : ['percentage','fixed'], key);
    else if (['startDate','expiryDate'].includes(key)) {
      if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/.test(value)) fail('Coupon dates must be valid UTC timestamps.');
      const date = new Date(value);
      if (!Number.isFinite(+date) || date.toISOString().slice(0,19) !== value.slice(0,19)) fail('Invalid coupon date.');
      next[key] = date;
    } else {
      if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1000000000) fail(`Invalid ${key}.`);
      next[key] = value;
    }
  }
  if (typeof next.code !== 'string' || !/^[A-Z0-9][A-Z0-9_&-]{0,39}$/.test(next.code.toUpperCase())) fail('Code must use letters, numbers, &, hyphens or underscores.');
  next.code = next.code.toUpperCase();
  if (!['percentage','fixed'].includes(next.discountType) || !(next.discountValue > 0) || (next.discountType === 'percentage' && next.discountValue > 100)) fail('Enter a positive discount; percentages cannot exceed 100.');
  if (!['active','inactive'].includes(next.status)) fail('Invalid status.');
  if (!next.startDate || !next.expiryDate || !(next.expiryDate > next.startDate)) fail('Expiry must be after the start date.');
  if (next.usageLimit !== undefined && (!Number.isSafeInteger(next.usageLimit) || next.usageLimit < 1 || next.usageLimit < (existing?.usageCount || 0))) fail('Usage limit must be a whole number at least as large as existing usage.');
  if (existing?.usageCount && existing.code !== next.code) fail('A used coupon cannot be renamed.', 409);
  return next;
}
export const createCoupon = wrap(async (req, res) => res.status(201).json({ coupon: await Coupon.create(couponFields(req.body)) }));
export const updateCoupon = wrap(async (req, res) => {
  checkId(req.params.id);
  const coupon = await transaction(async session => {
    const current = await Coupon.findById(req.params.id).session(session); if (!current) fail('Coupon not found.',404);
    current.set(couponFields(req.body, current)); await current.save({ session }); return current;
  });
  res.json({ coupon });
});
export const deleteCoupon = wrap(async (req, res) => {
  checkId(req.params.id);
  await transaction(async session => {
    const coupon = await Coupon.findById(req.params.id).session(session); if (!coupon) fail('Coupon not found.',404);
    if (coupon.usageCount || await Order.exists({ coupon: coupon._id }).session(session)) fail('Used coupons cannot be deleted. Deactivate this coupon instead.',409);
    await Coupon.deleteOne({ _id: coupon._id }, { session });
  });
  res.status(204).send();
});
export const listCustomers = wrap(async (req, res) => {
  const search = searchFilter(req.query), status = enumFilter(req.query.status, ['active','blocked','inactive'], 'status');
  const filter = { role: 'customer', ...(search ? { $or: [{ name: search }, { email: search }, { phone: search }] } : {}), ...(status ? { status } : {}) };
  const page = await aggregatePage(User, [{ $match: filter }, { $sort: { createdAt: -1, _id: -1 } }, { $project: { name:1,email:1,phone:1,status:1,createdAt:1 } }], pagination(req.query));
  const counts = await Order.aggregate([{ $match: { user: { $in: page.rows.map(row => row._id) } } }, { $group: { _id: '$user', count: { $sum: 1 } } }]);
  const map = new Map(counts.map(row => [String(row._id), row.count]));
  res.json({ ...page, rows: page.rows.map(row => ({ ...row, orders: map.get(String(row._id)) || 0 })) });
});
export const getCustomer = wrap(async (req, res) => {
  checkId(req.params.id);
  const customer = await User.findOne({ _id: req.params.id, role: 'customer' }).select('name email phone status createdAt profile').lean();
  if (!customer) fail('Customer not found.',404);
  const paging = pagination(req.query), filter = { user: customer._id };
  const [orders, total] = await Promise.all([Order.find(filter).select('orderNumber createdAt grandTotal status paymentStatus').sort({ createdAt:-1,_id:-1 }).skip((paging.page-1)*paging.limit).limit(paging.limit).lean(), Order.countDocuments(filter)]);
  res.json({ customer, ...paged(orders,total,paging) });
});
export const setCustomerStatus = wrap(async (req, res) => {
  checkId(req.params.id); bodyFor(req.body,['status']);
  const status = enumFilter(req.body.status,['active','blocked'],'status'); if (!status) fail('Status is required.');
  const customer = await User.findOneAndUpdate({ _id:req.params.id,role:'customer' }, { status }, { returnDocument:'after',runValidators:true }).select('name email phone status createdAt');
  if (!customer) fail('Customer not found.',404);
  res.json({ customer });
});
export const getShopSettings = wrap(async (_req, res) => {
  const saved = await ShopSettings.findById('shop').select('name location email phone -_id').lean();
  res.json({ settings: saved || defaultShopSettings });
});
export const saveShopSettings = wrap(async (req, res) => {
  const body = bodyFor(req.body,['name','location','email','phone']);
  const data = { name: text(body.name,'shop name',100,true), location:text(body.location,'location',300,true), email:text(body.email ?? '','email',254), phone:text(body.phone ?? '','phone',25) };
  if (data.email && !/^\S+@\S+\.\S+$/.test(data.email)) fail('Enter a valid email address.');
  if (data.phone && !/^\+?\d[\d\s()-]{5,24}$/.test(data.phone)) fail('Enter a valid phone number.');
  const settings = await ShopSettings.findOneAndUpdate({ _id:'shop' },{ $set:data },{ upsert:true,returnDocument:'after',runValidators:true }).select('name location email phone -_id');
  res.json({ settings });
});
