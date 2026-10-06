import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import request from 'supertest';
import { startTestDatabase } from './test-support.js';
import { analyticsFixture } from './analytics-test-fixture.js';
import { createToken } from './src/utils/jwt.js';
import * as M from './src/models/index.js';
process.env.JWT_SECRET = 'analytics-isolated-test-secret-not-production';
const db = await startTestDatabase();
let checks = 0;
const check = (condition, name) => { assert.ok(condition, name); checks++; console.log('PASS '+name); };
try {
  await mongoose.connect(db.uri);
  const { default: app } = await import('./src/app.js');
  const admin = await M.User.create({name:'Empty Admin',email:'empty@analytics.test',password:'AnalyticsTest123!',role:'admin'});
  const api = (path, user = admin) => { const r=request(app).get('/api/admin/'+path);return user ? r.set('Authorization','Bearer '+createToken(user)) : r; };
  const query = 'range=custom&start=2026-01-01&end=2026-02-28';
  let r = await api('dashboard/summary?'+query);
  check(r.status===200&&r.body.summary.totalRevenue===0&&r.body.inventory.totalStock===0&&r.body.summary.totalCustomers===0,'empty dashboard and role-aware customer counts');
  const f=await analyticsFixture();
  for (const path of ['dashboard/summary','reports/sales','reports/orders','reports/products','reports/inventory','reports/filters','reports/orders/export']) {
    check((await api(path,null)).status===401,'unauthenticated denied '+path);
    for (const role of ['customer','employee']) check((await api(path+'?role=admin',f.users[role])).status===403,role+' denied '+path);
  }
  r=await api('dashboard/summary?'+query);check(r.status===200,'dashboard aggregates execute');
  const d=r.body;
  check(d.summary.totalRevenue===879&&d.summary.periodRevenue===829,'revenue excludes invalid sales and respects payment date boundaries');
  check(d.summary.totalOrders===9&&d.summary.periodOrders===7,'order totals use order creation dates');
  check(d.summary.totalCustomers===2&&d.summary.activeCustomers===1&&d.summary.newCustomers===2,'customer role and account status counts');
  check(d.summary.totalProducts===2&&d.inventory.totalStock===13&&d.inventory.availableStock===3,'product and available stock totals');
  check(d.inventory.lowStockVariants===1&&d.inventory.outOfStockVariants===1&&d.inventory.alerts.length===2,'variant stock thresholds and zero stock');
  check(d.products.length===2&&d.products.find(p=>p.name==='Analytics Shirt').units===2&&d.products.find(p=>p.name==='Analytics Shirt').revenue===180,'multiple variants group per product with coupon allocation');
  check(d.categories[0].revenue===680&&d.brands[0].units===3,'category and brand sales exclude shipping');
  check(d.sales.length===59&&d.sales.reduce((sum,x)=>sum+x.revenue,0)===829,'zero-filled daily trend totals');
  check(d.orderStatuses.find(x=>x.status==='Returned').count===2,'order status counts');
  check(d.recentOrders.length===5&&d.recentCustomers.length===2,'recent data bounded');
  check(!JSON.stringify(d).match(/password|gateway|resetToken|JWT_SECRET/),'dashboard omits authentication and gateway data');
  for (const interval of ['week','month']) {r=await api('dashboard/summary?'+query+'&interval='+interval);check(r.status===200&&r.body.sales.reduce((sum,x)=>sum+x.revenue,0)===829,interval+' grouping preserves totals');}
  for(const bad of ['range=custom&start=2026-02-30&end=2026-03-01','range=custom&start=2026-02-01&end=2026-01-01','range=custom&start=2020-01-01&end=2026-01-01','range=wat','interval=year','range=7&range=30']) check((await api('dashboard/summary?'+bad)).status===400,'invalid date/interval rejected '+bad);
  r=await api('reports/sales?'+query);check(r.body.rows.length===2&&r.body.rows[0].units===2&&r.body.rows[0].revenue===329,'sales report exact units and revenue');
  r=await api('reports/orders?'+query+'&status=Returned&paymentStatus=Refunded');check(r.body.rows.length===1&&r.body.rows[0].paymentStatus==='Refunded','order filters');
  r=await api('reports/orders?'+query+'&limit=2&page=2');check(r.body.rows.length===2&&r.body.pagination.totalItems===7&&r.body.pagination.totalPages===4,'report pagination');
  r=await api('reports/products?'+query+'&category='+f.category._id+'&brand='+f.brand._id);check(r.body.rows.length===2,'product category/brand filters');
  r=await api('reports/products?'+query+'&category='+new mongoose.Types.ObjectId());check(r.body.rows.length===0,'unmatched product filter empty state');
  r=await api('reports/inventory?stock=out&brand='+f.brand._id);check(r.body.rows.length===1&&r.body.rows[0].stock===0,'inventory filters');
  for(const bad of ['page=0','limit=101','page=1.5','category=bad','status=Unknown','paymentStatus=Nope'])check((await api('reports/orders?'+query+'&'+bad)).status===400,'invalid report filter rejected '+bad);
  r=await api('reports/products/export?'+query);check(r.status===200&&r.headers['content-type'].includes('text/csv')&&r.text.includes("'=SUM(1,2)")&&!r.text.includes('password'),'CSV export shields spreadsheet formulas and private data');
  check((await api('reports/unknown')).status===404,'unknown report rejected');
  await M.Product.deleteOne({_id:f.other._id});r=await api('reports/products?'+query);check(r.body.rows.some(x=>x.name==='=SUM(1,2)'&&x.revenue===500),'historical sales survive deleted catalog product');
  // Existing order cancellation/return operations alter live analytics immediately.
  await M.Order.updateOne({_id:f.first._id},{status:'Returned'});r=await api('dashboard/summary?'+query);check(r.body.summary.periodRevenue===500,'returned paid order removed from revenue');
  console.log(`Phase 8 API: ${checks} assertions passed.`);
} finally {if(mongoose.connection.readyState){await mongoose.connection.dropDatabase();await mongoose.disconnect();}await db.stop();}
