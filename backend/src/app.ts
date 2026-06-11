import express from 'express';
import cors from 'cors';
import path from 'path';

import authRoutes from './routes/authRoutes';
import categoryRoutes from './routes/categoryRoutes';
import locationRoutes from './routes/locationRoutes';
import collectionRoutes from './routes/collectionRoutes';
// TODO: import visitRoutes from './routes/visitRoutes';
// TODO: import circuitRoutes from './routes/circuitRoutes';

import { errorHandler } from './middleware/errorHandler';

const app = express();

// ─── CORS ────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  })
);

// ─── Body Parsing ────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Static: uploaded files ──────────────────────────────────
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// ─── API Routes ──────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/collections', collectionRoutes);
// TODO: app.use('/api/collections', collectionRoutes);
// TODO: app.use('/api/visits', visitRoutes);
// TODO: app.use('/api/circuits', circuitRoutes);

// ─── Catch-all for unknown API routes → 404 JSON ────────────
app.all('/api/*path', (_req, res) => {
  res.status(404).json({ error: 'Ruta de API no encontrada' });
});

// ─── Static: SPA frontend ───────────────────────────────────
const publicDir = path.join(process.cwd(), 'public');
app.use(express.static(publicDir));

app.get('*path', (_req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'), (err) => {
    if (err) {
      // No frontend build available yet — just send a plain 200
      res.status(200).json({ message: 'ubicar.ar API running' });
    }
  });
});

// ─── Global Error Handler (must be LAST) ─────────────────────
app.use(errorHandler);

export default app;
