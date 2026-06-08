import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/authMiddleware';

const prisma = new PrismaClient();

export const logVisit = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { uniqueCode, type, circuitId, comment } = req.body;
    const userId = req.user?.id;
    const file = req.file;

    if (!userId) {
      res.status(401).json({ error: 'No autorizado' });
      return;
    }

    const location = await prisma.location.findUnique({
      where: { uniqueCode }
    });

    if (!location) {
      res.status(404).json({ error: 'Punto geográfico no encontrado (QR Inválido)' });
      return;
    }

    const imageUrl = file ? `/uploads/${file.filename}` : null;

    const visit = await prisma.visit.create({
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
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al registrar visita.' });
  }
};

export const getVisits = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'No autorizado' });
      return;
    }

    const visits = await prisma.visit.findMany({
      where: { userId },
      include: { location: true }
    });

    res.json(visits);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener visitas.' });
  }
};
