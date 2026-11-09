import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import * as c from '../controllers/shoppingController.js';
const router = Router(); router.use(['/cart', '/wishlist', '/addresses', '/coupons/validate', '/checkout/summary'], protect); router.use((req, _res, next) => { req.body ??= {}; next(); });
router.get('/cart', c.getCart); router.post('/cart/items', c.addCartItem); router.patch('/cart/items/:itemId', c.updateCartItem); router.delete('/cart/items/:itemId', c.removeCartItem);
router.post('/wishlist/:productId/move-to-cart', c.moveWishlistToCart); router.get('/wishlist', c.getWishlist); router.post('/wishlist', c.addWishlistItem); router.delete('/wishlist/:productId', c.removeWishlistItem);
router.get('/addresses', c.listAddresses); router.post('/addresses', c.createAddress); router.patch('/addresses/:id', c.updateAddress); router.delete('/addresses/:id', c.deleteAddress);
router.post('/coupons/validate', c.validateCoupon); router.post('/checkout/summary', c.checkoutSummary);
export default router;

