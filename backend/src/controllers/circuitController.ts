import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/authMiddleware';

const prisma = new PrismaClient();

export const createCircuit = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, collectionId, expirationDate, assignedOperatorId } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'No autorizado' });
      return;
    }

    const circuit = await prisma.circuit.create({
      data: {
        name,
        collectionId: parseInt(collectionId),
        expirationDate: new Date(expirationDate),
        assignedOperatorId: parseInt(assignedOperatorId),
        status: 'PENDING'
      }
    });

    res.status(201).json(circuit);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear circuito.' });
  }
};

export const getCircuits = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'No autorizado' });
      return;
    }

    // Update statuses dynamically based on expiration date before returning
    await prisma.circuit.updateMany({
      where: {
        status: 'PENDING',
        expirationDate: { lt: new Date() }
      },
      data: { status: 'PENDING_EXPIRED' }
    });

    const circuits = await prisma.circuit.findMany({
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
        const collectionLocations = await prisma.collectionLocation.count({
          where: { collectionId: c.collectionId }
        });
        const distinctVisits = new Set(c.visits.map((v: any) => v.locationId)).size;
        
        if (collectionLocations > 0 && distinctVisits === collectionLocations) {
          c = await prisma.circuit.update({
            where: { id: c.id },
            data: { status: 'COMPLETED' },
            include: { collection: true, visits: true }
          });
        }
      }
    }

    res.json(circuits);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener circuitos.' });
  }
};
