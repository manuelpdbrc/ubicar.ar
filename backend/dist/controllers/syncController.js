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
exports.syncOfflineData = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const syncOfflineData = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            res.status(401).json({ error: 'No autorizado' });
            return;
        }
        // Expecting an array of visits in the body or parsed from a JSON field if sending files
        let { visits } = req.body;
        if (typeof visits === 'string') {
            visits = JSON.parse(visits);
        }
        const files = req.files;
        if (!Array.isArray(visits)) {
            res.status(400).json({ error: 'Formato de visitas inválido.' });
            return;
        }
        const syncedVisits = [];
        for (let i = 0; i < visits.length; i++) {
            const v = visits[i];
            const location = yield prisma.location.findUnique({ where: { uniqueCode: v.uniqueCode } });
            if (!location)
                continue; // Skip invalid locations
            // Find if there's a corresponding image uploaded
            // The frontend should send formData with `images` array matching the visits that have `hasImage: true`
            let imageUrl = null;
            if (v.hasImage && files && files.length > 0) {
                // Simple logic: we map the file sequentially if `hasImage` is true
                // For a more robust solution, the frontend should send an image ID mapping.
                const file = files.shift();
                if (file) {
                    imageUrl = `/uploads/${file.filename}`;
                }
            }
            const createdVisit = yield prisma.visit.create({
                data: {
                    locationId: location.id,
                    userId: userId,
                    type: v.type || 'SPONTANEOUS',
                    circuitId: v.circuitId ? parseInt(v.circuitId) : null,
                    comment: v.comment,
                    dateTimestamp: v.dateTimestamp ? new Date(v.dateTimestamp) : new Date(),
                    imageUrl
                }
            });
            syncedVisits.push(createdVisit);
        }
        res.status(200).json({ message: 'Sincronización exitosa', syncedVisits });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al sincronizar datos offline.' });
    }
});
exports.syncOfflineData = syncOfflineData;
