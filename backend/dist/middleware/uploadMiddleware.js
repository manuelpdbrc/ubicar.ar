"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadArray = exports.uploadSingle = exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const crypto_1 = __importDefault(require("crypto"));
const path_1 = __importDefault(require("path"));
/** Allowed MIME types for image uploads */
const ALLOWED_MIMES = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
};
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (_req, file, cb) => {
        const ext = path_1.default.extname(file.originalname).toLowerCase() ||
            ALLOWED_MIMES[file.mimetype] ||
            '.jpg';
        const uniqueName = `${Date.now()}-${crypto_1.default.randomUUID()}${ext}`;
        cb(null, uniqueName);
    },
});
const fileFilter = (_req, file, cb) => {
    if (ALLOWED_MIMES[file.mimetype]) {
        cb(null, true);
    }
    else {
        cb(new multer_1.default.MulterError('LIMIT_UNEXPECTED_FILE'));
    }
};
/**
 * Configured Multer instance for image uploads.
 * - Stores files in `uploads/` with unique timestamped names
 * - Only allows JPEG, PNG, GIF, and WebP images
 * - Maximum file size: 5 MB
 */
exports.upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5 MB
    },
});
/** Middleware for single image upload (field name: 'image') */
exports.uploadSingle = exports.upload.single('image');
/** Middleware for multiple image uploads (field name: 'images', max: 10) */
exports.uploadArray = exports.upload.array('images', 10);
//# sourceMappingURL=uploadMiddleware.js.map