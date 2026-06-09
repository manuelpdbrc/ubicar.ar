"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const validateMiddleware_1 = require("../middleware/validateMiddleware");
const authMiddleware_1 = require("../middleware/authMiddleware");
const authSchemas_1 = require("../validators/authSchemas");
const router = (0, express_1.Router)();
router.post('/register', (0, validateMiddleware_1.validate)(authSchemas_1.registerSchema), authController_1.register);
router.post('/login', (0, validateMiddleware_1.validate)(authSchemas_1.loginSchema), authController_1.login);
router.get('/me', authMiddleware_1.authenticate, authController_1.getMe);
exports.default = router;
//# sourceMappingURL=authRoutes.js.map