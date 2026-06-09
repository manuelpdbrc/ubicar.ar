import multer from 'multer';
import crypto from 'crypto';
import path from 'path';

/** Allowed MIME types for image uploads */
const ALLOWED_MIMES: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() ||
      ALLOWED_MIMES[file.mimetype] ||
      '.jpg';
    const uniqueName = `${Date.now()}-${crypto.randomUUID()}${ext}`;
    cb(null, uniqueName);
  },
});

const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  if (ALLOWED_MIMES[file.mimetype]) {
    cb(null, true);
  } else {
    cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE'));
  }
};

/**
 * Configured Multer instance for image uploads.
 * - Stores files in `uploads/` with unique timestamped names
 * - Only allows JPEG, PNG, GIF, and WebP images
 * - Maximum file size: 5 MB
 */
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
});

/** Middleware for single image upload (field name: 'image') */
export const uploadSingle = upload.single('image');

/** Middleware for multiple image uploads (field name: 'images', max: 10) */
export const uploadArray = upload.array('images', 10);
