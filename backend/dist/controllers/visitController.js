"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVisits = exports.logVisit = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const logVisit = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { uniqueCode, type, circuitId, comment } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const file = req.file;
        if (!userId) {
            res.status(401).json({ error: 'No autorizado' });
            return;
        }
        const location = yield prisma.location.findUnique({
            where: { uniqueCode }
        });
        if (!location) {
            res.status(404).json({ error: 'Punto geográfico no encontrado (QR Inválido)' });
            return;
        }
        const imageUrl = file ? `/uploads/${file.filename}` : null;
        const visit = yield prisma.visit.create({
            data: {
                locationId: location.id,
                userId: userId,
                type: type || 'SPONTANEOUS',
                circuitId: circuitId ? parseInt(circuitId) : null,
                comment,
                imageUrl
            }
        });
        res.status(201).json(visit);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al registrar visita.' });
    }
});
exports.logVisit = logVisit;
const getVisits = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            res.status(401).json({ error: 'No autorizado' });
            return;
        }
        const visits = yield prisma.visit.findMany({
            where: { userId },
            include: { location: true }
        });
        res.json(visits);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener visitas.' });
    }
});
exports.getVisits = getVisits;
