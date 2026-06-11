import { Request, Response, NextFunction } from 'express';
import mysql from 'mysql2/promise';
import pool from '../db';

/**
 * Middleware factory to check if the authenticated user has the required
 * role on a collection. Reads `collectionId` from req.params or req.body.
 *
 * @param requiredRoles - Allowed roles (e.g., ['CREATOR', 'EDITOR'])
 */
export function authorizeCollection(...requiredRoles: string[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'No autenticado' });
        return;
      }

      const rawId = (req.params['collectionId'] as string) || String(req.body?.collectionId ?? '');
      const collectionId = parseInt(rawId, 10);
      if (isNaN(collectionId)) {
        res.status(400).json({ error: 'ID de colección inválido' });
        return;
      }

      // Check if the collection exists and get its creator
      const [collectionRows] = await pool.execute<mysql.RowDataPacket[]>(
        'SELECT createdByUserId FROM collections WHERE id = ?',
        [collectionId]
      );

      if (collectionRows.length === 0) {
        res.status(404).json({ error: 'Colección no encontrada' });
        return;
      }

      // Creator always has access
      if (collectionRows[0].createdByUserId === userId) {
        next();
        return;
      }

      // Check explicit permissions
      const [permRows] = await pool.execute<mysql.RowDataPacket[]>(
        'SELECT role FROM collection_user_permissions WHERE collectionId = ? AND userId = ?',
        [collectionId, userId]
      );

      if (permRows.length === 0 || !requiredRoles.includes(permRows[0].role)) {
        res.status(403).json({ error: 'No tenés permisos para esta acción' });
        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
