import mongoose from 'mongoose';
import { quote, priceFor, money, couponDiscount, transaction } from '../services/checkout.js';
import Cart from '../models/Cart.js';
import Wishlist from '../models/Wishlist.js';
import Address from '../models/Address.js';
import Product from '../models/Product.js';
import ProductVariant from '../models/ProductVariant.js';

const validId = (value) => mongoose.isValidObjectId(value);
const fail = (message, status = 400) => { const error = new Error(message); error.statusCode = status; throw error; };
const cartQuery = (user) => Cart.findOne({ user }).populate({ path: 'items.product', select: 'name images price discount status' }).populate({ path: 'items.variant', select: 'product size color stock price status sku' });

const presentCart = async (user) => {
  const cart = await cartQuery(user);
  const items = (cart?.items || []).map(item => {
    const { product, variant, quantity } = item;
    let issue = '';
    if (!product || !variant || product.status !== 'active' || variant.status !== 'active' || String(variant.product) !== String(product._id)) issue = 'This product variant is unavailable. Remove it to continue.';
    else if (!Number.isSafeInteger(quantity) || quantity < 1) issue = 'Invalid quantity. Remove this item and add it again.';
    else if (variant.stock === 0) issue = 'Out of Stock';
    else if (quantity > variant.stock) issue = 'Only ' + variant.stock + ' available. Reduce the quantity.';
    const unitPrice = product && variant ? priceFor(product, variant) : 0;
    return { id: String(item._id), product, variant, quantity, unitPrice, lineTotal: money(unitPrice * quantity), available: !issue, issue };
  });
  return { items, subtotal: money(items.reduce((sum, item) => sum + item.lineTotal, 0)), canCheckout: items.length > 0 && items.every(item => item.available) };
};

export const getCart = async (req, res, next) => { try { res.json({ cart: await presentCart(req.user._id) }); } catch (error) { next(error); } };

export const addCartItem = async (req, res, next) => { try {
  const { productId, variantId, quantity = 1 } = req.body;
  if (!validId(productId) || !validId(variantId) || !Number.isInteger(quantity) || quantity < 1) fail('Provide a product, variant, and positive whole-number quantity.');
  const [product, variant] = await Promise.all([Product.findOne({ _id: productId, status: 'active' }), ProductVariant.findOne({ _id: variantId, product: productId, status: 'active' })]);
  if (!product || !variant) fail('This product variant is unavailable.', 404);
  let cart = await Cart.findOne({ user: req.user._id }); if (!cart) cart = new Cart({ user: req.user._id, items: [] });
  const existing = cart.items.find((item) => String(item.variant) === variantId);
  const nextQuantity = (existing?.quantity || 0) + quantity;
  if (nextQuantity > variant.stock) fail('Requested quantity exceeds available stock.');
  if (existing) existing.quantity = nextQuantity; else cart.items.push({ product: productId, variant: variantId, quantity, unitPrice: priceFor(product, variant) });
  await cart.save(); res.status(201).json({ cart: await presentCart(req.user._id) });
} catch (error) { next(error); } };

export const updateCartItem = async (req, res, next) => { try {
  const quantity = req.body.quantity; if (!Number.isSafeInteger(quantity) || quantity < 1) fail('Quantity must be a positive whole number.');
  const cart = await Cart.findOne({ user: req.user._id }); const item = cart?.items.id(req.params.itemId); if (!item) fail('Cart item not found.', 404);
  const product = await Product.findOne({ _id: item.product, status: 'active' });
  const variant = await ProductVariant.findOne({ _id: item.variant, product: item.product, status: 'active' });
  if (!product || !variant) fail('This product variant is unavailable.', 409);
  if (quantity > variant.stock) fail('Requested quantity exceeds available stock.', 409);
  item.quantity = quantity; await cart.save(); res.json({ cart: await presentCart(req.user._id) });
} catch (error) { next(error); } };

export const removeCartItem = async (req, res, next) => { try {
  const cart = await Cart.findOne({ user: req.user._id }); if (!cart?.items.id(req.params.itemId)) fail('Cart item not found.', 404);
  cart.items.pull(req.params.itemId); await cart.save(); res.json({ cart: await presentCart(req.user._id) });
} catch (error) { next(error); } };

