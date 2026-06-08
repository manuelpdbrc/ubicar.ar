import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/authMiddleware';

const prisma = new PrismaClient();

export const exportCollectionKMZ = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'No autorizado' });
      return;
    }

    const collection = await prisma.collection.findUnique({
      where: { id: parseInt(id as string) },
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

    collection.locations.forEach(cl => {
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

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al exportar colección.' });
  }
};
