import assert from 'node:assert/strict';
import * as models from './src/models/index.js';
const expected = ['User','Category','Brand','Product','ProductVariant','Cart','Wishlist','Address','Order','OrderItem','Payment','Coupon','Review','InventoryLog','Notification','ContactMessage','PasswordResetToken','ShopSettings','SupportTicket','SupportMessage'];
assert.deepEqual(Object.keys(models).sort(), expected.sort());
for (const [name, model] of Object.entries(models)) { assert.ok(model.schema); console.info(`✓ ${name}`); }
const invalidVariant = new models.ProductVariant({ sku: 'X', size: 'M', color: 'Blue', stock: -1 });
await assert.rejects(invalidVariant.validate()); console.info('✓ validation and model compilation');

