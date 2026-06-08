"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const collectionRoutes_1 = __importDefault(require("./routes/collectionRoutes"));
const locationRoutes_1 = __importDefault(require("./routes/locationRoutes"));
const visitRoutes_1 = __importDefault(require("./routes/visitRoutes"));
const circuitRoutes_1 = __importDefault(require("./routes/circuitRoutes"));
const syncRoutes_1 = __importDefault(require("./routes/syncRoutes"));
const exportRoutes_1 = __importDefault(require("./routes/exportRoutes"));
// Serve static uploads
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
// API Routes
app.use('/api/auth', authRoutes_1.default);
app.use('/api/collections', collectionRoutes_1.default);
app.use('/api/locations', locationRoutes_1.default);
app.use('/api/visits', visitRoutes_1.default);
app.use('/api/circuits', circuitRoutes_1.default);
app.use('/api/sync', syncRoutes_1.default);
app.use('/api/export', exportRoutes_1.default);
// Routes placeholder
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});
// Serve Frontend (Monolithic Deployment)
// En producción, el código estará en backend/dist/app.js
// El frontend compilado estará en frontend/out
const frontendPath = path_1.default.join(__dirname, '../../frontend/out');
app.use(express_1.default.static(frontendPath));
// Catch-all route to serve index.html for frontend routing (PWA/SPA)
app.use((req, res) => {
    res.sendFile(path_1.default.join(frontendPath, 'index.html'));
});
exports.default = app;
