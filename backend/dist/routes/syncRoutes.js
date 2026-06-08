"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const syncController_1 = require("../controllers/syncController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const uploadMiddleware_1 = require("../middleware/uploadMiddleware");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authenticateToken);
// Accepts an array of files under the 'images' field
router.post('/', uploadMiddleware_1.upload.array('images', 10), syncController_1.syncOfflineData);
exports.default = router;
