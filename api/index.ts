/**
 * Vercel Serverless Function - API Server
 * Mounted at https://your-domain.vercel.app/api
 */

import { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import cors from 'cors';
import apiRoutes from '../packages/backend/dist/routes.js';
import { InMemoryDatabase, PostgreSQLDatabase } from '../packages/backend/dist/database/index.js';
import { IDatabase } from '../packages/backend/dist/database/index.js';

// Initialize database
let db: IDatabase;

const usePostgres = process.env.USE_POSTGRES === 'true' || !!process.env.DATABASE_URLROI;

if (usePostgres && process.env.DATABASE_URLROI) {
  console.log('🗄️ Using PostgreSQL database (NEON)');
  db = new PostgreSQLDatabase();
} else {
  console.log('💾 Using In-Memory database');
  db = new InMemoryDatabase();
}

const app = express();

// Middleware
app.use(express.json({ limit: '10mb' }));

// CORS for same-origin - only needed if frontend might be on different subdomain
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Passphrase'],
}));

// OPTIONS handling
app.options('*', cors());

// Inject database
app.use((req: any, _res: any, next) => {
  (req as any).db = db;
  next();
});

// API Routes
app.use('/', apiRoutes);

// Error handling
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
  });
});

// Vercel serverless handler
export default function handler(req: VercelRequest, res: VercelResponse) {
  return app(req, res);
}
