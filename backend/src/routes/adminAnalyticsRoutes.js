import { Category, Brand } from '../models/index.js';
import { Router } from 'express';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import { getDashboard, getReport, downloadReport } from '../controllers/adminAnalyticsController.js';
const router = Router();
router.use(['/dashboard', '/reports'], protect, authorizeRoles('admin'));
router.get('/dashboard/summary', getDashboard);
router.get('/reports/filters', async (_req, res, next) => { try { const [categories, brands] = await Promise.all([Category.find().select('name').sort('name').lean(), Brand.find().select('name').sort('name').lean()]); res.json({ categories, brands }); } catch (error) { next(error); } });
router.get('/reports/:type/export', downloadReport);
router.get('/reports/:type', getReport);
export default router;

