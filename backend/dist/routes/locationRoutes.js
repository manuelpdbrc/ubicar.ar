"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middleware/authMiddleware");
const uploadMiddleware_1 = require("../middleware/uploadMiddleware");
const locationController_1 = require("../controllers/locationController");
const router = (0, express_1.Router)();
// Public endpoint — QR scan landing (no auth required)
router.get('/code/:code', locationController_1.getLocationByCode);
// Protected endpoints
router.get('/', authMiddleware_1.authenticate, locationController_1.getLocations);
router.get('/:id', authMiddleware_1.authenticate, locationController_1.getLocationById);
router.post('/', authMiddleware_1.authenticate, uploadMiddleware_1.upload.single('image'), locationController_1.createLocation);
router.put('/:id', authMiddleware_1.authenticate, uploadMiddleware_1.upload.single('image'), locationController_1.updateLocation);
router.delete('/:id', authMiddleware_1.authenticate, locationController_1.deleteLocation);
exports.default = router;
//# sourceMappingURL=locationRoutes.js.map