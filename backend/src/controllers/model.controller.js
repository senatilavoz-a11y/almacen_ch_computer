import prisma from '../config/database.js';
import { generateModelCode as generateModelCodeUtil } from '../utils/generateCode.js';

export const getAllModels = async (req, res) => {
  try {
    const { brandId } = req.query;
    const where = brandId ? { brandId } : {};

    const models = await prisma.model.findMany({
      where,
      include: {
        brand: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json(models);
  } catch (error) {
    console.error('Error al obtener modelos:', error);
    res.status(500).json({ message: 'Error al obtener modelos' });
  }
};

export const getModelById = async (req, res) => {
  try {
    const { id } = req.params;

    const model = await prisma.model.findUnique({
      where: { id },
      include: {
        brand: true,
        products: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      }
    });

    if (!model) {
      return res.status(404).json({ message: 'Modelo no encontrado' });
    }

    res.json(model);
  } catch (error) {
    console.error('Error al obtener modelo:', error);
    res.status(500).json({ message: 'Error al obtener modelo' });
  }
};

export const createModel = async (req, res) => {
  try {
    const { name, brandId, code } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'El nombre del modelo es obligatorio' });
    }

    // Verificar si el modelo ya existe (mismo nombre y marca)
    const existingModel = await prisma.model.findFirst({
      where: {
        name: name.trim(),
        brandId: brandId || null
      }
    });

    if (existingModel) {
      return res.status(400).json({ message: 'El modelo ya existe para esta marca' });
    }

    const modelData = {
      name: name.trim(),
      brandId: brandId || null
    };

    // Agregar código si se proporciona
    if (code && code.trim() !== '') {
      // Verificar si el código ya existe
      const existingCode = await prisma.model.findUnique({
        where: { code: code.trim() }
      });
      if (existingCode) {
        return res.status(400).json({ message: 'El código ya existe' });
      }
      modelData.code = code.trim();
    }

    const model = await prisma.model.create({
      data: modelData,
      include: {
        brand: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Modelo creado exitosamente',
      model
    });
  } catch (error) {
    console.error('Error al crear modelo:', error);
    res.status(500).json({ message: 'Error al crear modelo', error: error.message });
  }
};

export const updateModel = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, brandId } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'El nombre del modelo es obligatorio' });
    }

    const model = await prisma.model.findUnique({
      where: { id }
    });

    if (!model) {
      return res.status(404).json({ message: 'Modelo no encontrado' });
    }

    // Verificar si el nuevo nombre ya existe en otro modelo de la misma marca
    const existingModel = await prisma.model.findFirst({
      where: {
        name: name.trim(),
        brandId: brandId || null,
        NOT: { id }
      }
    });

    if (existingModel) {
      return res.status(400).json({ message: 'Ya existe un modelo con ese nombre para esta marca' });
    }

    const updatedModel = await prisma.model.update({
      where: { id },
      data: {
        name: name.trim(),
        brandId: brandId || null
      },
      include: {
        brand: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    res.json({
      message: 'Modelo actualizado exitosamente',
      model: updatedModel
    });
  } catch (error) {
    console.error('Error al actualizar modelo:', error);
    res.status(500).json({ message: 'Error al actualizar modelo' });
  }
};

export const deleteModel = async (req, res) => {
  try {
    const { id } = req.params;

    const model = await prisma.model.findUnique({
      where: { id },
      include: {
        products: {
          take: 1
        }
      }
    });

    if (!model) {
      return res.status(404).json({ message: 'Modelo no encontrado' });
    }

    // Verificar si hay productos asociados
    if (model.products.length > 0) {
      return res.status(400).json({ 
        message: 'No se puede eliminar el modelo porque tiene productos asociados' 
      });
    }

    await prisma.model.delete({
      where: { id }
    });

    res.json({ message: 'Modelo eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar modelo:', error);
    res.status(500).json({ message: 'Error al eliminar modelo' });
  }
};

export const generateModelCode = async (req, res) => {
  try {
    const code = await generateModelCodeUtil();
    res.json({ code });
  } catch (error) {
    console.error('Error al generar código de modelo:', error);
    res.status(500).json({ message: 'Error al generar código de modelo' });
  }
};

