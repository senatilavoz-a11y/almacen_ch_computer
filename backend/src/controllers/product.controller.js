import prisma from '../config/database.js';
import { generateProductCode } from '../utils/generateCode.js';

export const getAllProducts = async (req, res) => {
  try {
    const { search, supplierId, location, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
        { model: { name: { contains: search, mode: 'insensitive' } } },
        { serialNumber: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (supplierId) {
      where.supplierId = supplierId;
    }

    if (location) {
      where.location = { contains: location, mode: 'insensitive' };
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          supplier: {
            select: {
              id: true,
              name: true
            }
          },
          brand: {
            select: {
              id: true,
              name: true
            }
          },
          model: {
            select: {
              id: true,
              name: true,
              code: true
            }
          }
        },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.product.count({ where })
    ]);

    res.json({
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ message: 'Error al obtener productos' });
  }
};

export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        supplier: true,
        brand: true,
        model: true,
        movements: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    res.json(product);
  } catch (error) {
    console.error('Error al obtener producto:', error);
    res.status(500).json({ message: 'Error al obtener producto' });
  }
};

export const createProduct = async (req, res) => {
  try {
    const { name, code, modelId, brandId, serialNumber, quantity, supplierId, location, minStock, description } = req.body;

    // Validar campos obligatorios
    if (!modelId || modelId.trim() === '') {
      return res.status(400).json({ message: 'El modelo es obligatorio' });
    }
    if (!brandId || brandId.trim() === '') {
      return res.status(400).json({ message: 'La marca es obligatoria' });
    }
    if (!serialNumber || serialNumber.trim() === '') {
      return res.status(400).json({ message: 'El número de serie es obligatorio' });
    }

    // Generar código si no se proporciona
    const productCode = code || await generateProductCode();

    // Verificar si el código ya existe
    const existingProduct = await prisma.product.findUnique({
      where: { code: productCode }
    });

    if (existingProduct) {
      return res.status(400).json({ message: 'El código del producto ya existe' });
    }

    // Verificar que la marca existe
    const brand = await prisma.brand.findUnique({
      where: { id: brandId }
    });

    if (!brand) {
      return res.status(400).json({ message: 'La marca especificada no existe' });
    }

    // Verificar que el modelo existe
    const model = await prisma.model.findUnique({
      where: { id: modelId }
    });

    if (!model) {
      return res.status(400).json({ message: 'El modelo especificado no existe' });
    }

    const product = await prisma.product.create({
      data: {
        name,
        code: productCode,
        modelId,
        brandId,
        serialNumber: serialNumber.trim(),
        quantity: parseInt(quantity) || 0,
        minStock: parseInt(minStock) || 0,
        supplierId,
        location,
        description,
        photo: req.file?.filename || null,
        document: null // Se maneja por separado si es necesario
      },
      include: {
        supplier: true,
        brand: true,
        model: true
      }
    });

    res.status(201).json({
      message: 'Producto creado exitosamente',
      product
    });
  } catch (error) {
    console.error('Error al crear producto:', error);
    res.status(500).json({ message: 'Error al crear producto', error: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, modelId, brandId, serialNumber, quantity, supplierId, location, minStock, description } = req.body;

    const product = await prisma.product.findUnique({
      where: { id }
    });

    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    // Validar campos obligatorios
    if (!modelId || modelId.trim() === '') {
      return res.status(400).json({ message: 'El modelo es obligatorio' });
    }
    if (!brandId || brandId.trim() === '') {
      return res.status(400).json({ message: 'La marca es obligatoria' });
    }
    if (!serialNumber || serialNumber.trim() === '') {
      return res.status(400).json({ message: 'El número de serie es obligatorio' });
    }

    // Verificar que la marca existe
    const brand = await prisma.brand.findUnique({
      where: { id: brandId }
    });

    if (!brand) {
      return res.status(400).json({ message: 'La marca especificada no existe' });
    }

    // Verificar que el modelo existe
    const model = await prisma.model.findUnique({
      where: { id: modelId }
    });

    if (!model) {
      return res.status(400).json({ message: 'El modelo especificado no existe' });
    }

    const updateData = {
      name,
      modelId,
      brandId,
      serialNumber: serialNumber.trim(),
      quantity: parseInt(quantity),
      minStock: parseInt(minStock) || 0,
      supplierId,
      location,
      description
    };

    if (req.file) {
      updateData.photo = req.file.filename;
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        supplier: true,
        brand: true,
        model: true
      }
    });

    res.json({
      message: 'Producto actualizado exitosamente',
      product: updatedProduct
    });
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    res.status(500).json({ message: 'Error al actualizar producto' });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id }
    });

    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    await prisma.product.delete({
      where: { id }
    });

    res.json({ message: 'Producto eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    res.status(500).json({ message: 'Error al eliminar producto' });
  }
};

