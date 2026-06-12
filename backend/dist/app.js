"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const categoryRoutes_1 = __importDefault(require("./routes/categoryRoutes"));
const locationRoutes_1 = __importDefault(require("./routes/locationRoutes"));
const collectionRoutes_1 = __importDefault(require("./routes/collectionRoutes"));
const visitRoutes_1 = __importDefault(require("./routes/visitRoutes"));
// TODO: import visitRoutes from './routes/visitRoutes';
// TODO: import circuitRoutes from './routes/circuitRoutes';
const errorHandler_1 = require("./middleware/errorHandler");
const app = (0, express_1.default)();
// ─── CORS ────────────────────────────────────────────────────
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
}));
// ─── Body Parsing ────────────────────────────────────────────
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// ─── Static: uploaded files ──────────────────────────────────
app.use('/uploads', express_1.default.static(path_1.default.join(process.cwd(), 'uploads')));
// ─── API Routes ──────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
app.use('/api/auth', authRoutes_1.default);
app.use('/api/categories', categoryRoutes_1.default);
app.use('/api/locations', locationRoutes_1.default);
app.use('/api/collections', collectionRoutes_1.default);
app.use('/api/visits', visitRoutes_1.default);
// TODO: app.use('/api/collections', collectionRoutes);
// TODO: app.use('/api/visits', visitRoutes);
// TODO: app.use('/api/circuits', circuitRoutes);
// ─── Catch-all for unknown API routes → 404 JSON ────────────
app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'Ruta de API no encontrada' });
});
// ─── Static: SPA frontend ───────────────────────────────────
const publicDir = path_1.default.join(process.cwd(), 'public');
app.use(express_1.default.static(publicDir));
app.use((_req, res) => {
    res.sendFile(path_1.default.join(publicDir, 'index.html'), (err) => {
        if (err) {
            // No frontend build available yet — just send a plain 200
            res.status(200).json({ message: 'ubicar.ar API running' });
        }
    });
});
// ─── Global Error Handler (must be LAST) ─────────────────────
app.use(errorHandler_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map