import assert from 'node:assert/strict';
import { test } from 'node:test';
import request from 'supertest';
import * as catalog from './src/controllers/catalogController.js';
import ProductVariant from './src/models/ProductVariant.js';

test('backend starts and every catalog route registers function handlers', async () => {
  const { default: router } = await import('./src/routes/catalogRoutes.js');
  for (const layer of router.stack) {
    for (const handler of layer.route.stack) assert.equal(typeof handler.handle, 'function');
  }
  const route = router.stack.find(layer => layer.route.path === '/products/:id/variants/:variantId' && layer.route.methods.delete);
  assert.equal(route.route.stack.at(-1).handle, catalog.deleteVariant);
  const { default: app } = await import('./src/app.js');
  await request(app).delete('/api/products/507f1f77bcf86cd799439011/variants/507f1f77bcf86cd799439012').expect(401);
});

test('deleteVariant scopes deletion to the parent and forwards errors', async t => {
  const params = { id: '507f1f77bcf86cd799439011', variantId: '507f1f77bcf86cd799439012' };
  const otherProduct = '507f1f77bcf86cd799439013';
  const variants = new Map([[params.variantId, { _id: params.variantId, product: params.id }]]);
  const remove = t.mock.method(ProductVariant, 'findOneAndDelete', async filter => {
    const variant = variants.get(filter._id);
    if (!variant || variant.product !== filter.product) return null;
    variants.delete(filter._id);
    return variant;
  });
  let status, sent = false, error;
  const res = { status(value) { status = value; return this; }, send() { sent = true; } };
  const next = value => { error = value; };
  await catalog.deleteVariant({ params: { ...params, id: otherProduct } }, res, next);
  assert.equal(error.status, 404);
  assert.equal(variants.has(params.variantId), true);
  assert.equal(sent, false);
  error = undefined;
  await catalog.deleteVariant({ params }, res, next);
  assert.equal(status, 204);
  assert.equal(sent, true);
  assert.equal(error, undefined);
  assert.equal(variants.size, 0);
  assert.deepEqual(remove.mock.calls[1].arguments[0], { _id: params.variantId, product: params.id });
  sent = false;
  await catalog.deleteVariant({ params }, res, next);
  assert.equal(error.status, 404);
  assert.equal(error.message, 'Variant not found.');
  assert.equal(sent, false);
  const failure = new Error('Database failure');
  remove.mock.mockImplementation(async () => { throw failure; });
  await catalog.deleteVariant({ params }, res, next);
  assert.equal(error, failure);
});
