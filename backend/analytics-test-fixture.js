import * as M from './src/models/index.js';
export async function analyticsFixture() {
  for (const model of Object.values(M)) await model.init();
  const users = {};
  for (const role of ['admin', 'employee', 'customer']) users[role] = await M.User.create({ name: `Analytics ${role}`, email: `${role}@analytics.test`, password: 'AnalyticsTest123!', role });
  users.blocked = await M.User.create({ name: 'Blocked customer', email: 'blocked@analytics.test', password: 'AnalyticsTest123!', role: 'customer', status: 'blocked' });
  await M.User.collection.updateMany({role:'customer'},{$set:{createdAt:new Date('2026-01-10T00:00:00Z')}});
  const category = await M.Category.create({ name: 'Analytics Category' }), brand = await M.Brand.create({ name: 'Analytics Brand' });
  const product = await M.Product.create({ name: 'Analytics Shirt', slug: 'analytics-shirt', description: 'Fixture', category: category._id, brand: brand._id, price: 100, status: 'active' });
  const other = await M.Product.create({ name: '=SUM(1,2)', slug: 'analytics-other', description: 'Fixture', category: category._id, brand: brand._id, price: 500, status: 'active' });
  const variants = await M.ProductVariant.create([{ product: product._id, sku: 'ANALYTICS-M', size: 'M', color: 'Blue', stock: 3 }, { product: product._id, sku: 'ANALYTICS-L', size: 'L', color: 'Blue', stock: 0 }, { product: other._id, sku: 'ANALYTICS-XL', size: 'XL', color: 'Red', stock: 10, status: 'inactive' }]);
  const make = async (number, status, paymentStatus, amount, paidAt, items = [], createdAt = '2026-01-15T12:00:00Z', discount = 0, shipping = 0) => {
    const order = await M.Order.create({ user: users.customer._id, orderNumber: number, shippingAddress: { snapshot: { fullName: 'Analytics customer', line1: '1 Test Road' } }, subtotal: amount + discount - shipping, discount, shipping, grandTotal: amount, status, paymentStatus, createdAt: new Date(createdAt) });
    const payment = await M.Payment.create({ order: order._id, user: users.customer._id, method: 'COD', amount, status: paymentStatus, ...(paidAt ? {paidAt:new Date(paidAt)} : {}) });
    await M.Order.updateOne({_id:order._id},{payment:payment._id});
    for (const [variant, unitPrice, quantity] of items) await M.OrderItem.create({ order: order._id, product: variant.product, variant: variant._id, productName: String(variant.product) === String(product._id) ? product.name : other.name, sku: variant.sku, quantity, unitPrice, subtotal: unitPrice * quantity, size: variant.size, color: variant.color });
    return order;
  };
  const first = await make('ANALYTICS-001','Delivered','Paid',329,'2026-01-31T23:59:59Z',[[variants[0],100,1],[variants[1],100,1]],'2025-12-15T00:00:00Z',20,149);
  await make('ANALYTICS-002','Delivered','Paid',500,'2026-02-01T00:00:00Z',[[variants[2],500,1]]);
  await make('ANALYTICS-OLD','Delivered','Paid',50,'2025-12-31T23:59:59Z',[],'2025-12-01T00:00:00Z');
  for (const [status, paymentStatus] of [['Returned','Paid'],['Returned','Refunded'],['Cancelled','Paid'],['Delivered','Pending'],['Pending','Pending'],['Delivered','Failed']]) await make(`EXCLUDED-${status}-${paymentStatus}`,status,paymentStatus,999,'2026-01-31T12:00:00Z',[[variants[0],999,1]]);
  return { users, category, brand, product, other, variants, first };
}
