import express from 'express';
import {
  getAllBrands,
  getBrandById,
  createBrand,
  updateBrand,
  deleteBrand,
  generateBrandCode
} from '../controllers/brand.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', authenticate, getAllBrands);
router.get('/generate-code', authenticate, generateBrandCode);
router.get('/:id', authenticate, getBrandById);
router.post('/', authenticate, createBrand);
router.put('/:id', authenticate, authorize('ADMIN'), updateBrand);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteBrand);

export default router;

