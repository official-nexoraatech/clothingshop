import { Order, Payment, ProductVariant } from '../models/index.js';
import { fail } from './checkout.js';
import { dates, dateMatch, pagination, idFilter, enumFilter, orderStatuses, paymentStatuses, lookup, aggregatePage, productSales, productGroup, salesGroups, scalar } from './analytics.js';
export const reportColumns = {
  sales: ['date', 'orders', 'units', 'revenue'],
  orders: ['orderNumber', 'customer', 'date', 'status', 'paymentStatus', 'total'],
  products: ['name', 'units', 'revenue'],
  inventory: ['name', 'sku', 'size', 'color', 'stock', 'stockStatus', 'variantStatus', 'productStatus']
};
export function reportDefinition(type, query) {
  if (!Object.hasOwn(reportColumns, type)) fail('Unknown report.', 404);
  const category = idFilter(query.category, 'category'), brand = idFilter(query.brand, 'brand');
  const status = enumFilter(query.status, orderStatuses, 'order status'), paymentStatus = enumFilter(query.paymentStatus, paymentStatuses, 'payment status');
  const stock = enumFilter(query.stock, ['low', 'out'], 'stock status');
  if (type !== 'orders' && (status || paymentStatus)) fail('Order and payment status filters apply only to the order report.');
  if (!['products', 'inventory'].includes(type) && (category || brand)) fail('Category and brand filters apply to product and inventory reports.');
  if (type !== 'inventory' && stock) fail('Stock filter applies only to inventory.');
  if (type === 'inventory') {
    const match = { ...(category ? { 'productInfo.category': category } : {}), ...(brand ? { 'productInfo.brand': brand } : {}),
      ...(stock === 'out' ? { stock: 0 } : stock === 'low' ? { $expr: { $and: [{ $gt: ['$stock', 0] }, { $lte: ['$stock', '$lowStockThreshold'] }] } } : {}) };
    return { model: ProductVariant, period: null, pipeline: [lookup('products', 'product', 'productInfo'), { $unwind: { path: '$productInfo', preserveNullAndEmptyArrays: true } }, { $match: match }, { $sort: { stock: 1, _id: 1 } },
      { $project: { _id: 1, name: { $ifNull: ['$productInfo.name', 'Unavailable product'] }, sku: 1, size: 1, color: 1, stock: 1, variantStatus: '$status', productStatus: { $ifNull: ['$productInfo.status', 'unavailable'] }, stockStatus: { $cond: [{ $eq: ['$stock', 0] }, 'Out of Stock', { $cond: [{ $lte: ['$stock', '$lowStockThreshold'] }, 'Low Stock', 'In Stock'] }] } } }] };
  }
  const period = dates(query);
  if (type === 'sales') return { model: Payment, period, pipeline: salesGroups(period) };
  if (type === 'products') return { model: Payment, period, pipeline: [...productSales(period, { category, brand }), ...productGroup] };
  return { model: Order, period, pipeline: [{ $match: { createdAt: dateMatch(period), ...(status ? { status } : {}), ...(paymentStatus ? { paymentStatus } : {}) } }, { $sort: { createdAt: -1, _id: -1 } },
    lookup('users', 'user', 'customer'), { $project: { _id: 1, orderNumber: 1, customer: { $ifNull: [{ $arrayElemAt: ['$customer.name', 0] }, 'Unavailable customer'] }, date: { $dateToString: { date: '$createdAt', format: '%Y-%m-%d %H:%M', timezone: 'UTC' } }, status: 1, paymentStatus: 1, total: '$grandTotal' } }] };
}
export async function report(type, query) {
  const definition = reportDefinition(type, query), paging = pagination(query);
  return { type, columns: reportColumns[type], period: definition.period, ...await aggregatePage(definition.model, definition.pipeline, paging) };
}
export function csvCell(value) {
  let text = String(value ?? '');
  if (/^[\s]*[=+@-]/.test(text) || /^[\t\r\n]/.test(text)) text = "'" + text;
  return '"' + text.replaceAll('"', '""') + '"';
}
export async function exportReport(type, query, res) {
  const { model, pipeline } = reportDefinition(type, query);
  if (scalar(query.format, 'format') && query.format !== 'csv') fail('Only CSV export is available.');
  // Bound exports to avoid unbounded downloads; never silently truncate.
  const rows = await model.aggregate([...pipeline, { $limit: 10001 }]);
  if (rows.length > 10000) fail('Export exceeds 10,000 rows. Narrow the filters.', 413);
  const columns = reportColumns[type];
  res.set('Content-Disposition', `attachment; filename="${type}-report.csv"`);
  res.type('text/csv').send('\uFEFF' + [columns.map(csvCell).join(','), ...rows.map(row => columns.map(column => csvCell(row[column])).join(','))].join('\r\n'));
}
