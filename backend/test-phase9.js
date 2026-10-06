import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import request from 'supertest';
import { startTestDatabase } from './test-support.js';
import { createToken } from './src/utils/jwt.js';
process.env.JWT_SECRET = 'phase9-isolated-test-secret-not-for-production';
const database = await startTestDatabase(); await mongoose.connect(database.uri);
const M = await import('./src/models/index.js'); const { default: app } = await import('./src/app.js');
let checks = 0; const check = (value, message) => { assert.ok(value, message); checks++; console.log(`PASS ${message}`); };
try {
  for (const model of Object.values(M)) await model.init();
  const user = await M.User.create({ name:'Buyer',email:'buyer@phase9.test',password:'TestPass!123',role:'customer' });
  const other = await M.User.create({ name:'Other',email:'other@phase9.test',password:'TestPass!123',role:'customer' });
  const admin = await M.User.create({ name:'Admin',email:'admin@phase9.test',password:'TestPass!123',role:'admin' });
  const api = (who, method, path, body) => { let result=request(app)[method](`/api${path}`); if(who)result=result.set('Authorization',`Bearer ${createToken(who)}`); return body===undefined?result:result.send(body); };
  const category=await M.Category.create({name:'Phase 9'}),brand=await M.Brand.create({name:'Phase 9'});
  const product=await M.Product.create({name:'Review Shirt',slug:'review-shirt',description:'Test product',category:category._id,brand:brand._id,price:100,status:'active'});
  const variant=await M.ProductVariant.create({product:product._id,sku:'P9-S',size:'S',color:'Black',stock:10});
  const order=await M.Order.create({user:user._id,orderNumber:'P9-DELIVERED',shippingAddress:{snapshot:{fullName:'Buyer',phone:'1',line1:'Road',city:'City',state:'State',postalCode:'1',country:'India'}},subtotal:100,grandTotal:100,status:'Delivered',paymentStatus:'Paid'});
  await M.OrderItem.create({order:order._id,product:product._id,variant:variant._id,productName:product.name,sku:variant.sku,quantity:1,unitPrice:100,subtotal:100});
  check((await api(null,'post','/reviews',{productId:product._id,rating:5,text:'Good'})).status===401,'review requires authentication');
  check((await api(user,'post','/reviews',{productId:product._id,rating:6,text:'Bad rating'})).status===400,'invalid rating rejected');
  let response=await api(user,'post','/reviews',{productId:product._id,rating:5,text:'Great shirt'}); check(response.status===201,'delivered customer can review'); const review=response.body.review;
  check((await api(user,'post','/reviews',{productId:product._id,rating:5,text:'Duplicate'})).status===409,'duplicate purchase review blocked');
  response=await api(null,'get',`/products/${product._id}/reviews`); check(response.status===200&&response.body.summary.average===5&&response.body.reviews.length===1,'public review summary uses saved data');
  check((await api(other,'patch',`/reviews/${review._id}`,{text:'Hijack'})).status===403,'foreign review edit blocked');
  check((await api(user,'get','/notifications/unread-count')).body.count===1,'review notification created');
  response=await api(user,'get','/notifications'); check(response.status===200&&response.body.notifications.length===1,'user reads own notifications');
  check((await api(other,'patch',`/notifications/${response.body.notifications[0]._id}/read`)).status===404,'foreign notification mutation blocked');
  check((await api(user,'patch','/notifications/read-all')).body.updated===1,'mark all notifications read works');
  response=await api(user,'post','/support/tickets',{subject:'Need help',description:'Order question',category:'Order',priority:'High'}); check(response.status===201,'customer creates support ticket'); const ticket=response.body.ticket;
  check((await api(other,'get',`/support/tickets/${ticket._id}`)).status===403,'foreign ticket is blocked');
  check((await api(user,'post',`/support/tickets/${ticket._id}/messages`,{message:'More detail'})).status===201,'customer replies to own ticket');
  check((await api(admin,'patch',`/support/tickets/${ticket._id}`,{status:'In Progress'})).status===200,'admin updates ticket status');
  response=await api(admin,'get',`/support/tickets/${ticket._id}`); check(response.status===200&&response.body.messages.length===1,'staff sees ticket conversation');
  console.log(`Phase 9: ${checks} assertions passed.`);
} finally { await mongoose.connection.dropDatabase(); await mongoose.disconnect(); await database.stop(); }

