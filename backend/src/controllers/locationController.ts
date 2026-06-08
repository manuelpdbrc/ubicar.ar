import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/authMiddleware';

const prisma = new PrismaClient();

export const createLocation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, latitude, longitude, categoryId, collectionId } = req.body;
    const userId = req.user?.id;
    const file = req.file;

    if (!userId) {
      res.status(401).json({ error: 'No autorizado' });
      return;
    }

    // Generate unique code for QR
    const uniqueCode = `LOC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const imageUrl = file ? `/uploads/${file.filename}` : null;

    const location = await prisma.location.create({
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
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear locación.' });
  }
};

export const getLocations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const locations = await prisma.location.findMany({
      include: {
        category: true,
        collectionLocations: true
      }
    });

    res.json(locations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener locaciones.' });
  }
};
