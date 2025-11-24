import prisma from '../config/database.js';
import { generateMovementCode } from '../utils/generateCode.js';

const buildBatchWhere = ({ type, startDate, endDate, search }) => {
  const where = {};

  if (type) {
    where.type = type;
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) {
      where.createdAt.gte = new Date(startDate);
    }
    if (endDate) {
      where.createdAt.lte = new Date(endDate);
    }
  }

  if (search) {
    where.movements = {
      some: {
        product: {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { code: { contains: search, mode: 'insensitive' } }
          ]
        }
      }
    };
  }

  return where;
};

const batchInclude = {
  user: {
    select: {
      id: true,
      name: true,
      email: true
    }
  },
  movements: {
    include: {
      product: {
        select: {
          id: true,
          name: true,
          code: true,
          quantity: true,
          location: true,
          supplier: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }
    }
  }
};

const adjustStock = async (tx, productId, quantity, type) => {
  const product = await tx.product.findUnique({
    where: { id: productId }
  });

  if (!product) {
    throw new Error('Producto no encontrado');
  }

  if (type === 'SALIDA' && product.quantity < quantity) {
    const error = new Error('STOCK_INSUFFICIENT');
    error.meta = {
      available: product.quantity,
      productName: product.name
    };
    throw error;
  }

  await tx.product.update({
    where: { id: productId },
    data: {
      quantity: type === 'ENTRADA'
        ? { increment: quantity }
        : { decrement: quantity }
    }
  });
};

export const getAllMovements = async (req, res) => {
  try {
    const {
      type,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 20
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = buildBatchWhere({ type, startDate, endDate, search });

    const [batches, total] = await Promise.all([
      prisma.movementBatch.findMany({
        where,
        include: batchInclude,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.movementBatch.count({ where })
    ]);

    res.json({
      movements: batches,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error al obtener movimientos:', error);
    res.status(500).json({ message: 'Error al obtener movimientos' });
  }
};

export const createMovement = async (req, res) => {
  try {
    const { productId, type, quantity, reason, notes, code } = req.body;
    const userId = req.user.id;

    if (!productId || !type || !quantity) {
      return res.status(400).json({ message: 'Datos incompletos' });
    }

    const parsedQuantity = parseInt(quantity);
    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      return res.status(400).json({ message: 'Cantidad inválida' });
    }

    const movementCode = code?.trim() || await generateMovementCode();

    const batch = await prisma.$transaction(async (tx) => {
      const createdBatch = await tx.movementBatch.create({
        data: {
          code: movementCode,
          type,
          reason,
          notes,
          totalQuantity: parsedQuantity,
          userId
        }
      });

      await adjustStock(tx, productId, parsedQuantity, type);

      await tx.movement.create({
        data: {
          batchId: createdBatch.id,
          productId,
          quantity: parsedQuantity
        }
      });

      return createdBatch;
    });

    const fullBatch = await prisma.movementBatch.findUnique({
      where: { id: batch.id },
      include: batchInclude
    });

    res.status(201).json({
      message: 'Movimiento registrado exitosamente',
      movement: fullBatch
    });
  } catch (error) {
    if (error.message === 'STOCK_INSUFFICIENT') {
      return res.status(400).json({
        message: `Stock insuficiente para el producto ${error.meta?.productName}`,
        available: error.meta?.available
      });
    }

    console.error('Error al crear movimiento:', error);
    res.status(500).json({ message: 'Error al crear movimiento', error: error.message });
  }
};

export const createMultipleMovements = async (req, res) => {
  try {
    const { movements, type, reason, notes, code } = req.body;
    const userId = req.user.id;

    if (!Array.isArray(movements) || movements.length === 0) {
      return res.status(400).json({ message: 'Se requiere un array de movimientos' });
    }

    if (!type) {
      return res.status(400).json({ message: 'El tipo de movimiento es obligatorio' });
    }

    const preparedItems = movements.map((movement, index) => {
      if (!movement.productId || !movement.quantity) {
        throw new Error(`El movimiento #${index + 1} está incompleto`);
      }
      const parsedQuantity = parseInt(movement.quantity);
      if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
        throw new Error(`La cantidad del movimiento #${index + 1} es inválida`);
      }
      return {
        productId: movement.productId,
        quantity: parsedQuantity
      };
    });

    const totalQuantity = preparedItems.reduce((sum, item) => sum + item.quantity, 0);
    const movementCode = code?.trim() || await generateMovementCode();

    try {
      const batch = await prisma.$transaction(async (tx) => {
        const createdBatch = await tx.movementBatch.create({
          data: {
            code: movementCode,
            type,
            reason,
            notes,
            totalQuantity,
            userId
          }
        });

        for (const item of preparedItems) {
          await adjustStock(tx, item.productId, item.quantity, type);
          await tx.movement.create({
            data: {
              batchId: createdBatch.id,
              productId: item.productId,
              quantity: item.quantity
            }
          });
        }

        return createdBatch;
      });

      const fullBatch = await prisma.movementBatch.findUnique({
        where: { id: batch.id },
        include: batchInclude
      });

      res.status(201).json({
        message: 'Movimientos registrados exitosamente',
        movement: fullBatch
      });
    } catch (error) {
      if (error.message === 'STOCK_INSUFFICIENT') {
        return res.status(400).json({
          message: `Stock insuficiente para el producto ${error.meta?.productName}`,
          available: error.meta?.available
        });
      }
      throw error;
    }
  } catch (error) {
    console.error('Error al crear movimientos múltiples:', error);
    res.status(500).json({ message: 'Error al crear movimientos múltiples', error: error.message });
  }
};

export const getMovementById = async (req, res) => {
  try {
    const { id } = req.params;

    const batch = await prisma.movementBatch.findUnique({
      where: { id },
      include: batchInclude
    });

    if (!batch) {
      return res.status(404).json({ message: 'Movimiento no encontrado' });
    }

    res.json(batch);
  } catch (error) {
    console.error('Error al obtener movimiento:', error);
    res.status(500).json({ message: 'Error al obtener movimiento' });
  }
};

export const getMovementByCode = async (req, res) => {
  try {
    const { code } = req.params;

    const batch = await prisma.movementBatch.findUnique({
      where: { code },
      include: batchInclude
    });

    if (!batch) {
      return res.status(404).json({ message: 'Movimiento no encontrado' });
    }

    res.json(batch);
  } catch (error) {
    console.error('Error al obtener movimiento por código:', error);
    res.status(500).json({ message: 'Error al obtener movimiento' });
  }
};

export const generateMovementCodeHandler = async (req, res) => {
  try {
    const code = await generateMovementCode();
    res.json({ code });
  } catch (error) {
    console.error('Error al generar código de movimiento:', error);
    res.status(500).json({ message: 'Error al generar código de movimiento' });
  }
};

