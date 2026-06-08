import express from 'express';
import cors from 'cors';
import path from 'path';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

import authRoutes from './routes/authRoutes';
import collectionRoutes from './routes/collectionRoutes';
import locationRoutes from './routes/locationRoutes';
import visitRoutes from './routes/visitRoutes';
import circuitRoutes from './routes/circuitRoutes';
import syncRoutes from './routes/syncRoutes';
import exportRoutes from './routes/exportRoutes';

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/visits', visitRoutes);
app.use('/api/circuits', circuitRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/export', exportRoutes);

// Routes placeholder
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Serve Frontend (Monolithic Deployment)
const frontendPath = path.join(__dirname, '../public');
app.use(express.static(frontendPath));

// Catch-all route to serve index.html for frontend routing (PWA/SPA)
app.use((req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

export default app;
