
import mongoose from 'mongoose';
import adminManagementRoutes from './routes/adminManagementRoutes.js';
import { getShopSettings } from './controllers/adminManagementController.js';
import express from 'express';
import adminAnalyticsRoutes from './routes/adminAnalyticsRoutes.js';
import cors from 'cors';
import path from 'node:path';
import authRoutes from './routes/authRoutes.js';
import catalogRoutes from './routes/catalogRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import shoppingRoutes from './routes/shoppingRoutes.js';
import phase9Routes from './routes/phase9Routes.js';
import { errorHandler } from './middleware/errorMiddleware.js';

const app = express();

// CORS configuration
app.use(cors({
  origin: (process.env.CLIENT_URL || 'http://localhost:5173')
    .trim()
    .replace(/\/+$/, ''),
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204,
}));

// Middleware
app.use(express.json({ limit: '10kb' }));

// Serve uploaded files
app.use(
  '/uploads',
  express.static(path.resolve('backend', 'uploads'), {
    setHeaders: res => res.set('X-Content-Type-Options', 'nosniff'),
  })
);

// Health check
app.get('/health', (_req, res) => {
  const connected = mongoose.connection.readyState === 1;

  res.status(connected ? 200 : 503).json({
    status: connected ? 'ok' : 'unavailable',
    database: connected ? 'connected' : 'disconnected',
  });
});

// Shop settings
app.get('/api/shop-settings', getShopSettings);

// API routes
app.use('/api/admin', adminManagementRoutes);
app.use('/api/admin', adminAnalyticsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', catalogRoutes);
app.use('/api', phase9Routes);
app.use('/api', shoppingRoutes);
app.use('/api', orderRoutes);

// API 404 handler
app.use('/api', (_req, res) => {
  res.status(404).json({
    message: 'API route not found.',
  });
});

// Serve the React frontend build
const frontendDistPath = path.resolve(process.cwd(), 'dist');

app.use(express.static(frontendDistPath));

// Handle React Router routes
app.get(/.*/, (req, res, next) => {
  res.sendFile(path.join(frontendDistPath, 'index.html'), (err) => {
    if (err) next(err);
  });
});

// Error handler must be last
app.use(errorHandler);

export default app;