export const getWishlist = async (req, res, next) => { try { const wishlist = await Wishlist.findOne({ user: req.user._id }).populate({ path: 'products', match: { status: 'active' }, populate: [{ path: 'brand', select: 'name' }, { path: 'category', select: 'name' }] }); const products = wishlist?.products.filter(Boolean) || []; const variants = await ProductVariant.find({ product: { $in: products.map(p => p._id) }, status: 'active' }).select('product size color stock price'); res.json({ products: products.map(p => ({ ...p.toObject(), variants: variants.filter(v => String(v.product) === String(p._id)) })) }); } catch (error) { next(error); } };
export const addWishlistItem = async (req, res, next) => { try { const { productId } = req.body; if (!validId(productId) || !await Product.exists({ _id: productId, status: 'active' })) fail('Product not found.', 404); const wishlist = await Wishlist.findOneAndUpdate({ user: req.user._id }, { $addToSet: { products: productId } }, { returnDocument: 'after', upsert: true }); res.status(201).json({ wishlist }); } catch (error) { next(error); } };
export const removeWishlistItem = async (req, res, next) => { try { await Wishlist.updateOne({ user: req.user._id }, { $pull: { products: req.params.productId } }); res.status(204).send(); } catch (error) { next(error); } };

export const moveWishlistToCart = async (req, res, next) => {
  try {
    const productId = req.params.productId, variantId = req.body.variantId;
    if (!validId(productId) || !validId(variantId)) fail('Choose a valid product variant.');
    await transaction(async session => {
      const wishlist = await Wishlist.findOne({ user: req.user._id, products: productId }).session(session);
      if (!wishlist) fail('This product is no longer in your wishlist.', 409);
      const product = await Product.findOne({ _id: productId, status: 'active' }).session(session);
      const variant = await ProductVariant.findOne({ _id: variantId, product: productId, status: 'active' }).session(session);
      if (!product || !variant) fail('This product variant is unavailable.', 404);
      let cart = await Cart.findOne({ user: req.user._id }).session(session);
      if (!cart) cart = new Cart({ user: req.user._id, items: [] });
      const existing = cart.items.find(item => String(item.variant) === variantId);
      const quantity = (existing?.quantity || 0) + 1;
      if (quantity > variant.stock) fail('Requested quantity exceeds available stock.', 409);
      if (existing) { existing.quantity = quantity; existing.unitPrice = priceFor(product, variant); }
      else cart.items.push({ product: productId, variant: variantId, quantity: 1, unitPrice: priceFor(product, variant) });
      await cart.save({ session });
      wishlist.products.pull(productId);
      await wishlist.save({ session });
    });
    res.json({ cart: await presentCart(req.user._id), message: 'Moved to cart.' });
  } catch (error) { next(error); }
};

export const listAddresses = async (req, res, next) => { try { res.json({ addresses: await Address.find({ user: req.user._id }).sort({ isDefault: -1, createdAt: -1 }) }); } catch (error) { next(error); } };
export const createAddress = async (req, res, next) => { try {
  const address = await transaction(async session => {
    const count = await Address.countDocuments({ user: req.user._id }).session(session);
    const address = new Address({ ...req.body, user: req.user._id, isDefault: req.body.isDefault === true || count === 0 });
    await address.validate();
    if (address.isDefault) await Address.updateMany({ user: req.user._id, isDefault: true }, { isDefault: false }, { session });
    await address.save({ session });
    return address;
  });
  res.status(201).json({ address });
} catch (error) { next(error); } };
export const updateAddress = async (req, res, next) => { try {
  const address = await transaction(async session => {
    const address = await Address.findOne({ _id: req.params.id, user: req.user._id }).session(session);
    if (!address) fail('Address not found.', 404);
    for (const key of ['fullName', 'phone', 'line1', 'line2', 'city', 'state', 'postalCode', 'country', 'type', 'isDefault']) if (req.body[key] !== undefined) address[key] = req.body[key];
    await address.validate();
    if (address.isDefault) await Address.updateMany({ user: req.user._id, _id: { $ne: address._id }, isDefault: true }, { isDefault: false }, { session });
    await address.save({ session });
    return address;
  });
  res.json({ address });
} catch (error) { next(error); } };
export const deleteAddress = async (req, res, next) => { try { const address = await Address.findOneAndDelete({ _id: req.params.id, user: req.user._id }); if (!address) fail('Address not found.', 404); res.status(204).send(); } catch (error) { next(error); } };

export const validateCoupon = async (req, res, next) => { try {
  const cart = await presentCart(req.user._id);
  if (!cart.canCheckout) fail('Your cart is empty or contains unavailable items.', 409);
  const { coupon, discount } = await couponDiscount(req.body.code, cart.subtotal);
  res.json({ coupon: coupon ? { code: coupon.code } : null, discount, subtotal: cart.subtotal });
} catch (error) { next(error); } };
export const checkoutSummary = async (req, res, next) => { try {
 const q = await quote(req.user._id, req.body);
 res.json({ items: q.items, address: q.address, coupon: q.coupon ? { code: q.coupon.code, discount: q.discount } : null, subtotal: q.subtotal, discount: q.discount, shipping: q.shipping, total: q.total });
} catch (error) { next(error); } };


