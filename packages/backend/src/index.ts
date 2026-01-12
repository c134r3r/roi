/**
 * ROI Calculator - Backend Server
 */

import express from 'express';
import cors from 'cors';
import apiRoutes from './routes.js';
import { InMemoryDatabase, PostgreSQLDatabase } from './database/index.js';
import { IDatabase } from './database/index.js';

// Datenbank initialisieren (basierend auf Umgebungsvariable)
let db: IDatabase;

const usePostgres = process.env.USE_POSTGRES === 'true' || !!process.env.DATABASE_URL;

if (usePostgres && process.env.DATABASE_URL) {
  console.log('🗄️ Using PostgreSQL database...');
  db = new PostgreSQLDatabase();
} else {
  console.log('💾 Using In-Memory database...');
  db = new InMemoryDatabase();
}

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));

// Pass Database to Routes
app.use((req: any, _res: any, next) => {
  (req as any).db = db;
  next();
});

// API Routes
app.use('/api', apiRoutes);

// Error handling
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
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
  const dbType = usePostgres ? 'PostgreSQL' : 'In-Memory';
  console.log(`Database: ${dbType}`);
});

export { db };
