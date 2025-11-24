import prisma from '../config/database.js';

export const getDashboardStats = async (req, res) => {
  try {
    const [
      totalProducts,
      totalQuantity,
      lowStockCount,
      totalMovements,
      recentMovementLines,
      movementsByType,
      topProducts
    ] = await Promise.all([
      // Total de productos
      prisma.product.count(),
      
      // Cantidad total de productos
      prisma.product.aggregate({
        _sum: {
          quantity: true
        }
      }),

      // Productos con stock bajo
      prisma.product.count({
        where: {
          quantity: {
            lte: prisma.product.fields.minStock
          }
        }
      }),

      // Total de movimientos
      prisma.movementBatch.count(),

      // Líneas de movimientos recientes (para mostrar detalle similar al diseño anterior)
      prisma.movement.findMany({
        take: 10,
        orderBy: {
          batch: {
            createdAt: 'desc'
          }
        },
        include: {
          product: {
            select: {
              name: true,
              code: true
            }
          },
          batch: {
            select: {
              id: true,
              type: true,
              createdAt: true,
              user: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      }),

      // Movimientos por tipo (últimos 30 días)
      prisma.movementBatch.groupBy({
        by: ['type'],
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        },
        _count: {
          id: true
        }
      }),

      // Productos más movidos
      prisma.movement.groupBy({
        by: ['productId'],
        _count: {
          id: true
        },
        orderBy: {
          _count: {
            id: 'desc'
          }
        },
        take: 5
      })
    ]);

    // Obtener detalles de productos más movidos
    const topProductsDetails = await Promise.all(
      topProducts.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: {
            id: true,
            name: true,
            code: true,
            quantity: true
          }
        });
        return {
          ...product,
          movementsCount: item._count.id
        };
      })
    );

    // Movimientos por día (últimos 7 días)
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const count = await prisma.movementBatch.count({
        where: {
          createdAt: {
            gte: date,
            lt: nextDate
          }
        }
      });

      last7Days.push({
        date: date.toISOString().split('T')[0],
        count
      });
    }

    const recentMovements = recentMovementLines.map((line) => ({
      id: line.id,
      createdAt: line.batch.createdAt,
      type: line.batch.type,
      quantity: line.quantity,
      product: line.product,
      user: line.batch.user
    }));

    res.json({
      totalProducts,
      totalQuantity: totalQuantity._sum.quantity || 0,
      lowStockCount,
      totalMovements,
      recentMovements,
      movementsByType: movementsByType.reduce((acc, item) => {
        acc[item.type] = item._count.id;
        return acc;
      }, {}),
      topProducts: topProductsDetails,
      movementsLast7Days: last7Days
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ message: 'Error al obtener estadísticas' });
  }
};

