import { Router } from 'express';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import * as c from '../controllers/orderController.js';
const router = Router(), staff = authorizeRoles('admin', 'employee'), customer = authorizeRoles('customer');
router.use(['/orders', '/payments', '/inventory'], protect);
router.use((req, _res, next) => { req.body ??= {}; next(); });
router.post('/orders', customer, c.createOrder);
router.get('/orders/my-orders', customer, c.listOrders);
router.get('/orders', staff, c.listOrders);
router.get('/orders/:id', c.getOrder);
router.patch('/orders/:id/status', staff, c.changeStatus);
router.patch('/orders/:id/cancel', customer, c.changeStatus);
router.post('/payments', c.getPayment);
router.patch('/payments/:id/refund', authorizeRoles('admin'), c.refundPayment);
router.get('/inventory', staff, c.listInventory);
router.patch('/inventory/:variantId', staff, c.updateInventory);
router.get('/inventory/:variantId/history', staff, c.inventoryHistory);
export default router;

