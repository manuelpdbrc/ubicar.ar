"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLocations = getLocations;
exports.getLocationByCode = getLocationByCode;
exports.getLocationById = getLocationById;
exports.createLocation = createLocation;
exports.updateLocation = updateLocation;
exports.deleteLocation = deleteLocation;
const crypto_1 = __importDefault(require("crypto"));
const db_1 = __importDefault(require("../db"));
/**
 * Helper: transforms a flat SQL row (with cat_ prefixed columns) into
 * the nested `{ ...location, category: { id, name, color } }` shape
 * that the frontend expects.
 */
function nestCategory(row) {
    const { cat_id, cat_name, cat_color, collection_ids, ...locationFields } = row;
    const collectionLocations = collection_ids
        ? String(collection_ids).split(',').map(id => ({ collection: { id: parseInt(id, 10) } }))
        : [];
    return {
        ...locationFields,
        category: cat_id
            ? { id: cat_id, name: cat_name, color: cat_color }
            : null,
        collectionLocations
    };
}
/** List locations — filterable by categoryId, supports pagination */
async function getLocations(req, res, next) {
    try {
        const userId = req.user.id;
        const { categoryId, search, page = '1', limit = '50' } = req.query;
        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
        const offset = (pageNum - 1) * limitNum;
        // Build WHERE conditions dynamically
        const conditions = ['l.createdByUserId = ?'];
        const params = [userId];
        if (categoryId) {
            conditions.push('l.categoryId = ?');
            params.push(parseInt(categoryId, 10));
        }
        if (search) {
            conditions.push('l.name LIKE ?');
            params.push(`%${search}%`);
        }
        const whereClause = conditions.join(' AND ');
        // Fetch data and total in parallel
        const dataParams = [...params, String(limitNum), String(offset)];
        const [dataRows, countRows] = await Promise.all([
            db_1.default.execute(`SELECT l.*, c.id as cat_id, c.name as cat_name, c.color as cat_color,
         (
           SELECT GROUP_CONCAT(collectionId)
           FROM collection_locations
           WHERE locationId = l.id
         ) as collection_ids
         FROM locations l
         LEFT JOIN categories c ON l.categoryId = c.id
         WHERE ${whereClause}
         ORDER BY l.createdAt DESC
         LIMIT ? OFFSET ?`, dataParams),
            db_1.default.execute(`SELECT COUNT(*) as total FROM locations l WHERE ${whereClause}`, params),
        ]);
        const data = dataRows[0].map(nestCategory);
        const total = Number(countRows[0][0].total);
        res.json({ data, total, page: pageNum, limit: limitNum });
    }
    catch (error) {
        next(error);
    }
}
/** Get a single location by its unique QR code — PUBLIC endpoint (no auth required) */
async function getLocationByCode(req, res, next) {
    try {
        const rawCode = req.params['code'];
        const normalizedCode = rawCode.replace(/[\s-]/g, '').toUpperCase();
        const [locationRows] = await db_1.default.execute(`SELECT l.*, c.id as cat_id, c.name as cat_name, c.color as cat_color,
         (
           SELECT GROUP_CONCAT(collectionId)
           FROM collection_locations
           WHERE locationId = l.id
         ) as collection_ids
         FROM locations l
         LEFT JOIN categories c ON l.categoryId = c.id
         WHERE REPLACE(REPLACE(UPPER(l.uniqueCode), '-', ''), ' ', '') = ?`, [normalizedCode]);
        if (locationRows.length === 0) {
            res.status(404).json({ error: 'Ubicación no encontrada', details: [{ field: 'code', message: `Buscado: "${rawCode}" -> "${normalizedCode}"` }] });
            return;
        }
        const location = nestCategory(locationRows[0]);
        // Fetch recent visits with user info
        const [visitRows] = await db_1.default.execute(`SELECT v.*, u.id as user_id, u.name as user_name
       FROM visits v
       LEFT JOIN users u ON v.userId = u.id
       WHERE v.locationId = ?
       ORDER BY v.dateTimestamp DESC
       LIMIT 10`, [locationRows[0].id]);
        const visits = visitRows.map((v) => {
            const { user_id, user_name, ...visitFields } = v;
            return {
                ...visitFields,
                user: user_id ? { id: user_id, name: user_name } : null,
            };
        });
        res.json({ ...location, visits });
    }
    catch (error) {
        next(error);
    }
}
/** Get a single location by ID */
async function getLocationById(req, res, next) {
    try {
        const userId = req.user.id;
        const locationId = parseInt(req.params['id'], 10);
        const [locationRows] = await db_1.default.execute(`SELECT l.*, c.id as cat_id, c.name as cat_name, c.color as cat_color,
         (
           SELECT GROUP_CONCAT(collectionId)
           FROM collection_locations
           WHERE locationId = l.id
         ) as collection_ids
         FROM locations l
         LEFT JOIN categories c ON l.categoryId = c.id
         WHERE l.id = ?`, [locationId]);
        if (locationRows.length === 0 || locationRows[0].createdByUserId !== userId) {
            res.status(404).json({ error: 'Ubicación no encontrada' });
            return;
        }
        const location = nestCategory(locationRows[0]);
        // Fetch collection associations
        const [collectionRows] = await db_1.default.execute(`SELECT cl.*, col.id as col_id, col.name as col_name
       FROM collection_locations cl
       JOIN collections col ON cl.collectionId = col.id
       WHERE cl.locationId = ?`, [locationId]);
        const collectionLocations = collectionRows.map((row) => ({
            ...row,
            collection: { id: row.col_id, name: row.col_name },
        }));
        // Fetch visit count
        const [visitCountRows] = await db_1.default.execute('SELECT COUNT(*) as count FROM visits WHERE locationId = ?', [locationId]);
        res.json({
            ...location,
            collectionLocations,
            _count: { visits: Number(visitCountRows[0].count) },
        });
    }
    catch (error) {
        next(error);
    }
}
/** Create a new location with optional image */
async function createLocation(req, res, next) {
    try {
        const userId = req.user.id;
        const body = req.body;
        const name = body['name'] ?? '';
        const latitude = parseFloat(body['latitude'] ?? '');
        const longitude = parseFloat(body['longitude'] ?? '');
        const categoryId = parseInt(body['categoryId'] ?? '', 10);
        if (!name.trim() || isNaN(latitude) || isNaN(longitude) || isNaN(categoryId)) {
            res.status(400).json({ error: 'Datos inválidos: nombre, latitud, longitud y categoría son requeridos' });
            return;
        }
        // Verify the category belongs to the user
        const [catRows] = await db_1.default.execute('SELECT * FROM categories WHERE id = ?', [categoryId]);
        const category = catRows[0];
        if (!category || category.createdByUserId !== userId) {
            res.status(400).json({ error: 'Categoría no válida' });
            return;
        }
        // Handle uploaded image
        const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
        // Generate unique code
        const uniqueCode = crypto_1.default.randomUUID();
        const [result] = await db_1.default.execute(`INSERT INTO locations (name, latitude, longitude, categoryId, imageUrl, uniqueCode, createdByUserId, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(3), NOW(3))`, [name, latitude, longitude, categoryId, imageUrl, uniqueCode, userId]);
        const newLocationId = result.insertId;
        // Handle collectionIds (comma separated string)
        const collectionIdsStr = body['collectionIds'];
        if (collectionIdsStr) {
            const collectionIds = collectionIdsStr.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id));
            for (const colId of collectionIds) {
                // Verify access to collection
                const [accessRows] = await db_1.default.execute(`SELECT CASE WHEN createdByUserId = ? THEN 'CREATOR' ELSE role END as userRole
           FROM collections c
           LEFT JOIN collection_user_permissions p ON p.collectionId = c.id AND p.userId = ?
           WHERE c.id = ? AND (c.createdByUserId = ? OR p.userId = ?)`, [userId, userId, colId, userId, userId]);
                if (accessRows.length > 0 && ['CREATOR', 'EDITOR'].includes(accessRows[0].userRole)) {
                    await db_1.default.execute('INSERT IGNORE INTO collection_locations (collectionId, locationId, addedAt) VALUES (?, ?, NOW(3))', [colId, newLocationId]);
                }
            }
        }
        // Fetch the created location with category
        const [rows] = await db_1.default.execute(`SELECT l.*, c.id as cat_id, c.name as cat_name, c.color as cat_color,
       (
         SELECT GROUP_CONCAT(collectionId)
         FROM collection_locations
         WHERE locationId = l.id
       ) as collection_ids
       FROM locations l
       LEFT JOIN categories c ON l.categoryId = c.id
       WHERE l.id = ?`, [result.insertId]);
        res.status(201).json(nestCategory(rows[0]));
    }
    catch (error) {
        next(error);
    }
}
/** Update a location */
async function updateLocation(req, res, next) {
    try {
        const userId = req.user.id;
        const locationId = parseInt(req.params['id'], 10);
        const body = req.body;
        const name = body['name'];
        const uniqueCode = body['uniqueCode'];
        const latitude = body['latitude'] !== undefined ? parseFloat(body['latitude']) : undefined;
        const longitude = body['longitude'] !== undefined ? parseFloat(body['longitude']) : undefined;
        const categoryId = body['categoryId'] !== undefined ? parseInt(body['categoryId'], 10) : undefined;
        const collectionIdsStr = body['collectionIds'];
        // Verify ownership
        const [locRows] = await db_1.default.execute('SELECT * FROM locations WHERE id = ?', [locationId]);
        const location = locRows[0];
        if (!location || location.createdByUserId !== userId) {
            res.status(404).json({ error: 'Ubicación no encontrada' });
            return;
        }
        // Verify category if changed
        if (categoryId !== undefined) {
            const [catRows] = await db_1.default.execute('SELECT * FROM categories WHERE id = ?', [categoryId]);
            const category = catRows[0];
            if (!category || category.createdByUserId !== userId) {
                res.status(400).json({ error: 'Categoría no válida' });
                return;
            }
        }
        // Handle image update
        const imageUrl = req.file ? `/uploads/${req.file.filename}` : undefined;
        // Verify uniqueCode uniqueness if changed
        if (uniqueCode !== undefined && uniqueCode !== location.uniqueCode) {
            const [existingRows] = await db_1.default.execute('SELECT id FROM locations WHERE uniqueCode = ? AND id != ?', [uniqueCode, locationId]);
            if (existingRows.length > 0) {
                res.status(409).json({ error: 'El código QR ingresado ya está asociado a otra ubicación' });
                return;
            }
        }
        // Build dynamic SET clause
        const setClauses = ['updatedAt = NOW(3)'];
        const params = [];
        if (name !== undefined) {
            setClauses.push('name = ?');
            params.push(name);
        }
        if (uniqueCode !== undefined) {
            setClauses.push('uniqueCode = ?');
            params.push(uniqueCode);
        }
        if (latitude !== undefined) {
            setClauses.push('latitude = ?');
            params.push(latitude);
        }
        if (longitude !== undefined) {
            setClauses.push('longitude = ?');
            params.push(longitude);
        }
        if (categoryId !== undefined) {
            setClauses.push('categoryId = ?');
            params.push(categoryId);
        }
        if (imageUrl !== undefined) {
            setClauses.push('imageUrl = ?');
            params.push(imageUrl);
        }
        params.push(locationId);
        await db_1.default.execute(`UPDATE locations SET ${setClauses.join(', ')} WHERE id = ?`, params);
        // Handle collections update if provided
        if (collectionIdsStr !== undefined) {
            const collectionIds = collectionIdsStr ? collectionIdsStr.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id)) : [];
            // First, get all collections this user can edit
            const [editableColRows] = await db_1.default.execute(`SELECT c.id 
         FROM collections c
         LEFT JOIN collection_user_permissions p ON p.collectionId = c.id AND p.userId = ?
         WHERE (c.createdByUserId = ? OR p.role IN ('CREATOR', 'EDITOR'))`, [userId, userId]);
            const editableColIds = editableColRows.map(r => r.id);
            if (editableColIds.length > 0) {
                // Delete from editable collections
                await db_1.default.execute(`DELETE FROM collection_locations WHERE locationId = ? AND collectionId IN (${editableColIds.map(() => '?').join(',')})`, [locationId, ...editableColIds]);
                // Insert into requested collections that are editable
                const validCollectionIds = collectionIds.filter(id => editableColIds.includes(id));
                for (const colId of validCollectionIds) {
                    await db_1.default.execute('INSERT IGNORE INTO collection_locations (collectionId, locationId, addedAt) VALUES (?, ?, NOW(3))', [colId, locationId]);
                }
            }
        }
        // Fetch the updated location with category
        const [rows] = await db_1.default.execute(`SELECT l.*, c.id as cat_id, c.name as cat_name, c.color as cat_color,
       (
         SELECT GROUP_CONCAT(collectionId)
         FROM collection_locations
         WHERE locationId = l.id
       ) as collection_ids
       FROM locations l
       LEFT JOIN categories c ON l.categoryId = c.id
       WHERE l.id = ?`, [locationId]);
        res.json(nestCategory(rows[0]));
    }
    catch (error) {
        next(error);
    }
}
/** Delete a location */
async function deleteLocation(req, res, next) {
    try {
        const userId = req.user.id;
        const locationId = parseInt(req.params['id'], 10);
        const [locRows] = await db_1.default.execute('SELECT * FROM locations WHERE id = ?', [locationId]);
        const location = locRows[0];
        if (!location || location.createdByUserId !== userId) {
            res.status(404).json({ error: 'Ubicación no encontrada' });
            return;
        }
        // Delete related records first (visits, collection_locations), then the location
        await db_1.default.execute('DELETE FROM visits WHERE locationId = ?', [locationId]);
        await db_1.default.execute('DELETE FROM collection_locations WHERE locationId = ?', [locationId]);
        await db_1.default.execute('DELETE FROM locations WHERE id = ?', [locationId]);
        res.status(204).send();
    }
    catch (error) {
        next(error);
    }
}
//# sourceMappingURL=locationController.js.map