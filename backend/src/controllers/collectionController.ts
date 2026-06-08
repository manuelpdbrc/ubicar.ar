import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/authMiddleware';

const prisma = new PrismaClient();

export const createCollection = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'No autorizado' });
      return;
    }

    const collection = await prisma.collection.create({
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
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear colección.' });
  }
};

export const getCollections = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'No autorizado' });
      return;
    }

    const collections = await prisma.collection.findMany({
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
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener colecciones.' });
  }
};

export const getCollectionById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const collection = await prisma.collection.findUnique({
      where: { id: parseInt(id as string) },
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
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener colección.' });
  }
};