export const getLowStockProducts = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: {
        quantity: {
          lte: prisma.product.fields.minStock
        }
      },
      include: {
        supplier: {
          select: {
            name: true
          }
        },
        brand: {
          select: {
            name: true
          }
        },
        model: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        quantity: 'asc'
      }
    });

    res.json(products);
  } catch (error) {
    console.error('Error al obtener productos con stock bajo:', error);
    res.status(500).json({ message: 'Error al obtener productos con stock bajo' });
  }
};

export const generateProductCodeHandler = async (req, res) => {
  try {
    const code = await generateProductCode();
    res.json({ code });
  } catch (error) {
    console.error('Error al generar código de producto:', error);
    res.status(500).json({ message: 'Error al generar código de producto' });
  }
};

export const createMultipleProducts = async (req, res) => {
  try {
    const { products } = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ message: 'Se requiere un array de productos' });
    }

    const createdProducts = [];
    const errors = [];

    for (let i = 0; i < products.length; i++) {
      const productData = products[i];
      const { name, code, modelId, brandId, serialNumber, quantity, supplierId, location, minStock, description } = productData;

      try {
        // Validar campos obligatorios
        if (!modelId || modelId.trim() === '') {
          errors.push({ index: i, message: 'El modelo es obligatorio' });
          continue;
        }
        if (!brandId || brandId.trim() === '') {
          errors.push({ index: i, message: 'La marca es obligatoria' });
          continue;
        }
        if (!serialNumber || serialNumber.trim() === '') {
          errors.push({ index: i, message: 'El número de serie es obligatorio' });
          continue;
        }

        // Generar código si no se proporciona
        const productCode = code || await generateProductCode();

        // Verificar si el código ya existe
        const existingProduct = await prisma.product.findUnique({
          where: { code: productCode }
        });

        if (existingProduct) {
          errors.push({ index: i, message: `El código ${productCode} ya existe` });
          continue;
        }

        // Verificar que la marca existe
        const brand = await prisma.brand.findUnique({
          where: { id: brandId }
        });

        if (!brand) {
          errors.push({ index: i, message: 'La marca especificada no existe' });
          continue;
        }

        // Verificar que el modelo existe
        const model = await prisma.model.findUnique({
          where: { id: modelId }
        });

        if (!model) {
          errors.push({ index: i, message: 'El modelo especificado no existe' });
          continue;
        }

        const product = await prisma.product.create({
          data: {
            name,
            code: productCode,
            modelId,
            brandId,
            serialNumber: serialNumber.trim(),
            quantity: parseInt(quantity) || 0,
            minStock: parseInt(minStock) || 0,
            supplierId,
            location,
            description,
            photo: null, // Las fotos se manejan individualmente
            document: null
          },
          include: {
            supplier: true,
            brand: true,
            model: true
          }
        });

        createdProducts.push(product);
      } catch (error) {
        errors.push({ index: i, message: error.message });
      }
    }

    res.status(201).json({
      message: `${createdProducts.length} producto(s) creado(s) exitosamente`,
      created: createdProducts,
      errors: errors.length > 0 ? errors : undefined,
      total: products.length,
      success: createdProducts.length
    });
  } catch (error) {
    console.error('Error al crear productos múltiples:', error);
    res.status(500).json({ message: 'Error al crear productos múltiples', error: error.message });
  }
};

