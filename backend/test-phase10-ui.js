import { startTestDatabase } from './test-support.js';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import mongoose from 'mongoose';
import { createServer } from 'vite';
import * as M from './src/models/index.js';
process.env.AUTH_RATE_LIMIT = '200';
process.env.JWT_SECRET = 'phase7-browser-test-secret-not-production';
const testDatabase = await startTestDatabase();
await mongoose.connect(testDatabase.uri);
const { default: app } = await import('./src/app.js');
const api = app.listen(5511, '127.0.0.1');
const vite = await createServer({ server: { host: '127.0.0.1', port: 5181, strictPort: true, proxy: { '/api': 'http://127.0.0.1:5511' } } });
await vite.listen();
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'clothing-phase7-chrome-'));
const chromePath = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const chrome = spawn(chromePath, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=9231', `--user-data-dir=${profile}`, 'about:blank'], { windowsHide: true, stdio: 'ignore' });
let socket, checks = 0, sequence = 0;
const pending = new Map(), runtimeErrors = [], consoleErrors = [];
const delay = ms => new Promise(r => setTimeout(r, ms));
const check = (value, name) => { assert.ok(value, name); checks++; console.log(`PASS ${name}`); };
const send = (method, params = {}) => new Promise((resolve, reject) => { const id = ++sequence; pending.set(id, {resolve,reject}); socket.send(JSON.stringify({id,method,params})); });
const evaluate = async expression => { const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); if(r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' ' + JSON.stringify(r.exceptionDetails.exception)); return r.result.value; };
const until = async (expression, message) => { for(let i=0;i<100;i++){ if(await evaluate(expression)) return; await delay(100); } throw new Error(`Timed out: ${message}\n${await evaluate('document.body.innerText')}`); };
const click = async label => { await until(`Array.from(document.querySelectorAll('button,a')).some(e=>e.textContent.trim()===${JSON.stringify(label)} && !e.disabled)`,label); await evaluate(`Array.from(document.querySelectorAll('button,a')).find(e=>e.textContent.trim()===${JSON.stringify(label)}).click()`); };
const navigate = async route => { await send('Page.navigate', {url:`http://127.0.0.1:5181${route}`}); await delay(150); };
try {
  let tabs;
  for (let i=0;i<50;i++) { try { tabs=await (await fetch('http://127.0.0.1:9231/json')).json(); break; } catch { await delay(200); } }
  assert.ok(tabs?.length, 'Chrome debugging available');
  socket = new WebSocket(tabs.find(t => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve,reject) => { socket.onopen=resolve; socket.onerror=reject; });
  socket.onmessage = ({data}) => { const msg=JSON.parse(data); if(msg.method==='Runtime.exceptionThrown') runtimeErrors.push(msg.params.exceptionDetails.text); if(msg.method==='Runtime.consoleAPICalled' && ['error','warning'].includes(msg.params.type)) consoleErrors.push(msg.params.args.map(x=>x.value || x.description || '').join(' ')); const p=pending.get(msg.id); if(p){pending.delete(msg.id); if(msg.error)p.reject(new Error(msg.error.message)); else p.resolve(msg.result);} };
  await send('Page.enable'); await send('Runtime.enable');
  const fill = async (selector, value) => evaluate(`(() => { const el=document.querySelector(${JSON.stringify(selector)}); if(!el)throw Error('Missing field'); const proto=el.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:el.tagName==='SELECT'?HTMLSelectElement.prototype:HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(proto,'value').set.call(el,${JSON.stringify(value)}); el.dispatchEvent(new Event(el.tagName==='SELECT'?'change':'input',{bubbles:true})); })()`);
  const submit = () => evaluate("document.querySelector('form.stacked-form').requestSubmit()");
  const login = async (role) => {
    await navigate('/login');
    await until("!!document.querySelector('input[type=email]')", 'login form');
    await fill('input[type=email]', role + '@phase10-browser.test');
    await fill('input[type=password]', 'BrowserTest123!');
    await submit();
    await until("location.pathname === '/" + role + "'", role + ' login');
  };
  for (const model of Object.values(M)) await model.init();
  const users = {};
  for (const role of ['admin','employee']) users[role] = await M.User.create({name:'Browser '+role,email:role+'@phase10-browser.test',password:'BrowserTest123!',role});
  const category=await M.Category.create({name:'Browser Category'}),brand=await M.Brand.create({name:'Browser Brand'});
  const product=await M.Product.create({name:'Integration Browser Shirt',slug:'integration-browser-shirt',description:'Test product',category:category._id,brand:brand._id,price:500,status:'active',images:[{url:'http://127.0.0.1:5181/product-placeholder.svg'}]});
  const variant=await M.ProductVariant.create({product:product._id,sku:'PHASE10-BROWSER',size:'M',color:'Blue',stock:10});
  await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
  await navigate('/customer/cart'); await until("location.pathname === '/login'",'anonymous protected redirect'); check(true,'anonymous protected route redirects');
  await navigate('/register'); await until("!!document.querySelector('input[name=name]')",'register form');
  for (const [name,value] of Object.entries({name:'Integration Browser Buyer',email:'customer@phase10-browser.test',phone:'9999999999',password:'BrowserTest123!',confirmPassword:'BrowserTest123!'})) await fill('input[name='+name+']',value);
  await submit(); await until("location.pathname === '/customer' && document.body.innerText.includes('No orders yet.')",'registered dashboard');
  users.customer = await M.User.findOne({email:'customer@phase10-browser.test'});
  check(Boolean(users.customer),'browser registration persists user and opens real empty dashboard');
  check(await evaluate("!document.body.innerText.includes('Riya') && document.body.innerText.includes('Integration Browser Buyer')"),'dashboard uses authenticated data');
  await navigate('/customer/profile'); await until("!!document.querySelector('input[type=email]')",'profile');
  check(await evaluate("document.querySelector('input[type=email]').value === 'customer@phase10-browser.test'"),'profile displays actual account');
  await click('Logout'); await until("location.pathname === '/login'",'logout');
  check(await evaluate("localStorage.getItem('authToken') === null"),'logout clears token and protected state');
  await login('customer'); check(true,'customer login through form');
  await send('Page.reload'); await until("document.body.innerText.includes('Integration Browser Buyer')",'restored account'); check(true,'refresh restores session');
  await navigate('/products?search=Integration'); await until("document.body.innerText.includes('Integration Browser Shirt')",'search');
  await evaluate("document.querySelector('button.wishlist-button').click()");
  await until("document.body.innerText.includes('Saved to your wishlist.')",'card wishlist');
  await navigate('/customer/wishlist'); await until("document.body.innerText.includes('Integration Browser Shirt')",'wishlist');
  check(true,'catalog wishlist button persists real item');
  await click('View product'); await until("document.body.innerText.includes('Add to Bag')",'wishlist navigation');
  check(true,'wishlist unmount and product navigation work without React cleanup error');
  await click('Add to Bag'); await until("document.body.innerText.includes('Added to your bag.')",'add');
  await navigate('/customer/cart'); await until("document.body.innerText.includes('Integration Browser Shirt')",'cart persisted'); check(true,'cart state persists across navigation');
  await navigate('/customer/support'); await until("document.body.innerText.includes('Create support ticket')",'support');
  await fill('input', 'Browser support issue'); await fill('textarea','Please help with my order.');
  await click('Open ticket'); await until("document.body.innerText.includes('SUP-') && !!document.querySelector('section textarea')",'created ticket');
  let ticket=await M.SupportTicket.findOne({customer:users.customer._id});
  check(Boolean(ticket),'customer creates ticket through UI');
  await fill('section textarea','Customer follow-up'); await click('Send reply');
  await until("document.body.innerText.includes('Customer follow-up')",'customer reply'); check(true,'customer reply refreshes conversation');
  await click('Logout'); await login('admin'); await navigate('/admin/support');
  await until("document.body.innerText.includes('Browser support issue')",'staff listing');
  await evaluate("document.querySelector('button.list-row').click()");
  await until("!!document.querySelector('section textarea')",'staff conversation');
  await fill('section textarea','Staff response received'); await click('Send reply');
  await until("document.body.innerText.includes('Staff response received')",'staff reply');
  check(await evaluate("!document.querySelector('.form-error') && document.querySelector('textarea').value === ''"),'staff reply clears form and shows persisted message without event error');
  await M.SupportTicket.updateOne({_id:ticket._id},{assignedTo:users.employee._id});
  await click('Logout'); await login('employee'); await navigate('/employee/support');
  await until("document.body.innerText.includes('Browser support issue')",'assigned ticket'); check(true,'employee views assigned ticket');
  await navigate('/admin/customers'); await until("location.pathname === '/employee'",'employee restriction'); check(true,'employee admin route denied');
  await click('Logout'); await login('customer'); await navigate('/customer/support');
  await until("!!document.querySelector('button.list-row')",'customer tickets'); await evaluate("document.querySelector('button.list-row').click()");
  await until("document.body.innerText.includes('Staff response received')",'customer sees staff'); check(true,'customer reads staff reply');
  await navigate('/customer/notifications'); await until("document.body.innerText.includes('New ticket reply')",'notifications'); await click('Mark all read');
  await until("document.body.innerText.includes('(0 unread)')",'read all'); check(true,'notification event and unread count agree');
  await send('Network.enable'); await send('Network.setBlockedURLs',{urls:['*notifications/read-all*']});
  await click('Mark all read'); await until("document.body.innerText.includes('Unable to reach')",'failed mutation'); check(true,'notification mutation failure is visible without unhandled rejection');
  await send('Network.setBlockedURLs',{urls:[]}); await click('Retry'); await until("!document.querySelector('.form-error')",'notification recovery'); check(true,'notification request recovers');
  await navigate('/customer/addresses'); await until("!!document.querySelector('input[name=fullName]')",'checkout address');
  for (const [name,value] of Object.entries({fullName:'Browser Buyer',phone:'9999999999',line1:'Checkout Road',city:'Test City',state:'Test State',postalCode:'123456'})) await fill('input[name='+name+']',value);
  await click('Add address'); await until("document.body.innerText.includes('Checkout Road')",'checkout address saved');
  await M.Coupon.create({code:'BROWSER10',discountType:'percentage',discountValue:10,minimumOrderValue:100,startDate:new Date(Date.now()-60000),expiryDate:new Date(Date.now()+86400000),status:'active'});
  await navigate('/customer/checkout'); await until("document.body.innerText.includes('Checkout Road')",'checkout address selected');
  await fill('.page-content input:not([type=radio])','BROWSER10'); await click('Review checkout');
  await until("document.body.innerText.includes('₹599.00')",'discounted checkout total');
  await click('Place order · Cash on Delivery'); await until("location.pathname.startsWith('/customer/orders/') && document.body.innerText.includes('Order placed')",'real order placed');
  const order=await M.Order.findOne({user:users.customer._id});
  check(order.grandTotal===599 && (await M.ProductVariant.findById(variant._id)).stock===9,'registered customer checkout applies coupon and deducts stock');
  await click('Logout'); await login('admin'); await navigate('/admin/orders'); await click('Manage');
  for (const label of ['Mark Confirmed','Mark Processing','Mark Shipped','Mark Out for Delivery','Confirm delivery & cash collected']) await click(label);
  await until("document.body.innerText.includes('Confirm return received & restock')",'order delivered');
  check((await M.Payment.findOne({order:order._id})).status==='Paid','admin delivery records payment for browser-created order');
  await click('Logout'); await login('customer');
  await navigate('/products/'+product._id); await until("document.body.innerText.includes('Write a review')",'review form');
  await fill('textarea','Excellent browser-tested shirt'); await click('Submit review'); await until("document.body.innerText.includes('Review submitted.') && document.body.innerText.includes('Excellent browser-tested shirt')",'review');
  check((await M.Review.countDocuments({user:users.customer._id}))===1,'review UI persists and refreshes public listing');
  await navigate('/customer/notifications'); await until("document.body.innerText.includes('Review submitted')",'review notification'); check(true,'review event notification shown');
  await M.Notification.insertMany(Array.from({length:25},(_,i)=>({recipient:users.customer._id,type:'Support',title:'More '+i,message:'Test pagination'})));
  await send('Page.reload'); await until("document.body.innerText.includes('More 24')",'many notifications'); await click('Next'); await until("document.body.innerText.includes('Page 2')",'notification page 2'); check(true,'notification next page reachable');
  for (const width of [390,768,1440]) {
    await send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width===390});
    for (const route of ['/customer','/customer/cart','/customer/wishlist','/customer/checkout','/customer/addresses','/customer/orders','/customer/notifications','/customer/support','/customer/profile','/products','/products/'+product._id]) {
      await navigate(route); await delay(450);
      if (route === '/customer/support') { await evaluate("document.querySelector('.page-content').scrollIntoView()"); const shot = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(path.join(profile, 'support-' + width + '.png'), Buffer.from(shot.data,'base64')); }
      check(await evaluate('document.documentElement.scrollWidth <= innerWidth'), width+'px no page overflow '+route);
    }
  }
  await navigate('/customer/addresses'); await until("!!document.querySelector('input[name=fullName]')",'address form');
  for (const [name,value] of Object.entries({fullName:'Browser Buyer',phone:'9999999999',line1:'1 Test Road',city:'Test City',state:'Test State',postalCode:'123456'})) await fill('input[name='+name+']',value);
  await evaluate("document.querySelector('input[name=isDefault]').click()"); await click('Add address'); await until("document.body.innerText.includes('1 Test Road')",'saved address');
  check((await M.Address.countDocuments({user:users.customer._id}))===2,'address form persists real address');
  check((await M.Address.findOne({user:users.customer._id,isDefault:true})).line1==='1 Test Road','browser switches default address without duplicate-key failure');
  await click('Edit'); await fill('input[name=line1]','2 Test Road'); await click('Save address'); await until("document.body.innerText.includes('2 Test Road')",'edited address');
  check(true,'address edit updates view');
  await navigate('/products/'+product._id); await until("document.body.innerText.includes('Edit review')",'own review actions'); await click('Edit review');
  await fill('textarea','Edited browser review'); await click('Save review'); await until("document.body.innerText.includes('Review updated.')",'review edited');
  check((await M.Review.findOne({user:users.customer._id})).text==='Edited browser review','review edit persists');
  await click('Delete review'); await until("document.body.innerText.includes('Review deleted.')",'review deleted'); check((await M.Review.countDocuments({user:users.customer._id}))===0,'review delete persists');
  await navigate('/contact'); await until("!!document.querySelector('input[name=subject]')",'contact form');
  for (const [name,value] of Object.entries({name:'Browser Contact',email:'contact@phase10-browser.test',phone:'9999999999',subject:'Browser contact issue'})) await fill('input[name='+name+']',value);
  await fill('textarea','Browser contact message'); await click('Submit'); await until("document.body.innerText.includes('Your message has been received.')",'contact saved');
  check((await M.ContactMessage.countDocuments({subject:'Browser contact issue'}))===1,'public contact UI persists message');
  await navigate('/customer'); await until("document.body.innerText.includes('Logout')",'customer navigation');
  await click('Logout'); await login('admin'); await navigate('/admin/contact-messages'); await until("document.body.innerText.includes('Browser contact issue')",'admin contact');
  await fill('tbody select','Resolved'); await until("document.querySelector('tbody select')?.value === 'Resolved'",'contact status');
  check((await M.ContactMessage.findOne({subject:'Browser contact issue'})).status==='Resolved','admin contact status updates');
  for (const width of [390,768,1440]) {
    await send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width===390});
    for (const route of ['/admin/support','/admin/reviews','/admin/notifications','/admin/contact-messages']) { await navigate(route); await delay(400); check(await evaluate('document.documentElement.scrollWidth <= innerWidth'),width+'px no page overflow '+route); }
  }
  await click('Logout'); await login('employee');
  for (const width of [390,768,1440]) {
    await send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width===390});
    for (const route of ['/employee','/employee/orders','/employee/inventory','/employee/notifications','/employee/support']) { await navigate(route); await delay(400); check(await evaluate('document.documentElement.scrollWidth <= innerWidth'),width+'px no page overflow '+route); }
  }
  await click('Logout'); await login('customer');
  await send('Network.setBlockedURLs',{urls:['*/api/auth/me']}); await navigate('/customer/orders');
  await until("document.body.innerText.includes('Retry session')",'session unavailable');
  check(await evaluate("Boolean(localStorage.getItem('authToken'))"),'temporary auth network failure preserves token');
  await send('Network.setBlockedURLs',{urls:[]}); await click('Retry session'); await until("document.body.innerText.includes('ORD-')",'session recovered'); check(true,'session recovery retries backend');
  await navigate('/customer/notifications'); await until("document.body.innerText.includes('Mark all read')",'expiry setup');
  await M.User.updateOne({_id:users.customer._id},{status:'blocked'});
  await click('Mark all read'); await until("location.pathname === '/login'",'blocked session redirect');
  check(await evaluate("localStorage.getItem('authToken') === null"),'API 401 immediately clears stale session');
  await M.User.updateOne({_id:users.customer._id},{status:'active'});
  await login('customer');
  await evaluate("localStorage.setItem('authToken','invalid-token')");
  await send('Page.reload'); await until("location.pathname === '/login'",'invalid refresh'); check(true,'invalid stored token rejected on refresh');
  await navigate('/forgot-password'); await until("!!document.querySelector('input[type=email]')",'forgot form');
  await fill('input[type=email]','customer@phase10-browser.test'); await click('Request reset');
  await until("!!document.querySelector('code')",'development reset issued');
  const resetToken=await evaluate("document.querySelector('code').textContent");
  await navigate('/reset-password'); await until("!!document.querySelector('input[name=token]')",'reset form');
  for (const [name,value] of Object.entries({token:resetToken,password:'ResetBrowserTest123!',confirmPassword:'ResetBrowserTest123!'})) await fill('input[name='+name+']',value);
  await submit(); await until("location.pathname === '/login'",'reset complete');
  await fill('input[type=email]','customer@phase10-browser.test'); await fill('input[type=password]','ResetBrowserTest123!'); await submit();
  await until("location.pathname === '/customer'",'reset login'); check(true,'browser password recovery and new-password login work');
  await navigate('/not-a-route'); await until("document.body.innerText.includes('404')",'404'); check(true,'frontend 404 route renders');
  check(consoleErrors.length===0,'no browser console errors or warnings: '+consoleErrors.join(', '));
  check(runtimeErrors.length===0,'no browser JavaScript exceptions: '+runtimeErrors.join(', '));
  console.log('Phase 10 browser: '+checks+' assertions passed. Visual checks: '+profile);
} finally {
  socket?.close(); chrome.kill(); await vite.close(); await new Promise(r=>api.close(r)); await mongoose.connection.dropDatabase(); await mongoose.disconnect(); await testDatabase.stop();
}







