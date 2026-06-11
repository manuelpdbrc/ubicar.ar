import { Request, Response, NextFunction } from 'express';
import pool from '../db';
import mysql from 'mysql2/promise';

/**
 * Get user's collections (owned and shared)
 */
export async function getCollections(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const [rows] = await pool.execute<mysql.RowDataPacket[]>(
      `SELECT c.*, 
        CASE WHEN c.createdByUserId = ? THEN 'CREATOR' ELSE p.role END as userRole,
        (SELECT COUNT(*) FROM collection_locations cl WHERE cl.collectionId = c.id) as locationCount
       FROM collections c
       LEFT JOIN collection_user_permissions p ON p.collectionId = c.id AND p.userId = ?
       WHERE c.createdByUserId = ? OR p.userId = ?
       ORDER BY c.name ASC`,
      [userId, userId, userId, userId]
    );

    const data = rows.map(row => {
      const { locationCount, ...col } = row;
      return {
        ...col,
        _count: { locations: Number(locationCount) }
      };
    });

    res.json(data);
  } catch (error) {
    next(error);
  }
}

/**
 * Get collection by ID with locations and permissions
 */
export async function getCollectionById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const collectionId = parseInt(req.params['id'] as string, 10);

    // Verify access
    const [accessRows] = await pool.execute<mysql.RowDataPacket[]>(
      `SELECT c.*, 
        CASE WHEN c.createdByUserId = ? THEN 'CREATOR' ELSE p.role END as userRole
       FROM collections c
       LEFT JOIN collection_user_permissions p ON p.collectionId = c.id AND p.userId = ?
       WHERE c.id = ? AND (c.createdByUserId = ? OR p.userId = ?)`,
      [userId, userId, collectionId, userId, userId]
    );

    if (accessRows.length === 0) {
      res.status(403).json({ error: 'No tienes acceso a esta colección' });
      return;
    }

    const collection = accessRows[0];

    // Get locations
    const [locationRows] = await pool.execute<mysql.RowDataPacket[]>(
      `SELECT l.*, cat.id as cat_id, cat.name as cat_name, cat.color as cat_color
       FROM locations l
       JOIN collection_locations cl ON cl.locationId = l.id
       LEFT JOIN categories cat ON l.categoryId = cat.id
       WHERE cl.collectionId = ?`,
      [collectionId]
    );

    const locations = locationRows.map(row => {
      const { cat_id, cat_name, cat_color, ...loc } = row;
      return {
        ...loc,
        category: cat_id ? { id: cat_id, name: cat_name, color: cat_color } : null
      };
    });

    // Get existing permissions
    const [permissionRows] = await pool.execute<mysql.RowDataPacket[]>(
      `SELECT p.role, u.email, u.name 
       FROM collection_user_permissions p
       JOIN users u ON p.userId = u.id
       WHERE p.collectionId = ?`,
      [collectionId]
    );

    // Get pending invitations
    const [invitationRows] = await pool.execute<mysql.RowDataPacket[]>(
      `SELECT email, role FROM collection_invitations WHERE collectionId = ?`,
      [collectionId]
    );

    res.json({
      ...collection,
      locations,
      permissions: permissionRows.map(p => ({ email: p.email, name: p.name, role: p.role, status: 'accepted' }))
        .concat(invitationRows.map(i => ({ email: i.email, name: i.email, role: i.role, status: 'pending' })))
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new collection
 */
export async function createCollection(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const body = req.body as Record<string, string>;
    const name = body['name'];
    const description = body['description'] || null;

    const [result] = await pool.execute<mysql.ResultSetHeader>(
      'INSERT INTO collections (name, description, createdByUserId, createdAt, updatedAt) VALUES (?, ?, ?, NOW(3), NOW(3))',
      [name, description, userId]
    );

    const [rows] = await pool.execute<mysql.RowDataPacket[]>('SELECT * FROM collections WHERE id = ?', [result.insertId]);
    res.status(201).json({ ...rows[0], userRole: 'CREATOR' });
  } catch (error) {
    next(error);
  }
}

/**
 * Update collection
 */
export async function updateCollection(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const collectionId = parseInt(req.params['id'] as string, 10);
    const body = req.body as Record<string, string>;

    const [accessRows] = await pool.execute<mysql.RowDataPacket[]>(
      `SELECT CASE WHEN createdByUserId = ? THEN 'CREATOR' ELSE role END as userRole
       FROM collections c
       LEFT JOIN collection_user_permissions p ON p.collectionId = c.id AND p.userId = ?
       WHERE c.id = ? AND (c.createdByUserId = ? OR p.userId = ?)`,
      [userId, userId, collectionId, userId, userId]
    );

    if (accessRows.length === 0 || accessRows[0].userRole === 'VIEWER') {
      res.status(403).json({ error: 'Permisos insuficientes' });
      return;
    }

    await pool.execute(
      'UPDATE collections SET name = ?, description = ?, updatedAt = NOW(3) WHERE id = ?',
      [body['name'], body['description'] || null, collectionId]
    );

    const [rows] = await pool.execute<mysql.RowDataPacket[]>('SELECT * FROM collections WHERE id = ?', [collectionId]);
    res.json({ ...rows[0], userRole: accessRows[0].userRole });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete collection
 */
export async function deleteCollection(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const collectionId = parseInt(req.params['id'] as string, 10);

    const [rows] = await pool.execute<mysql.RowDataPacket[]>('SELECT createdByUserId FROM collections WHERE id = ?', [collectionId]);
    if (rows.length === 0 || rows[0].createdByUserId !== userId) {
      res.status(403).json({ error: 'Solo el creador puede eliminar la colección' });
      return;
    }

    await pool.execute('DELETE FROM collection_locations WHERE collectionId = ?', [collectionId]);
    await pool.execute('DELETE FROM collection_user_permissions WHERE collectionId = ?', [collectionId]);
    await pool.execute('DELETE FROM collection_invitations WHERE collectionId = ?', [collectionId]);
    await pool.execute('DELETE FROM collections WHERE id = ?', [collectionId]);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

/**
 * Add or update an invitation by email
 */
export async function addInvitation(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const collectionId = parseInt(req.params['id'] as string, 10);
    const body = req.body as Record<string, string>;
    const email = body['email'].trim().toLowerCase();
    const role = body['role'] || 'VIEWER';

    const [accessRows] = await pool.execute<mysql.RowDataPacket[]>(
      `SELECT CASE WHEN createdByUserId = ? THEN 'CREATOR' ELSE role END as userRole
       FROM collections c
       LEFT JOIN collection_user_permissions p ON p.collectionId = c.id AND p.userId = ?
       WHERE c.id = ? AND (c.createdByUserId = ? OR p.userId = ?)`,
      [userId, userId, collectionId, userId, userId]
    );

    if (accessRows.length === 0 || !['CREATOR', 'EDITOR'].includes(accessRows[0].userRole)) {
      res.status(403).json({ error: 'Permisos insuficientes para gestionar accesos' });
      return;
    }

    const [userRows] = await pool.execute<mysql.RowDataPacket[]>('SELECT id FROM users WHERE email = ?', [email]);
    
    if (userRows.length > 0) {
      const targetUserId = userRows[0].id;
      if (targetUserId === userId) {
        res.status(400).json({ error: 'No puedes invitarte a ti mismo' });
        return;
      }
      await pool.execute(
        'INSERT INTO collection_user_permissions (collectionId, userId, role, createdAt) VALUES (?, ?, ?, NOW(3)) ON DUPLICATE KEY UPDATE role = ?',
        [collectionId, targetUserId, role, role]
      );
    } else {
      await pool.execute(
        'INSERT INTO collection_invitations (collectionId, email, role, createdAt) VALUES (?, ?, ?, NOW(3)) ON DUPLICATE KEY UPDATE role = ?',
        [collectionId, email, role, role]
      );
    }

    res.status(200).json({ message: 'Acceso actualizado' });
  } catch (error) {
    next(error);
  }
}

/**
 * Remove an invitation or permission
 */
export async function removePermission(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const collectionId = parseInt(req.params['id'] as string, 10);
    const email = decodeURIComponent(req.params['email'] as string).trim().toLowerCase();

    const [accessRows] = await pool.execute<mysql.RowDataPacket[]>(
      `SELECT CASE WHEN createdByUserId = ? THEN 'CREATOR' ELSE role END as userRole
       FROM collections c
       LEFT JOIN collection_user_permissions p ON p.collectionId = c.id AND p.userId = ?
       WHERE c.id = ? AND (c.createdByUserId = ? OR p.userId = ?)`,
      [userId, userId, collectionId, userId, userId]
    );

    if (accessRows.length === 0 || !['CREATOR', 'EDITOR'].includes(accessRows[0].userRole)) {
      res.status(403).json({ error: 'Permisos insuficientes para gestionar accesos' });
      return;
    }

    const [userRows] = await pool.execute<mysql.RowDataPacket[]>('SELECT id FROM users WHERE email = ?', [email]);
    if (userRows.length > 0) {
      await pool.execute('DELETE FROM collection_user_permissions WHERE collectionId = ? AND userId = ?', [collectionId, userRows[0].id]);
    } else {
      await pool.execute('DELETE FROM collection_invitations WHERE collectionId = ? AND email = ?', [collectionId, email]);
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

/**
 * Add a location to a collection
 */
export async function addLocation(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const collectionId = parseInt(req.params['id'] as string, 10);
    const locationId = parseInt(req.body['locationId'] as string, 10);

    const [accessRows] = await pool.execute<mysql.RowDataPacket[]>(
      `SELECT CASE WHEN createdByUserId = ? THEN 'CREATOR' ELSE role END as userRole
       FROM collections c
       LEFT JOIN collection_user_permissions p ON p.collectionId = c.id AND p.userId = ?
       WHERE c.id = ? AND (c.createdByUserId = ? OR p.userId = ?)`,
      [userId, userId, collectionId, userId, userId]
    );

    if (accessRows.length === 0 || !['CREATOR', 'EDITOR'].includes(accessRows[0].userRole)) {
      res.status(403).json({ error: 'Permisos insuficientes para modificar esta colección' });
      return;
    }

    await pool.execute(
      'INSERT IGNORE INTO collection_locations (collectionId, locationId, addedAt) VALUES (?, ?, NOW(3))',
      [collectionId, locationId]
    );

    res.status(201).json({ message: 'Ubicación añadida' });
  } catch (error) {
    next(error);
  }
}

/**
 * Remove a location from a collection
 */
export async function removeLocation(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const collectionId = parseInt(req.params['id'] as string, 10);
    const locationId = parseInt(req.params['locationId'] as string, 10);

    const [accessRows] = await pool.execute<mysql.RowDataPacket[]>(
      `SELECT CASE WHEN createdByUserId = ? THEN 'CREATOR' ELSE role END as userRole
       FROM collections c
       LEFT JOIN collection_user_permissions p ON p.collectionId = c.id AND p.userId = ?
       WHERE c.id = ? AND (c.createdByUserId = ? OR p.userId = ?)`,
      [userId, userId, collectionId, userId, userId]
    );

    if (accessRows.length === 0 || !['CREATOR', 'EDITOR'].includes(accessRows[0].userRole)) {
      res.status(403).json({ error: 'Permisos insuficientes para modificar esta colección' });
      return;
    }

    await pool.execute(
      'DELETE FROM collection_locations WHERE collectionId = ? AND locationId = ?',
      [collectionId, locationId]
    );

    res.status(204).send();
  } catch (error) {
    next(error);
  }
}