import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import * as models from './src/models/index.js';

const product = new mongoose.Types.ObjectId();
const variant = new mongoose.Types.ObjectId();
await assert.rejects(new models.Cart({ user: new mongoose.Types.ObjectId(), items: [{ product, variant, quantity: 1, unitPrice: 100 }, { product, variant, quantity: 2, unitPrice: 100 }] }).validate());
await assert.rejects(new models.Wishlist({ user: new mongoose.Types.ObjectId(), products: [product, product] }).validate());
assert.ok(models.Address.schema.indexes().some(([fields, options]) => fields.user === 1 && fields.isDefault === 1 && options.unique && options.partialFilterExpression?.isDefault));
assert.ok(models.ProductVariant.schema.indexes().some(([fields, options]) => fields.product === 1 && fields.size === 1 && fields.color === 1 && options.unique));
assert.ok(models.PasswordResetToken.schema.indexes().some(([fields, options]) => fields.expiresAt === 1 && options.expireAfterSeconds === 0));
console.info('Database integrity constraints verified');
