import { Request, Response, NextFunction } from 'express';
import pool from '../db';
import mysql from 'mysql2/promise';

/**
 * Registra una nueva visita
 * Endpoint: POST /api/visits
 * Body: multipart/form-data (locationId, type, comment, formData, images[])
 */
export async function createVisit(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    // req.body has already been parsed and validated by validate middleware (from Multer + Zod)
    const { locationId, type, circuitId, comment, formData } = req.body;

    // Verify the location exists
    const [locRows] = await pool.execute<mysql.RowDataPacket[]>('SELECT id FROM locations WHERE id = ?', [locationId]);
    if (locRows.length === 0) {
      res.status(404).json({ error: 'Ubicación no encontrada' });
      return;
    }

    // Insert visit
    const [result] = await pool.execute<mysql.ResultSetHeader>(
      `INSERT INTO visits (locationId, userId, dateTimestamp, type, circuitId, comment, formData, updatedAt)
       VALUES (?, ?, NOW(3), ?, ?, ?, ?, NOW(3))`,
      [
        locationId, 
        userId, 
        type, 
        circuitId || null, 
        comment || null, 
        formData ? JSON.stringify(formData) : null
      ]
    );

    const visitId = result.insertId;

    // Handle images if uploaded
    const files = req.files as Express.Multer.File[];
    if (files && files.length > 0) {
      // Build batch insert query for images
      const values: any[] = [];
      const placeholders = files.map(file => {
        const imageUrl = `/uploads/${file.filename}`;
        values.push(visitId, imageUrl);
        return '(?, ?, NOW(3))';
      }).join(', ');

      await pool.execute(
        `INSERT INTO visit_images (visitId, imageUrl, createdAt) VALUES ${placeholders}`,
        values
      );
    }

    // Fetch the inserted visit with its images
    const [visitRows] = await pool.execute<mysql.RowDataPacket[]>('SELECT * FROM visits WHERE id = ?', [visitId]);
    const [imageRows] = await pool.execute<mysql.RowDataPacket[]>('SELECT id, imageUrl, createdAt FROM visit_images WHERE visitId = ?', [visitId]);

    res.status(201).json({
      ...visitRows[0],
      images: imageRows
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Obtiene el historial de visitas de una locación
 * Endpoint: GET /api/locations/:id/visits
 */
export async function getVisitsByLocation(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const locationId = parseInt(req.params['id'] as string, 10);

    // Get visits
    const [visitRows] = await pool.execute<mysql.RowDataPacket[]>(
      `SELECT v.*, u.name as user_name, u.email as user_email
       FROM visits v
       JOIN users u ON v.userId = u.id
       WHERE v.locationId = ?
       ORDER BY v.dateTimestamp DESC`,
      [locationId]
    );

    if (visitRows.length === 0) {
      res.json([]);
      return;
    }

    // Get images for these visits
    const visitIds = visitRows.map(v => v.id);
    const [imageRows] = await pool.execute<mysql.RowDataPacket[]>(
      `SELECT id, visitId, imageUrl, createdAt
       FROM visit_images
       WHERE visitId IN (${visitIds.map(() => '?').join(',')})
       ORDER BY createdAt ASC`,
      visitIds
    );

    // Map images to their visits
    const visits = visitRows.map(v => {
      const { user_name, user_email, ...visitData } = v;
      
      let formDataObj = visitData.formData;
      if (typeof formDataObj === 'string') {
        try { formDataObj = JSON.parse(formDataObj); } catch { /* ignore */ }
      }

      return {
        ...visitData,
        formData: formDataObj,
        user: { name: user_name, email: user_email },
        images: imageRows.filter(img => img.visitId === v.id).map(img => ({
          id: img.id,
          imageUrl: img.imageUrl,
          createdAt: img.createdAt
        }))
      };
    });

    res.json(visits);
  } catch (error) {
    next(error);
  }
}
