import mongoose from 'mongoose';
import { notifyInventoryChange } from '../services/inventoryNotifications.js';
import { randomUUID } from 'node:crypto';
import Order from '../models/Order.js';
import OrderItem from '../models/OrderItem.js';
import Payment from '../models/Payment.js';
import InventoryLog from '../models/InventoryLog.js';
import ProductVariant from '../models/ProductVariant.js';
import Coupon from '../models/Coupon.js';
import { quote, fail, checkId, transaction } from '../services/checkout.js';
import { notify } from '../services/notifications.js';

export const transitions = {
  Pending: ['Confirmed', 'Cancelled'], Confirmed: ['Processing', 'Cancelled'],
  Processing: ['Shipped', 'Cancelled'], Shipped: ['Out for Delivery'],
  'Out for Delivery': ['Delivered'], Delivered: ['Returned'], Cancelled: [], Returned: []
};
const wrap = fn => async (req, res, next) => { try { await fn(req, res); } catch (error) { next(error); } };
const pageFor = query => {
  const page = Number(query.page || 1), limit = Number(query.limit || 20);
  if (!Number.isSafeInteger(page) || !Number.isSafeInteger(limit) || page < 1 || limit < 1 || limit > 100) fail('Invalid pagination.');
  return { page, limit };
};
const accessible = async (id, user, session = null) => {
  checkId(id);
  const order = await Order.findOne({ _id: id, ...(user.role === 'customer' ? { user: user._id } : {}) }).session(session);
  if (!order) fail('Order not found.', 404);
  return order;
};
const paymentView = payment => payment ? { _id: payment._id, method: payment.method, amount: payment.amount, status: payment.status, paidAt: payment.paidAt } : null;
const details = async order => ({ ...order.toObject(), items: await OrderItem.find({ order: order._id }), payment: paymentView(await Payment.findOne({ order: order._id })) });

