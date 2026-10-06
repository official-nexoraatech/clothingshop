import { Order, Payment, Product, ProductVariant, User } from '../models/index.js';
import { dates, dateMatch, bucket, paidSales, productSales, productGroup, salesGroups, fillSeries, lookup, orderStatuses } from './analytics.js';
const low = { $and: [{ $gt: ['$stock', 0] }, { $lte: ['$stock', '$lowStockThreshold'] }] };
const first = rows => rows[0] || {};
export async function dashboard(query) {
  const period = dates(query);
  const [sales, orders, customers, totalProducts, inventory, trends, performance] = await Promise.all([
    Payment.aggregate([...paidSales(), { $facet: {
      total: [{ $group: { _id: null, revenue: { $sum: '$amount' } } }],
      period: [{ $match: { paidAt: dateMatch(period) } }, { $group: { _id: null, revenue: { $sum: '$amount' }, orders: { $sum: 1 } } }]
    } }]),
    Order.aggregate([{ $facet: {
      total: [{ $count: 'count' }],
      statuses: [{ $match: { createdAt: dateMatch(period) } }, { $group: { _id: '$status', count: { $sum: 1 } } }],
      recent: [{ $match: { createdAt: dateMatch(period) } }, { $sort: { createdAt: -1, _id: -1 } }, { $limit: 5 }, lookup('users', 'user', 'customer'),
        { $project: { orderNumber: 1, createdAt: 1, grandTotal: 1, status: 1, paymentStatus: 1, customer: { $ifNull: [{ $arrayElemAt: ['$customer.name', 0] }, 'Unavailable customer'] } } }]
    } }]),
    User.aggregate([{ $match: { role: 'customer' } }, { $facet: {
      total: [{ $count: 'count' }], active: [{ $match: { status: 'active' } }, { $count: 'count' }],
      new: [{ $match: { createdAt: dateMatch(period) } }, { $count: 'count' }],
      trend: [{ $match: { createdAt: dateMatch(period) } }, { $group: { _id: bucket('$createdAt', period.interval), count: { $sum: 1 } } }, { $sort: { _id: 1 } }, { $project: { _id: 0, date: { $dateToString: { date: '$_id', format: '%Y-%m-%d' } }, count: 1 } }],
      recent: [{ $match: { createdAt: dateMatch(period) } }, { $sort: { createdAt: -1, _id: -1 } }, { $limit: 5 }, { $project: { name: 1, email: 1, createdAt: 1, status: 1 } }]
    } }]),
    Product.countDocuments(),
    ProductVariant.aggregate([lookup('products', 'product', 'productInfo'), { $set: { productInfo: { $arrayElemAt: ['$productInfo', 0] } } }, { $facet: {
      totals: [{ $group: { _id: null, totalStock: { $sum: '$stock' }, variants: { $sum: 1 },
        availableStock: { $sum: { $cond: [{ $and: [{ $eq: ['$status', 'active'] }, { $eq: ['$productInfo.status', 'active'] }] }, '$stock', 0] } },
        lowStockVariants: { $sum: { $cond: [low, 1, 0] } }, outOfStockVariants: { $sum: { $cond: [{ $eq: ['$stock', 0] }, 1, 0] } } } }],
      alerts: [{ $match: { $expr: { $lte: ['$stock', '$lowStockThreshold'] } } }, { $sort: { stock: 1, _id: 1 } }, { $limit: 10 },
        { $project: { sku: 1, size: 1, color: 1, stock: 1, lowStockThreshold: 1, status: 1, product: { $ifNull: ['$productInfo.name', 'Unavailable product'] } } }]
    } }]),
    Payment.aggregate(salesGroups(period)),
    Payment.aggregate([...productSales(period), { $facet: {
      products: [...productGroup, { $limit: 10 }],
      categories: groupedSales('category', 'categories'), brands: groupedSales('brand', 'brands')
    } }])
  ]);
  const orderData = orders[0], customerData = customers[0], saleData = sales[0];
  return { period, summary: {
    totalRevenue: Math.round((first(saleData.total).revenue || 0) * 100) / 100,
    periodRevenue: Math.round((first(saleData.period).revenue || 0) * 100) / 100,
    paidOrders: first(saleData.period).orders || 0, totalOrders: first(orderData.total).count || 0,
    periodOrders: orderData.statuses.reduce((sum, row) => sum + row.count, 0),
    totalCustomers: first(customerData.total).count || 0, activeCustomers: first(customerData.active).count || 0,
    newCustomers: first(customerData.new).count || 0, totalProducts,
  }, orderStatuses: orderStatuses.map(status => ({ status, count: orderData.statuses.find(row => row._id === status)?.count || 0 })),
  recentOrders: orderData.recent, recentCustomers: customerData.recent, customerTrend: customerData.trend,
  inventory: { totalStock: 0, availableStock: 0, variants: 0, lowStockVariants: 0, outOfStockVariants: 0, ...first(inventory[0].totals), alerts: inventory[0].alerts },
  sales: fillSeries(trends, period), ...performance[0] };
}
function groupedSales(field, collection) {
  return [{ $group: { _id: `$product.${field}`, units: { $sum: '$item.quantity' }, revenue: { $sum: '$netItemRevenue' } } },
    { $sort: { revenue: -1, _id: 1 } }, { $limit: 10 }, lookup(collection, '_id', 'master'),
    { $project: { _id: 1, name: { $ifNull: [{ $arrayElemAt: ['$master.name', 0] }, 'Uncategorised / unavailable'] }, units: 1, revenue: { $round: ['$revenue', 2] } } }];
}
