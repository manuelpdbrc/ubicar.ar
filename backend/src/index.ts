import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import path from 'path';
import app from './app';

// ─── Ensure uploads directory exists ─────────────────────────
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// ─── Start Server ────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '4000', 10);

const server = app.listen(PORT, () => {
  console.log(`🚀 ubicar.ar backend corriendo en http://localhost:${PORT}`);
  console.log(`   Entorno: ${process.env.NODE_ENV || 'development'}`);
});

// ─── Graceful Shutdown ───────────────────────────────────────

/** Handle uncaught exceptions without crashing silently */
process.on('uncaughtException', (error: Error) => {
  console.error('❌ Excepción no capturada:', error);
  server.close(() => process.exit(1));
});

/** Handle unhandled promise rejections */
process.on('unhandledRejection', (reason: unknown) => {
  console.error('❌ Promesa rechazada sin manejar:', reason);
  server.close(() => process.exit(1));
});

/** Handle SIGTERM for clean shutdown (e.g. Docker, Hostinger) */
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM recibido. Cerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor cerrado correctamente.');
    process.exit(0);
  });
});
