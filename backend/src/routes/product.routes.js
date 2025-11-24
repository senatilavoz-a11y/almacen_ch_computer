import express from 'express';
import {
  getAllProducts,
  getProductById,
  createProduct,
  createMultipleProducts,
  updateProduct,
  deleteProduct,
  getLowStockProducts,
  generateProductCodeHandler
} from '../controllers/product.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { uploadPhoto } from '../middlewares/upload.middleware.js';

const router = express.Router();

router.get('/', authenticate, getAllProducts);
router.get('/low-stock', authenticate, getLowStockProducts);
router.get('/generate-code', authenticate, generateProductCodeHandler);
router.post('/batch', authenticate, createMultipleProducts);
router.get('/:id', authenticate, getProductById);
router.post('/', authenticate, uploadPhoto, createProduct);
router.put('/:id', authenticate, authorize('ADMIN'), uploadPhoto, updateProduct);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteProduct);

export default router;

