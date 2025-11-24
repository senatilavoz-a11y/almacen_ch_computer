import express from 'express';
import { getLocations, createLocation } from '../controllers/location.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', authenticate, getLocations);
router.post('/', authenticate, createLocation);

export default router;

