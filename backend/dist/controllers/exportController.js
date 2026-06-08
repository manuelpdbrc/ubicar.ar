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
exports.exportCollectionKMZ = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const exportCollectionKMZ = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            res.status(401).json({ error: 'No autorizado' });
            return;
        }
        const collection = yield prisma.collection.findUnique({
            where: { id: parseInt(id) },
            include: {
                locations: {
                    include: {
                        location: {
                            include: { category: true }
                        }
                    }
                }
            }
        });
        if (!collection) {
            res.status(404).json({ error: 'Colección no encontrada' });
            return;
        }
        // Build simple KML
        let kmlStr = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${collection.name}</name>
    <description>Exportado desde ubicar.ar</description>
`;
        collection.locations.forEach((cl) => {
            const loc = cl.location;
            kmlStr += `
    <Placemark>
      <name>${loc.name}</name>
      <description>Categoría: ${loc.category.name} | Código: ${loc.uniqueCode}</description>
      <Point>
        <coordinates>${loc.longitude},${loc.latitude},0</coordinates>
      </Point>
    </Placemark>`;
        });
        kmlStr += `
  </Document>
</kml>`;
        res.setHeader('Content-Type', 'application/vnd.google-earth.kml+xml');
        res.setHeader('Content-Disposition', `attachment; filename="collection_${collection.id}.kml"`);
        res.send(kmlStr);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al exportar colección.' });
    }
});
exports.exportCollectionKMZ = exportCollectionKMZ;
