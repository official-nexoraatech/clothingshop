import mongoose from 'mongoose';
import { fail } from './checkout.js';
import { Order, Payment } from '../models/index.js';
export const orderStatuses = Order.schema.path('status').enumValues;
export const paymentStatuses = Payment.schema.path('status').enumValues;
export function scalar(value, name) {
  if (value !== undefined && typeof value !== 'string') fail(`Invalid ${name}.`);
  return value;
}
export function dates(query) {
  const range = scalar(query.range, 'range') || '30';
  const end = new Date(); end.setUTCHours(0, 0, 0, 0);
  const start = new Date(end);
  if (range === 'custom') {
    const parse = (value, name) => {
      scalar(value, name);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) fail(`Invalid ${name}; use YYYY-MM-DD.`);
      const date = new Date(`${value}T00:00:00.000Z`);
      if (!Number.isFinite(+date) || date.toISOString().slice(0, 10) !== value) fail(`Invalid ${name}.`);
      return date;
    };
    start.setTime(+parse(query.start, 'start date')); end.setTime(+parse(query.end, 'end date'));
  } else if (range === 'year') start.setUTCMonth(0, 1);
  else if (['today', '7', '30', '90', '365'].includes(range)) start.setUTCDate(start.getUTCDate() - (range === 'today' ? 0 : Number(range) - 1));
  else fail('Invalid date range.');
  if (start > end || (+end - +start) / 86400000 > 365) fail('Choose an ordered date range of at most 366 days.');
  const until = new Date(+end + 86400000);
  const interval = scalar(query.interval, 'interval') || 'day';
  if (!['day', 'week', 'month'].includes(interval)) fail('Invalid interval.');
  return { start, end, until, interval, timezone: 'UTC' };
}
export const dateMatch = period => ({ $gte: period.start, $lt: period.until });
export function pagination(query) {
  const page = Number(scalar(query.page, 'page') ?? 1), limit = Number(scalar(query.limit, 'limit') ?? 20);
  if (!Number.isSafeInteger(page) || page < 1 || page > 1000000 || !Number.isSafeInteger(limit) || limit < 1 || limit > 100) fail('Invalid pagination.');
  return { page, limit };
}
export function idFilter(value, name) {
  scalar(value, name);
  if (!value) return undefined;
  if (!/^[a-f\d]{24}$/i.test(value)) fail(`Invalid ${name}.`);
  return new mongoose.Types.ObjectId(value);
}
export function enumFilter(value, values, name) {
  scalar(value, name); if (value && !values.includes(value)) fail(`Invalid ${name}.`); return value || undefined;
}
export const bucket = (field, interval) => ({ $dateTrunc: { date: field, unit: interval, timezone: 'UTC', ...(interval === 'week' ? { startOfWeek: 'monday' } : {}) } });
export const lookup = (from, localField, as, foreignField = '_id') => ({ $lookup: { from, localField, foreignField, as } });
// Successful sales use actual collected payments and the existing delivery state.
export function paidSales(period) {
  return [{ $match: { status: 'Paid', ...(period ? { paidAt: dateMatch(period) } : {}) } }, lookup('orders', 'order', 'order'), { $unwind: '$order' },
    { $match: { 'order.status': 'Delivered', 'order.paymentStatus': 'Paid' } }];
}
export function productSales(period, filters = {}) {
  return [...paidSales(period), lookup('orderItems', 'order._id', 'item', 'order'), { $unwind: '$item' }, lookup('products', 'item.product', 'product'),
    { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
    ...(filters.category ? [{ $match: { 'product.category': filters.category } }] : []), ...(filters.brand ? [{ $match: { 'product.brand': filters.brand } }] : []),
    { $set: { netItemRevenue: { $cond: [{ $gt: ['$order.subtotal', 0] }, { $multiply: ['$item.subtotal', { $subtract: [1, { $divide: ['$order.discount', '$order.subtotal'] }] }] }, 0] } } }];
}
export const productGroup = [
  { $group: { _id: '$item.product', name: { $first: '$item.productName' }, units: { $sum: '$item.quantity' }, revenue: { $sum: '$netItemRevenue' } } },
  { $project: { _id: 1, name: 1, units: 1, revenue: { $round: ['$revenue', 2] } } }, { $sort: { units: -1, revenue: -1, _id: 1 } }
];
export function salesGroups(period) {
  return [...paidSales(period), lookup('orderItems', 'order._id', 'items', 'order'),
    { $group: { _id: bucket('$paidAt', period.interval), orders: { $sum: 1 }, units: { $sum: { $sum: '$items.quantity' } }, revenue: { $sum: '$amount' } } },
    { $project: { _id: 0, date: { $dateToString: { date: '$_id', format: '%Y-%m-%d', timezone: 'UTC' } }, orders: 1, units: 1, revenue: { $round: ['$revenue', 2] } } }, { $sort: { date: 1 } }];
}
export function fillSeries(rows, period) {
  const byDate = new Map(rows.map(row => [row.date, row])); const result = [];
  const cursor = new Date(period.start);
  if (period.interval === 'month') cursor.setUTCDate(1);
  if (period.interval === 'week') cursor.setUTCDate(cursor.getUTCDate() - (cursor.getUTCDay() + 6) % 7);
  while (cursor < period.until) {
    const date = cursor.toISOString().slice(0, 10);
    result.push(byDate.get(date) || { date, orders: 0, units: 0, revenue: 0 });
    if (period.interval === 'month') cursor.setUTCMonth(cursor.getUTCMonth() + 1); else cursor.setUTCDate(cursor.getUTCDate() + (period.interval === 'week' ? 7 : 1));
  }
  return result;
}
export const aggregatePage = async (model, pipeline, paging) => {
  const [result] = await model.aggregate([...pipeline, { $facet: { rows: [{ $skip: (paging.page - 1) * paging.limit }, { $limit: paging.limit }], count: [{ $count: 'total' }] } }]);
  const totalItems = result.count[0]?.total || 0;
  return { rows: result.rows, pagination: { ...paging, totalItems, totalPages: Math.ceil(totalItems / paging.limit) } };
};
