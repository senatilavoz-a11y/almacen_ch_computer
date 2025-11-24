import express from 'express';
import {
  exportProductsPDF,
  exportProductsExcel,
  exportProductsCSV,
  exportMovementsPDF,
  exportMovementsExcel
} from '../controllers/export.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/products/pdf', authenticate, exportProductsPDF);
router.get('/products/excel', authenticate, exportProductsExcel);
router.get('/products/csv', authenticate, exportProductsCSV);
router.get('/movements/pdf', authenticate, exportMovementsPDF);
router.get('/movements/excel', authenticate, exportMovementsExcel);

export default router;

