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
exports.getLocations = exports.createLocation = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const createLocation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { name, latitude, longitude, categoryId, collectionId } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const file = req.file;
        if (!userId) {
            res.status(401).json({ error: 'No autorizado' });
            return;
        }
        // Generate unique code for QR
        const uniqueCode = `LOC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const imageUrl = file ? `/uploads/${file.filename}` : null;
        const location = yield prisma.location.create({
            data: {
                name,
                uniqueCode,
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
                categoryId: parseInt(categoryId),
                createdByUserId: userId,
                imageUrl,
                collectionLocations: {
                    create: {
                        collectionId: parseInt(collectionId)
                    }
                }
            },
        });
        res.status(201).json(location);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al crear locación.' });
    }
});
exports.createLocation = createLocation;
const getLocations = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const locations = yield prisma.location.findMany({
            include: {
                category: true,
                collectionLocations: true
            }
        });
        res.json(locations);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener locaciones.' });
    }
});
exports.getLocations = getLocations;
