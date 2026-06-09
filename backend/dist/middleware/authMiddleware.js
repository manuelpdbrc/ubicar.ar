"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signToken = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
/**
 * Returns the JWT_SECRET from env, throwing immediately if it's missing.
 * This ensures the app never silently runs without a secret configured.
 */
function getJwtSecret() {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET no está definido en las variables de entorno. La aplicación no puede iniciar sin esta configuración.');
    }
    return secret;
}
/**
 * Express middleware that verifies a Bearer JWT from the Authorization header.
 * On success, attaches the decoded `{ id, globalRole }` to `req.user`.
 * On failure, responds with 401.
 */
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Token de autenticación requerido' });
        return;
    }
    const token = authHeader.split(' ')[1];
    try {
        const secret = getJwtSecret();
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        req.user = { id: decoded.id, globalRole: decoded.globalRole };
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            res.status(401).json({ error: 'Token expirado' });
            return;
        }
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            res.status(401).json({ error: 'Token inválido' });
            return;
        }
        next(error);
    }
};
exports.authenticate = authenticate;
/** 7 days expressed in seconds */
const DEFAULT_TOKEN_EXPIRY = 7 * 24 * 60 * 60; // 604800s
/**
 * Helper to generate a signed JWT for a user.
 * @param payload - Data to encode (id, globalRole)
 * @param expiresIn - Token lifetime in seconds (default: 7 days)
 */
const signToken = (payload, expiresIn = DEFAULT_TOKEN_EXPIRY) => {
    const secret = getJwtSecret();
    return jsonwebtoken_1.default.sign(payload, secret, { expiresIn });
};
exports.signToken = signToken;
//# sourceMappingURL=authMiddleware.js.map