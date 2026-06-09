"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const app_1 = __importDefault(require("./app"));
// ─── Ensure uploads directory exists ─────────────────────────
const uploadsDir = path_1.default.join(process.cwd(), 'uploads');
if (!fs_1.default.existsSync(uploadsDir)) {
    fs_1.default.mkdirSync(uploadsDir, { recursive: true });
}
// ─── Start Server ────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '4000', 10);
const server = app_1.default.listen(PORT, () => {
    console.log(`🚀 ubicar.ar backend corriendo en http://localhost:${PORT}`);
    console.log(`   Entorno: ${process.env.NODE_ENV || 'development'}`);
});
// ─── Graceful Shutdown ───────────────────────────────────────
/** Handle uncaught exceptions without crashing silently */
process.on('uncaughtException', (error) => {
    console.error('❌ Excepción no capturada:', error);
    server.close(() => process.exit(1));
});
/** Handle unhandled promise rejections */
process.on('unhandledRejection', (reason) => {
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
//# sourceMappingURL=index.js.map