export const createOrder = wrap(async (req, res) => {
  if (req.body.paymentMethod !== 'COD') fail('Only Cash on Delivery is currently available.');
  const order = await transaction(async session => {
    const q = await quote(req.user._id, req.body, session);
    const orderId = new mongoose.Types.ObjectId(), paymentId = new mongoose.Types.ObjectId();
    for (const item of q.items) {
      const previous = await ProductVariant.findOneAndUpdate({ _id: item.variant, status: 'active', stock: { $gte: item.quantity } }, { $inc: { stock: -item.quantity } }, { session, returnDocument: 'before' });
      if (!previous) fail('Stock changed. Please review your cart.', 409);
      await notifyInventoryChange(previous, previous.stock, previous.stock - item.quantity, session);
      await InventoryLog.create([{ product: item.product, variant: item.variant, order: orderId, quantityChange: -item.quantity, previousStock: previous.stock, newStock: previous.stock - item.quantity, operation: 'Sale', reason: 'Order placed', performedBy: req.user._id }], { session });
    }
    if (q.coupon) {
      const used = await Coupon.updateOne({ _id: q.coupon._id, usageCount: q.coupon.usageCount }, { $inc: { usageCount: 1 } }, { session });
      if (!used.modifiedCount) fail('Coupon availability changed.', 409);
    }
    const [created] = await Order.create([{ _id: orderId, user: req.user._id, orderNumber: `ORD-${randomUUID()}`, shippingAddress: { address: q.address._id, snapshot: q.address.toObject() }, subtotal: q.subtotal, discount: q.discount, shipping: q.shipping, grandTotal: q.total, coupon: q.coupon?._id, payment: paymentId, statusHistory: [{ status: 'Pending', changedBy: req.user._id, note: 'Order placed' }] }], { session });
    await OrderItem.insertMany(q.items.map(item => ({ ...item, order: orderId })), { session });
    await Payment.create([{ _id: paymentId, order: orderId, user: req.user._id, method: 'COD', amount: q.total, status: 'Pending' }], { session });
    await notify(req.user._id, 'Order', 'Order placed', `Order ${created.orderNumber} has been placed.`, { model: 'Order', entity: orderId }, session);
    q.cart.items = []; await q.cart.save({ session });
    return created;
  });
  res.status(201).json({ order: await details(order) });
});
export const listOrders = wrap(async (req, res) => {
  const { page, limit } = pageFor(req.query), filter = req.user.role === 'customer' ? { user: req.user._id } : {};
  if (req.query.status) { if (!Object.hasOwn(transitions, req.query.status)) fail('Invalid order status.'); filter.status = req.query.status; }
  const [orders, totalItems] = await Promise.all([Order.find(filter).populate('user', 'name email').sort({ createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit), Order.countDocuments(filter)]);
  res.json({ orders, pagination: { page, limit, totalItems, totalPages: Math.ceil(totalItems / limit) } });
});
export const getOrder = wrap(async (req, res) => res.json({ order: await details(await accessible(req.params.id, req.user)) }));
export const changeStatus = wrap(async (req, res) => {
  const target = req.path.endsWith('/cancel') ? 'Cancelled' : req.body.status;
  if (req.body.note !== undefined && (typeof req.body.note !== 'string' || req.body.note.length > 500)) fail('Note must be at most 500 characters.');
  if (req.user.role === 'employee' && ['Cancelled', 'Returned'].includes(target)) fail('Cancellation and return approval require an administrator.', 403);
  const order = await transaction(async session => {
    const order = await accessible(req.params.id, req.user, session);
    if (!transitions[order.status].includes(target)) fail(`Cannot change ${order.status} to ${target}.`, 409);
    const previousStatus = order.status;
    if (['Cancelled', 'Returned'].includes(target)) {
      const items = await OrderItem.find({ order: order._id }).session(session);
      for (const item of items) {
        const previous = await ProductVariant.findByIdAndUpdate(item.variant, { $inc: { stock: item.quantity } }, { session, returnDocument: 'before' });
        if (!previous) fail('An ordered variant is missing. Stock cannot be restored.', 409);
        await notifyInventoryChange(previous, previous.stock, previous.stock + item.quantity, session);
        await InventoryLog.create([{ product: item.product, variant: item.variant, order: order._id, quantityChange: item.quantity, previousStock: previous.stock, newStock: previous.stock + item.quantity, operation: target === 'Returned' ? 'Return' : 'Correction', reason: target, performedBy: req.user._id }], { session });
      }
    }
    // COD collection is recorded when the operational delivery is confirmed.
    if (target === 'Delivered') {
      const payment = await Payment.findOne({ order: order._id, method: 'COD', status: 'Pending' }).session(session);
      if (!payment) fail('Pending COD payment not found.', 409);
      payment.status = 'Paid'; payment.paidAt = new Date(); await payment.save({ session }); order.paymentStatus = 'Paid';
    }
    order.status = target;
    order.statusHistory.push({ previousStatus, status: target, changedBy: req.user._id, note: req.body.note || '' });
    await order.save({ session });
    await notify(order.user, target === 'Delivered' ? 'Payment' : 'Order', target === 'Delivered' ? 'Payment received' : `Order ${target}`, target === 'Delivered' ? `Payment for ${order.orderNumber} was recorded.` : `Order ${order.orderNumber} is now ${target}.`, { model: 'Order', entity: order._id }, session);
    return order;
  });
  res.json({ order: await details(order) });
});
export const getPayment = wrap(async (req, res) => {
  if (req.body.method !== undefined && req.body.method !== 'COD') fail('Only COD is available.');
  const order = await accessible(req.body.orderId, req.user);
  const payment = await Payment.findOne({ order: order._id });
  if (!payment) fail('Payment record not found.', 404);
  res.json({ payment: paymentView(payment) });
});
export const refundPayment = wrap(async (req, res) => {
  if (req.body.confirmed !== true) fail('Confirm that the cash refund has been issued.');
  await transaction(async session => {
    const order = await accessible(req.params.id, req.user, session);
    if (order.status !== 'Returned' || order.paymentStatus !== 'Paid') fail('Only a paid, returned order can be refunded.', 409);
    const payment = await Payment.findOne({ order: order._id, method: 'COD', status: 'Paid' }).session(session);
    if (!payment) fail('Payment not found.', 409);
    payment.status = 'Refunded'; await payment.save({ session });
    order.paymentStatus = 'Refunded'; order.statusHistory.push({ previousStatus: order.status, status: order.status, changedBy: req.user._id, note: 'Cash refund issued' }); await order.save({ session });
  });
  res.json({ message: 'Cash refund recorded.' });
});
const stockStatus = v => v.stock === 0 ? 'Out of Stock' : v.stock <= v.lowStockThreshold ? 'Low Stock' : 'In Stock';
export const listInventory = wrap(async (req, res) => {
  const { page, limit } = pageFor(req.query), filter = {};
  if (req.query.status === 'out') filter.stock = 0;
  else if (req.query.status === 'low') filter.$expr = { $and: [{ $gt: ['$stock', 0] }, { $lte: ['$stock', '$lowStockThreshold'] }] };
  else if (req.query.status && req.query.status !== 'all') fail('Invalid stock filter.');
  const [variants, totalItems] = await Promise.all([ProductVariant.find(filter).populate('product', 'name status').sort({ stock: 1, _id: 1 }).skip((page - 1) * limit).limit(limit), ProductVariant.countDocuments(filter)]);
  res.json({ variants: variants.map(v => ({ ...v.toObject(), stockStatus: stockStatus(v) })), pagination: { page, limit, totalItems, totalPages: Math.ceil(totalItems / limit) } });
});
export const updateInventory = wrap(async (req, res) => {
  checkId(req.params.variantId);
  const { stock, expectedStock, lowStockThreshold, reason } = req.body;
  if (![stock, expectedStock].every(v => Number.isSafeInteger(v) && v >= 0 && v <= 1000000000)) fail('Stock and expected stock must be non-negative whole numbers.');
  if (lowStockThreshold !== undefined && (!Number.isSafeInteger(lowStockThreshold) || lowStockThreshold < 0 || lowStockThreshold > 1000000000)) fail('Invalid low-stock threshold.');
  if (typeof reason !== 'string' || !reason.trim() || reason.length > 500) fail('Provide a stock adjustment reason (up to 500 characters).');
  const variant = await transaction(async session => {
    const previous = await ProductVariant.findById(req.params.variantId).session(session);
    if (!previous) fail('Variant not found.', 404);
    if (previous.stock !== expectedStock) fail('Stock changed. Refresh inventory before adjusting.', 409);
    const change = stock - previous.stock;
    const previousThreshold = previous.lowStockThreshold;
    previous.stock = stock;
    if (lowStockThreshold !== undefined) previous.lowStockThreshold = lowStockThreshold;
    await previous.save({ session });
    await notifyInventoryChange(previous, expectedStock, stock, session, previousThreshold);
    if (change) await InventoryLog.create([{ product: previous.product, variant: previous._id, quantityChange: change, previousStock: expectedStock, newStock: stock, operation: change > 0 ? 'Restock' : 'Adjustment', reason: reason.trim(), performedBy: req.user._id }], { session });
    return previous;
  });
  res.json({ variant: { ...variant.toObject(), stockStatus: stockStatus(variant) } });
});
export const inventoryHistory = wrap(async (req, res) => {
  checkId(req.params.variantId); const { page, limit } = pageFor(req.query);
  if (!await ProductVariant.exists({ _id: req.params.variantId })) fail('Variant not found.', 404);
  const filter = { variant: req.params.variantId };
  const [logs, totalItems] = await Promise.all([InventoryLog.find(filter).populate('performedBy', 'name').sort({ createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit), InventoryLog.countDocuments(filter)]);
  res.json({ logs, pagination: { page, limit, totalItems, totalPages: Math.ceil(totalItems / limit) } });
});
