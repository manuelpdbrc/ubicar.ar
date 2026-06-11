import { Request, Response, NextFunction } from 'express';
import mysql from 'mysql2/promise';
import pool from '../db';

/** List categories created by the authenticated user */
export async function getCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;

    const [rows] = await pool.execute<mysql.RowDataPacket[]>(
      `SELECT c.*, COUNT(l.id) as locationCount
       FROM categories c
       LEFT JOIN locations l ON l.categoryId = c.id
       WHERE c.createdByUserId = ?
       GROUP BY c.id
       ORDER BY c.name ASC`,
      [userId]
    );

    // Transform to match Prisma's _count format for frontend compatibility
    const categories = rows.map((row) => ({
      id: row.id,
      name: row.name,
      color: row.color,
      createdByUserId: row.createdByUserId,
      createdAt: row.createdAt,
      _count: { locations: Number(row.locationCount) },
    }));

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
    const [existingRows] = await pool.execute<mysql.RowDataPacket[]>(
      'SELECT id FROM categories WHERE name = ? AND createdByUserId = ?',
      [name, userId]
    );

    if (existingRows.length > 0) {
      res.status(409).json({ error: 'Ya tenés una categoría con ese nombre' });
      return;
    }

    const [result] = await pool.execute<mysql.ResultSetHeader>(
      'INSERT INTO categories (name, color, createdByUserId, createdAt) VALUES (?, ?, ?, NOW(3))',
      [name, color, userId]
    );

    // Return the created category
    const [rows] = await pool.execute<mysql.RowDataPacket[]>(
      'SELECT * FROM categories WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json(rows[0]);
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
    const [catRows] = await pool.execute<mysql.RowDataPacket[]>(
      'SELECT * FROM categories WHERE id = ?',
      [categoryId]
    );
    const category = catRows[0];
    if (!category || category.createdByUserId !== userId) {
      res.status(404).json({ error: 'Categoría no encontrada' });
      return;
    }

    // Check duplicate name if name is being changed
    if (name && name !== category.name) {
      const [existingRows] = await pool.execute<mysql.RowDataPacket[]>(
        'SELECT id FROM categories WHERE name = ? AND createdByUserId = ? AND id != ?',
        [name, userId, categoryId]
      );
      if (existingRows.length > 0) {
        res.status(409).json({ error: 'Ya tenés una categoría con ese nombre' });
        return;
      }
    }

    // Build dynamic SET clause
    const setClauses: string[] = [];
    const params: (string | number)[] = [];
    if (name !== undefined) {
      setClauses.push('name = ?');
      params.push(name);
    }
    if (color !== undefined) {
      setClauses.push('color = ?');
      params.push(color);
    }

    if (setClauses.length > 0) {
      params.push(categoryId, userId);
      await pool.execute(
        `UPDATE categories SET ${setClauses.join(', ')} WHERE id = ? AND createdByUserId = ?`,
        params
      );
    }

    // Return the updated category
    const [rows] = await pool.execute<mysql.RowDataPacket[]>(
      'SELECT * FROM categories WHERE id = ?',
      [categoryId]
    );

    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
}

/** Delete a category (only if no locations use it) */
export async function deleteCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const categoryId = parseInt(req.params['id'] as string, 10);

    // Fetch category with location count
    const [catRows] = await pool.execute<mysql.RowDataPacket[]>(
      `SELECT c.*, COUNT(l.id) as locationCount
       FROM categories c
       LEFT JOIN locations l ON l.categoryId = c.id
       WHERE c.id = ?
       GROUP BY c.id`,
      [categoryId]
    );
    const category = catRows[0];

    if (!category || category.createdByUserId !== userId) {
      res.status(404).json({ error: 'Categoría no encontrada' });
      return;
    }

    const locationCount = Number(category.locationCount);
    if (locationCount > 0) {
      res.status(409).json({
        error: `No se puede eliminar: la categoría tiene ${locationCount} ubicación(es) asociada(s)`,
      });
      return;
    }

    await pool.execute('DELETE FROM categories WHERE id = ? AND createdByUserId = ?', [categoryId, userId]);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
