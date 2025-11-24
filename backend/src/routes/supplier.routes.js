import express from 'express';
import {
  getAllSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier
} from '../controllers/supplier.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', authenticate, getAllSuppliers);
router.get('/:id', authenticate, getSupplierById);
router.post('/', authenticate, authorize('ADMIN'), createSupplier);
router.put('/:id', authenticate, authorize('ADMIN'), updateSupplier);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteSupplier);

export default router;

