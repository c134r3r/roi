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

// Use PostgreSQL only if explicitly configured
const usePostgres = process.env.DATABASE_URL ? true : false;

if (usePostgres) {
  console.log('🗄️ Using PostgreSQL database (NEON)...');
  try {
    db = new PostgreSQLDatabase();
  } catch (error) {
    console.error('❌ Failed to connect to PostgreSQL, falling back to In-Memory:', error);
    db = new InMemoryDatabase();
  }
} else {
  console.log('💾 Using In-Memory database (local mode)...');
  console.log('💡 Projects will be saved in browser localStorage');
  db = new InMemoryDatabase();
}

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json({ limit: '10mb' }));

// CORS Konfiguration mit erweiterten Optionen
const allowedOrigins = [
  'http://localhost:5173', // Vite dev server
  'http://localhost:3000', // Alternative dev port
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
  process.env.CORS_ORIGIN, // Environment variable
].filter(Boolean);

console.log('🔓 CORS Origins allowed:', allowedOrigins);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`⚠️ CORS rejected origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Explicit OPTIONS handling
app.options('*', cors());

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
