import { startTestDatabase } from './test-support.js';
import mongoose from 'mongoose';
import InventoryLog from './src/models/InventoryLog.js';
import dotenv from 'dotenv'; dotenv.config({ path: new URL('./.env', import.meta.url) });
import request from 'supertest';
import { connectDatabase } from './src/config/database.js';
import User from './src/models/User.js'; import Category from './src/models/Category.js'; import Brand from './src/models/Brand.js'; import Product from './src/models/Product.js'; import ProductVariant from './src/models/ProductVariant.js';
import { createToken } from './src/utils/jwt.js';
const testDatabase = await startTestDatabase(); process.env.MONGO_URI = testDatabase.uri;
await connectDatabase(); const { default: app } = await import('./src/app.js');
const marker=`catalog-test-${Date.now()}`, email=`${marker}@example.test`; const check=(condition,message)=>{if(!condition)throw new Error(message)};
try { const admin=await User.create({name:'Catalog Admin',email,phone:'9999999999',password:'CatalogTest!123',role:'admin'}); const customer=await User.create({name:'Catalog Customer',email:`customer-${email}`,phone:'9999999998',password:'CatalogTest!123',role:'customer'}); const token=createToken(admin), customerToken=createToken(customer); const auth={Authorization:`Bearer ${token}`};
  let r=await request(app).post('/api/categories').set(auth).send({name:marker,description:'Catalog test category'});check(r.status===201,'admin category create failed');const category=r.body.category;
  r=await request(app).post('/api/categories').set(auth).send({name:marker});check(r.status===409,'duplicate category was not rejected');
  r=await request(app).post('/api/brands').set(auth).send({name:marker});check(r.status===201,'admin brand create failed');const brand=r.body.brand;
  r=await request(app).post('/api/products').set({Authorization:`Bearer ${customerToken}`}).send({name:marker,description:'x',category:category._id,brand:brand._id,price:100});check(r.status===403,'customer product creation was not forbidden');
  r=await request(app).post('/api/products').set(auth).send({name:marker,description:'A searchable catalog product',category:category._id,brand:brand._id,price:100,discount:10,status:'active',images:[{url:'https://example.test/product.jpg',isPrimary:true}]});check(r.status===201,'admin product create failed');const product=r.body.product;
  r=await request(app).post(`/api/products/${product._id}/variants`).set(auth).send({sku:marker,size:'M',color:'Blue',stock:4});check(r.status===201,'variant create failed');
  r=await request(app).post(`/api/products/${product._id}/variants`).set(auth).send({sku:`${marker}-2`,size:'M',color:'Blue',stock:4});check(r.status===409,'duplicate variant was not rejected');
  r=await request(app).get(`/api/products?search=${marker}&category=${category._id}&brand=${brand._id}&size=M&color=Blue&availability=in_stock&sort=price_asc&page=1&limit=1`);check(r.status===200&&r.body.products.length===1&&r.body.pagination.totalItems===1,'public search/filter/pagination failed');
  r=await request(app).get(`/api/products/${product._id}`);check(r.status===200&&r.body.product.effectivePrice===90,'public details/effective price failed');
  r=await request(app).patch(`/api/products/${product._id}`).set(auth).send({price:-1});check(r.status===400,'negative price was accepted');
  r=await request(app).post('/api/products').set(auth).send({name:marker+'-draft',description:'Draft audit',category:category._id,brand:brand._id,price:99.5,status:'draft'});
  check(r.status===201,'draft create failed'); const draft=r.body.product;
  r=await request(app).get('/api/products?all=true').set(auth);check(r.body.products.some(p=>p._id===draft._id),'admin draft visibility failed');
  for(const headers of [{},{Authorization:`Bearer ${customerToken}`}]) {r=await request(app).get('/api/products?all=true').set(headers);check(!r.body.products.some(p=>p._id===draft._id),'draft exposed publicly');r=await request(app).get('/api/products/'+draft._id).set(headers);check(r.status===404,'draft detail exposed');}
  check((await request(app).get('/api/products?all=true').set('Authorization','Bearer invalid')).status===401,'invalid token accepted');
  r=await request(app).patch('/api/categories/'+category._id).set(auth).send({status:'inactive'});check(r.status===200,'category deactivate failed');
  check((await request(app).get('/api/categories?all=true').set(auth)).body.categories.some(c=>c._id===category._id),'admin inactive category missing');
  check(!(await request(app).get('/api/categories?all=true')).body.categories.some(c=>c._id===category._id),'inactive category exposed');
  for(const page of ['0','-1','1.5','bad'])check((await request(app).get('/api/products?page='+page)).status===400,'invalid page accepted');
  const extra=await Product.insertMany(Array.from({length:51},(_,i)=>({name:marker+'-'+i,slug:marker+'-'+i,description:'Pagination',category:category._id,brand:brand._id,price:1,status:'draft'})));
  r=await request(app).get('/api/products?all=true&limit=50&page=2').set(auth);check(r.body.pagination.totalItems===53&&r.body.products.length===3,'pagination beyond 50 failed');
  r=await request(app).get('/api/products/'+product._id).set(auth);const variant=r.body.product.variants[0];
  r=await request(app).patch(`/api/products/${product._id}/variants/${variant._id}`).set(auth).send({price:42.25,status:'inactive'});check(r.status===200&&r.body.variant.price===42.25,'variant edit failed');
  r=await request(app).get('/api/products/'+product._id).set(auth);check(r.body.product.variants.length===1,'inactive variant missing for admin');
  r=await request(app).patch(`/api/products/${product._id}/variants/${variant._id}`).set(auth).send({price:null,status:'active'});check(r.status===200&&r.body.variant.price===undefined,'variant price reset failed');
  check((await request(app).patch(`/api/products/${product._id}/variants/${variant._id}`).set(auth).send({stock:99})).status===409,'stock audit bypass allowed');
  for (const logo of ['javascript:alert(1)','ftp://example.com/logo','https://',{},42]) {
    check((await request(app).post('/api/brands').set(auth).send({name:marker+'-bad',logo})).status===400,'invalid create logo accepted');
    check((await request(app).patch('/api/brands/'+brand._id).set(auth).send({logo})).status===400,'invalid update logo accepted');
  }
  r=await request(app).patch('/api/brands/'+brand._id).set(auth).send({logo:' https://example.com/logo.png '});check(r.status===200&&r.body.brand.logo==='https://example.com/logo.png','valid logo not trimmed');
  r=await request(app).patch('/api/brands/'+brand._id).set(auth).send({logo:''});check(r.status===200&&r.body.brand.logo==='','logo cannot be cleared');
  check((await request(app).delete('/api/brands/'+brand._id).set(auth)).status===409,'used brand deletion allowed');
  check((await request(app).patch('/api/brands/'+brand._id).set('Authorization',`Bearer ${customerToken}`).send({name:'Forbidden'})).status===403,'customer brand update allowed');
  await Product.deleteMany({_id:{$in:[draft._id,...extra.map(p=>p._id)]}});
  console.info('Catalog API tests passed, including admin visibility, privacy, pagination, decimals and variant editing.');
} finally { const variants=await ProductVariant.find({sku:new RegExp(marker,'i')}); await InventoryLog.deleteMany({variant:{$in:variants.map(v=>v._id)}}); await ProductVariant.deleteMany({sku:new RegExp(marker,'i')}); const products=await Product.find({name:marker}); await ProductVariant.deleteMany({product:{$in:products.map(x=>x._id)}}); await Product.deleteMany({name:marker}); await Category.deleteMany({name:marker}); await Brand.deleteMany({name:marker}); await User.deleteMany({email:{$regex:marker}}); await mongoose.connection.dropDatabase(); await mongoose.disconnect(); await testDatabase.stop(); }
