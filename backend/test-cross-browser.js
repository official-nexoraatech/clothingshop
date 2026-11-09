import assert from 'node:assert/strict';
import { writeFileSync, mkdirSync } from 'node:fs';
import mongoose from 'mongoose';
import { createServer } from 'vite';
import { chromium, firefox, webkit } from 'playwright';
import { startTestDatabase } from './test-support.js';
process.env.JWT_SECRET = 'cross-browser-disposable-secret-not-production';
process.env.AUTH_RATE_LIMIT = '200';
process.env.PHASE9_RATE_LIMIT = '200';
process.env.SMTP_HOST = '';
process.env.CLOUDINARY_CLOUD_NAME = '';
const database = await startTestDatabase();
await mongoose.connect(database.uri);
const M = await import('./src/models/index.js');
for (const model of Object.values(M)) await model.init();
const { default: app } = await import('./src/app.js');
const api = await new Promise(resolve => { const server = app.listen(0,'127.0.0.1',()=>resolve(server)); });
const vite = await createServer({ server: { host:'127.0.0.1',port:0,strictPort:true,proxy:{'/api':'http://127.0.0.1:'+api.address().port} } });
await vite.listen();
const origin='http://127.0.0.1:'+vite.httpServer.address().port;
const results=[]; let browser;
mkdirSync('test-results',{recursive:true});
try {
  const admin=await M.User.create({name:'Cross Browser Admin',email:'admin@cross-browser.test',password:'BrowserPass123!',role:'admin'});
  await M.User.create({name:'Cross Browser Employee',email:'employee@cross-browser.test',password:'BrowserPass123!',role:'employee'});
  const category=await M.Category.create({name:'Cross Browser Category'}),brand=await M.Brand.create({name:'Cross Browser Brand'});
  const product=await M.Product.create({name:'Cross Browser Shirt',slug:'cross-browser-shirt',description:'Real browser integration',category:category._id,brand:brand._id,price:500,status:'active',images:[{url:origin+'/product-placeholder.svg'}]});
  const variant=await M.ProductVariant.create({product:product._id,sku:'CROSS-M',size:'M',color:'Blue',stock:20});
  await M.Coupon.create({code:'CROSS10',discountType:'percentage',discountValue:10,minimumOrderValue:100,startDate:new Date(Date.now()-60000),expiryDate:new Date(Date.now()+86400000),status:'active'});
  for (const [name,engine,options] of [['Chrome',chromium,{executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'}],['Firefox',firefox,{}],['WebKit',webkit,{}]]) {
    let checks=0; const errors=[];
    const check=(value,label)=>{assert.ok(value,name+': '+label);checks++;console.log('PASS '+name+': '+label);};
    browser=await engine.launch({headless:true,...options});
    const page=await browser.newPage({viewport:{width:1440,height:1000}});
    page.on('pageerror',error=>errors.push(error.message));
    const go=async route=>{ await page.waitForLoadState('networkidle'); return page.goto(origin+route,{waitUntil:'networkidle'}); };
    const visible=text=>page.getByText(text,{exact:true}).first().waitFor({state:'visible'});
    const click=label=>page.getByRole('button',{name:label,exact:true}).click();
    const login=async email=>{await go('/login');await page.locator('input[type=email]').fill(email);await page.locator('input[type=password]').fill('BrowserPass123!');await click('Login');await page.waitForURL(url=>!url.pathname.startsWith('/login'));};
    const email=name.toLowerCase()+'@cross-browser.test';
    await go('/customer');await page.waitForURL('**/login');check(true,'anonymous protected route denied');
    await go('/register');
    for(const[field,value]of Object.entries({name:name+' Buyer',email,phone:'9999999999',password:'BrowserPass123!',confirmPassword:'BrowserPass123!'}))await page.locator('input[name='+field+']').fill(value);
    await click('Register');await page.waitForURL('**/customer');
    const user=await M.User.findOne({email});check(Boolean(user),'registration persists account');
    await go('/customer/profile');await page.getByLabel('Full name').fill(name+' Updated Buyer');await page.getByLabel('Phone').fill('8888888888');await click('Save profile');await visible('Profile updated.');
    check((await M.User.findById(user.id)).name===name+' Updated Buyer','profile edit persists');
    await page.reload();assert.equal(await page.getByLabel('Full name').inputValue(),name+' Updated Buyer');check(true,'profile survives refresh');
    await page.getByLabel('Phone').fill('invalid');await click('Save profile');await visible('Enter a valid phone number.');check(true,'profile validates on backend');
    await go('/customer/settings');await page.getByLabel('Email updates').check();await page.getByLabel('SMS updates').check();await click('Save settings');await visible('Contact preferences saved.');
    await page.reload();check(await page.getByLabel('Email updates').isChecked()&&await page.getByLabel('SMS updates').isChecked(),'preferences persist on refresh');
    await page.getByLabel('SMS updates').uncheck();await click('Save settings');await visible('Contact preferences saved.');check(!(await M.User.findById(user.id)).notificationPreferences.sms,'preference opt-out persists');
    await go('/products?search=Cross');await visible('Cross Browser Shirt');check(true,'catalog search uses API');
    await go('/products/'+product.id);await click('Save to wishlist');await visible('Saved to your wishlist.');
    await go('/customer/wishlist');await visible('Cross Browser Shirt');check(true,'wishlist persists');
    await page.getByRole('link',{name:'View product',exact:true}).click();await click('Add to Bag');await visible('Added to your bag.');
    await go('/customer/cart');await visible('Cross Browser Shirt');check(true,'cart persists');
    await go('/customer/addresses');
    for(const[field,value]of Object.entries({fullName:name+' Buyer',phone:'9999999999',line1:'1 Browser Road',city:'Test City',state:'Test State',postalCode:'123456'}))await page.locator('input[name='+field+']').fill(value);
    await click('Add address');await page.locator('.address-card').waitFor();check(await M.Address.countDocuments({user:user.id})===1,'address saved');
    await go('/customer/checkout');await page.getByLabel('Coupon code').fill('CROSS10');await click('Review checkout');await page.getByRole('button',{name:'Place order · Cash on Delivery',exact:true}).waitFor();
    await click('Place order · Cash on Delivery');await page.waitForURL('**/customer/orders/*');await page.getByText('Order placed').first().waitFor();
    const order=await M.Order.findOne({user:user.id});check(order.grandTotal===599,'coupon checkout creates server-calculated order');
    check((await M.ProductVariant.findById(variant.id)).stock===20-results.length-1,'inventory deducted once');
    await login(admin.email);await go('/admin/orders');
    await page.getByRole('row').filter({hasText:order.orderNumber}).getByRole('button',{name:'Manage'}).click();
    for(const label of ['Mark Confirmed','Mark Processing','Mark Shipped','Mark Out for Delivery','Confirm delivery & cash collected'])await click(label);
    await page.getByRole('button',{name:'Confirm return received & restock',exact:true}).waitFor();
    check((await M.Payment.findOne({order:order.id})).status==='Paid','admin delivery records COD payment');
    await login(email);await go('/products/'+product.id);await page.getByLabel('Review',{exact:true}).fill(name+' delivered purchase review');await click('Submit review');await visible('Review submitted.');
    check(await M.Review.countDocuments({user:user.id,order:order.id})===1,'delivered purchase review persists');
    await go('/customer/support');await page.getByLabel('Subject',{exact:true}).fill(name+' support');await page.getByLabel('Description',{exact:true}).fill('Help with this purchase');await click('Open ticket');await page.getByLabel('Reply',{exact:true}).waitFor();
    const ticket=await M.SupportTicket.findOne({customer:user.id});check(Boolean(ticket),'support ticket created');
    await login(admin.email);await go('/admin/support');await page.getByRole('button').filter({hasText:ticket.ticketNumber}).click();await page.getByLabel('Reply',{exact:true}).fill(name+' staff reply');await click('Send reply');await visible(name+' staff reply');check(true,'staff reply persisted and displayed');
    await page.getByLabel('Ticket status').selectOption('Resolved');await page.waitForFunction(()=>document.querySelector('select:disabled')===null);
    await login(email);await go('/customer/support');await page.getByRole('button').filter({hasText:ticket.ticketNumber}).click();await visible(name+' staff reply');check(true,'customer reads staff reply');
    await go('/customer/notifications');await click('Mark all read');await visible('Notifications (0 unread)');check(true,'notification read counts agree');
    await go('/admin');await page.waitForURL('**/customer');check(true,'customer cannot enter admin');
    for(const width of [390,768,1440]){
      await page.setViewportSize({width,height:1000});
      for(const route of ['/products','/customer','/customer/profile','/customer/settings','/customer/cart','/customer/checkout','/customer/notifications','/customer/support']){
        await go(route);await page.locator('.page-content,.catalog-layout').first().waitFor();
        const fits = await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth);
        if (!fits) { await page.screenshot({path:'test-results/overflow-'+name+'.png'}); console.log(await page.evaluate(()=>Array.from(document.querySelectorAll('body *')).map(el=>({tag:el.tagName,classes:el.className,right:el.getBoundingClientRect().right,width:el.getBoundingClientRect().width})).filter(el=>el.right>innerWidth+1).slice(0,20))); }
        check(fits,width+'px layout '+route);
        if (route === '/products' && width === 390) await page.screenshot({path:'test-results/catalog-mobile-'+name+'.png',fullPage:true});
      }
    }
    await login('employee@cross-browser.test');await go('/admin/customers');await page.waitForURL('**/employee');check(true,'employee admin restriction');
    for(const route of ['/employee/orders','/employee/inventory','/employee/notifications']){await go(route);await page.locator('.page-content').waitFor();check(true,'employee route '+route);}
    await login(email);await go('/customer/profile');await page.getByRole('button',{name:'Logout',exact:true}).click();await page.waitForURL('**/login');check(await page.evaluate(()=>localStorage.getItem('authToken')===null),'logout clears session');
    await go('/missing-page');await page.getByText('404',{exact:true}).waitFor();check(true,'404 route');
    check(errors.length===0,'no uncaught browser exceptions '+errors.join(', '));
    results.push({browser:name,checks,status:'passed'});
    writeFileSync('test-results/cross-browser.json',JSON.stringify({results},null,2));
    await browser.close();browser=null;
    console.log(name+': '+checks+' checks passed.');
  }
} finally {
  await browser?.close();await vite.close();await new Promise(resolve=>api.close(resolve));
  await mongoose.connection.dropDatabase();await mongoose.disconnect();await database.stop();
}
