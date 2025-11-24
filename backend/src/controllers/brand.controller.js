import prisma from '../config/database.js';
import { generateBrandCode as generateBrandCodeUtil } from '../utils/generateCode.js';

export const getAllBrands = async (req, res) => {
  try {
    const brands = await prisma.brand.findMany({
      orderBy: { name: 'asc' }
    });

    res.json(brands);
  } catch (error) {
    console.error('Error al obtener marcas:', error);
    res.status(500).json({ message: 'Error al obtener marcas' });
  }
};

export const getBrandById = async (req, res) => {
  try {
    const { id } = req.params;

    const brand = await prisma.brand.findUnique({
      where: { id },
      include: {
        products: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      }
    });

    if (!brand) {
      return res.status(404).json({ message: 'Marca no encontrada' });
    }

    res.json(brand);
  } catch (error) {
    console.error('Error al obtener marca:', error);
    res.status(500).json({ message: 'Error al obtener marca' });
  }
};

export const createBrand = async (req, res) => {
  try {
    const { name, code } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'El nombre de la marca es obligatorio' });
    }

    // Verificar si la marca ya existe
    const existingBrand = await prisma.brand.findUnique({
      where: { name: name.trim() }
    });

    if (existingBrand) {
      return res.status(400).json({ message: 'La marca ya existe' });
    }

    const brandData = {
      name: name.trim()
    };

    // Agregar código si se proporciona
    if (code && code.trim() !== '') {
      // Verificar si el código ya existe
      const existingCode = await prisma.brand.findUnique({
        where: { code: code.trim() }
      });
      if (existingCode) {
        return res.status(400).json({ message: 'El código ya existe' });
      }
      brandData.code = code.trim();
    }

    const brand = await prisma.brand.create({
      data: brandData
    });

    res.status(201).json({
      message: 'Marca creada exitosamente',
      brand
    });
  } catch (error) {
    console.error('Error al crear marca:', error);
    res.status(500).json({ message: 'Error al crear marca', error: error.message });
  }
};

export const updateBrand = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'El nombre de la marca es obligatorio' });
    }

    const brand = await prisma.brand.findUnique({
      where: { id }
    });

    if (!brand) {
      return res.status(404).json({ message: 'Marca no encontrada' });
    }

    // Verificar si el nuevo nombre ya existe en otra marca
    const existingBrand = await prisma.brand.findUnique({
      where: { name: name.trim() }
    });

    if (existingBrand && existingBrand.id !== id) {
      return res.status(400).json({ message: 'Ya existe una marca con ese nombre' });
    }

    const updatedBrand = await prisma.brand.update({
      where: { id },
      data: {
        name: name.trim()
      }
    });

    res.json({
      message: 'Marca actualizada exitosamente',
      brand: updatedBrand
    });
  } catch (error) {
    console.error('Error al actualizar marca:', error);
    res.status(500).json({ message: 'Error al actualizar marca' });
  }
};

export const deleteBrand = async (req, res) => {
  try {
    const { id } = req.params;

    const brand = await prisma.brand.findUnique({
      where: { id },
      include: {
        products: {
          take: 1
        }
      }
    });

    if (!brand) {
      return res.status(404).json({ message: 'Marca no encontrada' });
    }

    // Verificar si hay productos asociados
    if (brand.products.length > 0) {
      return res.status(400).json({ 
        message: 'No se puede eliminar la marca porque tiene productos asociados' 
      });
    }

    await prisma.brand.delete({
      where: { id }
    });

    res.json({ message: 'Marca eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar marca:', error);
    res.status(500).json({ message: 'Error al eliminar marca' });
  }
};

export const generateBrandCode = async (req, res) => {
  try {
    const code = await generateBrandCodeUtil();
    res.json({ code });
  } catch (error) {
    console.error('Error al generar código de marca:', error);
    res.status(500).json({ message: 'Error al generar código de marca' });
  }
};

