import PDFDocument from 'pdfkit';
import XLSX from 'xlsx';
import prisma from '../config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const exportProductsPDF = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        supplier: {
          select: {
            name: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=productos.pdf');
    
    doc.pipe(res);

    // Encabezado
    doc.fontSize(20).text('Reporte de Productos - CH Computer', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, { align: 'center' });
    doc.moveDown(2);

    // Tabla
    let y = doc.y;
    products.forEach((product, index) => {
      if (y > 700) {
        doc.addPage();
        y = 50;
      }

      doc.fontSize(10)
         .text(`${index + 1}. ${product.name}`, 50, y)
         .text(`Código: ${product.code}`, 50, y + 15)
         .text(`Cantidad: ${product.quantity} | Ubicación: ${product.location}`, 50, y + 30)
         .text(`Proveedor: ${product.supplier.name}`, 50, y + 45);
      
      y += 70;
    });

    doc.end();
  } catch (error) {
    console.error('Error al exportar PDF:', error);
    res.status(500).json({ message: 'Error al exportar PDF' });
  }
};

export const exportProductsExcel = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        supplier: {
          select: {
            name: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    const data = products.map(product => ({
      'Código': product.code,
      'Nombre': product.name,
      'Cantidad': product.quantity,
      'Stock Mínimo': product.minStock,
      'Ubicación': product.location,
      'Proveedor': product.supplier.name,
      'Fecha Creación': product.createdAt.toLocaleDateString('es-ES')
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Productos');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=productos.xlsx');
    res.send(buffer);
  } catch (error) {
    console.error('Error al exportar Excel:', error);
    res.status(500).json({ message: 'Error al exportar Excel' });
  }
};

export const exportProductsCSV = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        supplier: {
          select: {
            name: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    const headers = ['Código', 'Nombre', 'Cantidad', 'Stock Mínimo', 'Ubicación', 'Proveedor', 'Fecha Creación'];
    const rows = products.map(product => [
      product.code,
      product.name,
      product.quantity,
      product.minStock,
      product.location,
      product.supplier.name,
      product.createdAt.toLocaleDateString('es-ES')
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=productos.csv');
    res.send('\ufeff' + csv); // BOM para Excel
  } catch (error) {
    console.error('Error al exportar CSV:', error);
    res.status(500).json({ message: 'Error al exportar CSV' });
  }
};

const buildMovementExportWhere = ({ startDate, endDate, type, movementId }) => {
  const where = {};
  if (movementId) {
    where.id = movementId;
  }
  if (type) {
    where.type = type;
  }
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }
  return where;
};

const movementBatchInclude = {
  user: {
    select: {
      id: true,
      name: true
    }
  },
  movements: {
    include: {
      product: {
        select: {
          id: true,
          name: true,
          code: true
        }
      }
    }
  }
};

export const exportMovementsPDF = async (req, res) => {
  try {
    const { startDate, endDate, type, movementId } = req.query;
    
    const where = buildMovementExportWhere({ startDate, endDate, type, movementId });

    const batches = await prisma.movementBatch.findMany({
      where,
      include: movementBatchInclude,
      orderBy: { createdAt: 'desc' }
    });

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=movimientos.pdf');
    
    doc.pipe(res);

    doc.fontSize(20).text('Reporte de Movimientos - CH Computer', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Generado: ${new Date().toLocaleDateString('es-ES')} ${new Date().toLocaleTimeString('es-ES')}`, { align: 'center' });
    doc.moveDown(2);

    batches.forEach((batch, index) => {
      if (index > 0) {
        doc.addPage();
      }

      doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .text(`Movimiento ${batch.code}`, { align: 'left' });
      doc.moveDown(0.5);

      doc
        .fontSize(10)
        .font('Helvetica')
        .text(`Tipo: ${batch.type}`)
        .text(`Usuario: ${batch.user.name}`)
        .text(`Fecha: ${batch.createdAt.toLocaleDateString('es-ES')} ${batch.createdAt.toLocaleTimeString('es-ES')}`)
        .text(`Cantidad total: ${batch.totalQuantity}`);

      if (batch.reason) {
        doc.text(`Razón: ${batch.reason}`);
      }
      if (batch.notes) {
        doc.text(`Notas: ${batch.notes}`);
      }

      doc.moveDown();

      // Encabezado de tabla
      const tableTop = doc.y;
      doc
        .font('Helvetica-Bold')
        .text('Producto', 50, tableTop)
        .text('Código', 200, tableTop)
        .text('Cantidad', 320, tableTop);

      doc.moveTo(50, tableTop + 12).lineTo(550, tableTop + 12).stroke();

      doc.font('Helvetica');
      let rowY = tableTop + 20;

      batch.movements.forEach((movement) => {
        doc
          .text(movement.product.name, 50, rowY)
          .text(movement.product.code, 200, rowY)
          .text(movement.quantity.toString(), 320, rowY);
        rowY += 18;
      });
    });

    doc.end();
  } catch (error) {
    console.error('Error al exportar movimientos PDF:', error);
    res.status(500).json({ message: 'Error al exportar PDF' });
  }
};

export const exportMovementsExcel = async (req, res) => {
  try {
    const { startDate, endDate, type, movementId } = req.query;
    
    const where = buildMovementExportWhere({ startDate, endDate, type, movementId });

    const batches = await prisma.movementBatch.findMany({
      where,
      include: movementBatchInclude,
      orderBy: { createdAt: 'desc' }
    });

    const data = [];

    batches.forEach((batch) => {
      batch.movements.forEach((movement) => {
        data.push({
          'Código Movimiento': batch.code,
          'Tipo': batch.type,
          'Fecha': batch.createdAt.toLocaleDateString('es-ES'),
          'Producto': movement.product.name,
          'Código Producto': movement.product.code,
          'Cantidad': movement.quantity,
          'Cantidad Total': batch.totalQuantity,
          'Usuario': batch.user.name,
          'Razón': batch.reason || '',
          'Notas': batch.notes || ''
        });
      });
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Movimientos');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=movimientos.xlsx');
    res.send(buffer);
  } catch (error) {
    console.error('Error al exportar movimientos Excel:', error);
    res.status(500).json({ message: 'Error al exportar Excel' });
  }
};

