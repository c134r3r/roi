/**
 * ROI Calculator - Backend Server
 */

import express from 'express';
import cors from 'cors';
import apiRoutes from './routes.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));

// API Routes
app.use('/api', apiRoutes);

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`📊 ROI Calculator Server running on http://localhost:${PORT}`);
  console.log(`Frontend: http://localhost:5173`);
  console.log(`API: http://localhost:${PORT}/api`);
});
