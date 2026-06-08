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
exports.getCircuits = exports.createCircuit = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const createCircuit = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { name, collectionId, expirationDate, assignedOperatorId } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            res.status(401).json({ error: 'No autorizado' });
            return;
        }
        const circuit = yield prisma.circuit.create({
            data: {
                name,
                collectionId: parseInt(collectionId),
                expirationDate: new Date(expirationDate),
                assignedOperatorId: parseInt(assignedOperatorId),
                status: 'PENDING'
            }
        });
        res.status(201).json(circuit);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al crear circuito.' });
    }
});
exports.createCircuit = createCircuit;
const getCircuits = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            res.status(401).json({ error: 'No autorizado' });
            return;
        }
        // Update statuses dynamically based on expiration date before returning
        yield prisma.circuit.updateMany({
            where: {
                status: 'PENDING',
                expirationDate: { lt: new Date() }
            },
            data: { status: 'PENDING_EXPIRED' }
        });
        const circuits = yield prisma.circuit.findMany({
            where: {
                OR: [
                    { assignedOperatorId: userId },
                    { collection: { createdByUserId: userId } }
                ]
            },
            include: {
                collection: true,
                visits: true
            }
        });
        // Check completion logic
        for (let c of circuits) {
            if (c.status === 'PENDING') {
                const collectionLocations = yield prisma.collectionLocation.count({
                    where: { collectionId: c.collectionId }
                });
                const distinctVisits = new Set(c.visits.map((v) => v.locationId)).size;
                if (collectionLocations > 0 && distinctVisits === collectionLocations) {
                    c = yield prisma.circuit.update({
                        where: { id: c.id },
                        data: { status: 'COMPLETED' },
                        include: { collection: true, visits: true }
                    });
                }
            }
        }
        res.json(circuits);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener circuitos.' });
    }
});
exports.getCircuits = getCircuits;
