import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/authMiddleware';

const prisma = new PrismaClient();

export const syncOfflineData = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'No autorizado' });
      return;
    }

    // Expecting an array of visits in the body or parsed from a JSON field if sending files
    let { visits } = req.body;
    if (typeof visits === 'string') {
      visits = JSON.parse(visits);
    }

    const files = req.files as Express.Multer.File[] | undefined;

    if (!Array.isArray(visits)) {
      res.status(400).json({ error: 'Formato de visitas inválido.' });
      return;
    }

    const syncedVisits = [];

    for (let i = 0; i < visits.length; i++) {
      const v = visits[i];
      const location = await prisma.location.findUnique({ where: { uniqueCode: v.uniqueCode } });
      if (!location) continue; // Skip invalid locations

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

      const createdVisit = await prisma.visit.create({
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
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al sincronizar datos offline.' });
  }
};
