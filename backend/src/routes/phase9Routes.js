import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { protect, authorizeRoles, optionalAuth } from '../middleware/authMiddleware.js';
import * as c from '../controllers/phase9Controller.js';
const router = Router(), customer = authorizeRoles('customer'), staff = authorizeRoles('admin','employee');
const writeLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: Number(process.env.PHASE9_RATE_LIMIT || 30), standardHeaders: 'draft-8', legacyHeaders: false, message: { message: 'Too many requests. Please try again later.' } });
router.get('/products/:productId/reviews', optionalAuth, c.listProductReviews);
router.use(['/reviews', '/admin/reviews', '/notifications', '/support/tickets'], protect);
router.post('/reviews', customer, writeLimit, c.createReview); router.patch('/reviews/:id', c.updateReview); router.delete('/reviews/:id', c.deleteReview); router.get('/admin/reviews', authorizeRoles('admin'), c.listReviews);
router.get('/notifications', c.listNotifications); router.get('/notifications/unread-count', c.unreadNotifications); router.patch('/notifications/read-all', c.readAllNotifications); router.patch('/notifications/:id/read', c.readNotification);
router.post('/support/tickets', customer, writeLimit, c.createTicket); router.get('/support/tickets', c.listTickets); router.get('/support/tickets/:id', c.getTicket); router.post('/support/tickets/:id/messages', writeLimit, c.replyTicket); router.patch('/support/tickets/:id', staff, c.updateTicket);
export default router;

router.post('/contact', writeLimit, c.createContact);
router.get('/admin/contact-messages', protect, authorizeRoles('admin'), c.listContacts);
router.patch('/admin/contact-messages/:id', protect, authorizeRoles('admin'), c.updateContact);

