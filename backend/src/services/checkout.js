import mongoose from 'mongoose';
import Cart from '../models/Cart.js';
import Address from '../models/Address.js';
import Coupon from '../models/Coupon.js';
import Product from '../models/Product.js';
import ProductVariant from '../models/ProductVariant.js';

export const fail = (message, status = 400) => { throw Object.assign(new Error(message), { status }); };
export const money = value => Math.round((value + Number.EPSILON) * 100) / 100;
export const priceFor = (product, variant) => money(variant.price ?? product.price * (1 - product.discount / 100));
export const checkId = id => { if (!mongoose.isValidObjectId(id)) fail('Invalid identifier.', 400); };

export async function couponDiscount(code, subtotal, session = null) {
  if (code === undefined || code === null || code === '') return { coupon: null, discount: 0 };
  if (typeof code !== 'string' || code.length > 100) fail('Invalid coupon code.');
  const coupon = await Coupon.findOne({ code: code.trim().toUpperCase(), status: 'active', startDate: { $lte: new Date() }, expiryDate: { $gt: new Date() } }).session(session);
  if (!coupon || (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit)) fail('This coupon is invalid or expired.');
  if (subtotal < coupon.minimumOrderValue) fail('The coupon minimum order value has not been reached.');
  const raw = coupon.discountType === 'percentage' ? subtotal * coupon.discountValue / 100 : coupon.discountValue;
  return { coupon, discount: money(Math.min(raw, coupon.maximumDiscount ?? raw, subtotal)) };
}

export async function quote(user, { addressId, couponCode } = {}, session = null) {
  checkId(addressId);
  const cart = await Cart.findOne({ user }).session(session);
  if (!cart?.items.length) fail('Your cart is empty.');
  const address = await Address.findOne({ _id: addressId, user }).session(session);
  if (!address) fail('Choose an address belonging to your account.', 404);
  const items = [];
  for (const item of cart.items) {
    const product = await Product.findOne({ _id: item.product, status: 'active' }).session(session);
    const variant = await ProductVariant.findOne({ _id: item.variant, product: item.product, status: 'active' }).session(session);
    if (!product || !variant) fail('A product or variant in your cart is unavailable.', 409);
    if (!Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > variant.stock) fail(`Insufficient stock for ${product.name} (${variant.size}, ${variant.color}).`, 409);
    const unitPrice = priceFor(product, variant);
    items.push({ product: product._id, variant: variant._id, productName: product.name, sku: variant.sku, size: variant.size, color: variant.color, quantity: item.quantity, unitPrice, subtotal: money(unitPrice * item.quantity) });
  }
  const subtotal = money(items.reduce((sum, item) => sum + item.subtotal, 0));
  if (!Number.isFinite(subtotal) || subtotal < 0 || subtotal > Number.MAX_SAFE_INTEGER / 100) fail('Order amount is outside the supported range.');
  const { coupon, discount } = await couponDiscount(couponCode, subtotal, session);
  const shipping = subtotal - discount >= 2999 ? 0 : 149;
  return { cart, address, items, coupon, subtotal, discount, shipping, total: money(subtotal - discount + shipping) };
}

export async function transaction(work) {
  const session = await mongoose.startSession();
  try { return await session.withTransaction(() => work(session)); }
  catch (error) {
    if (error.code === 20 || /Transaction numbers are only allowed/.test(error.message)) fail('Order and inventory operations require MongoDB configured as a replica set.', 503);
    throw error;
  } finally { await session.endSession(); }
}
