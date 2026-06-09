import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma';

/** List categories created by the authenticated user */
export async function getCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;

    const categories = await prisma.category.findMany({
      where: { createdByUserId: userId },
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { locations: true } },
      },
    });

    res.json(categories);
  } catch (error) {
    next(error);
  }
}

/** Create a new category */
export async function createCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const { name, color } = req.body as { name: string; color: string };

    // Check for duplicate name for this user
    const existing = await prisma.category.findFirst({
      where: { name, createdByUserId: userId },
    });

    if (existing) {
      res.status(409).json({ error: 'Ya tenés una categoría con ese nombre' });
      return;
    }

    const category = await prisma.category.create({
      data: {
        name,
        color,
        createdByUserId: userId,
      },
    });

    res.status(201).json(category);
  } catch (error) {
    next(error);
  }
}

/** Update a category */
export async function updateCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const categoryId = parseInt(req.params['id'] as string, 10);
    const { name, color } = req.body as { name?: string; color?: string };

    // Verify ownership
    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category || category.createdByUserId !== userId) {
      res.status(404).json({ error: 'Categoría no encontrada' });
      return;
    }

    // Check duplicate name if name is being changed
    if (name && name !== category.name) {
      const existing = await prisma.category.findFirst({
        where: { name, createdByUserId: userId, NOT: { id: categoryId } },
      });
      if (existing) {
        res.status(409).json({ error: 'Ya tenés una categoría con ese nombre' });
        return;
      }
    }

    const updated = await prisma.category.update({
      where: { id: categoryId },
      data: { ...(name !== undefined && { name }), ...(color !== undefined && { color }) },
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
}

/** Delete a category (only if no locations use it) */
export async function deleteCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const categoryId = parseInt(req.params['id'] as string, 10);

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: { _count: { select: { locations: true } } },
    });

    if (!category || category.createdByUserId !== userId) {
      res.status(404).json({ error: 'Categoría no encontrada' });
      return;
    }

    if (category._count.locations > 0) {
      res.status(409).json({
        error: `No se puede eliminar: la categoría tiene ${category._count.locations} ubicación(es) asociada(s)`,
      });
      return;
    }

    await prisma.category.delete({ where: { id: categoryId } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
