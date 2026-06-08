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
exports.getCollectionById = exports.getCollections = exports.createCollection = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const createCollection = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { name } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            res.status(401).json({ error: 'No autorizado' });
            return;
        }
        const collection = yield prisma.collection.create({
            data: {
                name,
                createdByUserId: userId,
                permissions: {
                    create: {
                        userId: userId,
                        role: 'EDITOR', // Creator gets editor permissions essentially
                    }
                }
            },
        });
        res.status(201).json(collection);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al crear colección.' });
    }
});
exports.createCollection = createCollection;
const getCollections = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            res.status(401).json({ error: 'No autorizado' });
            return;
        }
        const collections = yield prisma.collection.findMany({
            where: {
                OR: [
                    { createdByUserId: userId },
                    { permissions: { some: { userId: userId } } }
                ]
            },
            include: {
                _count: {
                    select: { locations: true }
                }
            }
        });
        res.json(collections);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener colecciones.' });
    }
});
exports.getCollections = getCollections;
const getCollectionById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const collection = yield prisma.collection.findUnique({
            where: { id: parseInt(id) },
            include: {
                locations: {
                    include: { location: true }
                },
                circuits: true
            }
        });
        if (!collection) {
            res.status(404).json({ error: 'Colección no encontrada' });
            return;
        }
        res.json(collection);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener colección.' });
    }
});
exports.getCollectionById = getCollectionById;
