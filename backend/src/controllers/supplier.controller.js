import prisma from '../config/database.js';

export const getAllSuppliers = async (req, res) => {
  try {
    const suppliers = await prisma.supplier.findMany({
      include: {
        _count: {
          select: {
            products: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json(suppliers);
  } catch (error) {
    console.error('Error al obtener proveedores:', error);
    res.status(500).json({ message: 'Error al obtener proveedores' });
  }
};

export const getSupplierById = async (req, res) => {
  try {
    const { id } = req.params;

    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        products: {
          select: {
            id: true,
            name: true,
            code: true,
            quantity: true
          }
        }
      }
    });

    if (!supplier) {
      return res.status(404).json({ message: 'Proveedor no encontrado' });
    }

    res.json(supplier);
  } catch (error) {
    console.error('Error al obtener proveedor:', error);
    res.status(500).json({ message: 'Error al obtener proveedor' });
  }
};

export const createSupplier = async (req, res) => {
  try {
    const { name, contact, email, phone, address } = req.body;

    const supplier = await prisma.supplier.create({
      data: {
        name,
        contact,
        email,
        phone,
        address
      }
    });

    res.status(201).json({
      message: 'Proveedor creado exitosamente',
      supplier
    });
  } catch (error) {
    console.error('Error al crear proveedor:', error);
    res.status(500).json({ message: 'Error al crear proveedor' });
  }
};

export const updateSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, contact, email, phone, address } = req.body;

    const supplier = await prisma.supplier.findUnique({
      where: { id }
    });

    if (!supplier) {
      return res.status(404).json({ message: 'Proveedor no encontrado' });
    }

    const updatedSupplier = await prisma.supplier.update({
      where: { id },
      data: {
        name,
        contact,
        email,
        phone,
        address
      }
    });

    res.json({
      message: 'Proveedor actualizado exitosamente',
      supplier: updatedSupplier
    });
  } catch (error) {
    console.error('Error al actualizar proveedor:', error);
    res.status(500).json({ message: 'Error al actualizar proveedor' });
  }
};

export const deleteSupplier = async (req, res) => {
  try {
    const { id } = req.params;

    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            products: true
          }
        }
      }
    });

    if (!supplier) {
      return res.status(404).json({ message: 'Proveedor no encontrado' });
    }

    if (supplier._count.products > 0) {
      return res.status(400).json({ 
        message: 'No se puede eliminar el proveedor porque tiene productos asociados' 
      });
    }

    await prisma.supplier.delete({
      where: { id }
    });

    res.json({ message: 'Proveedor eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar proveedor:', error);
    res.status(500).json({ message: 'Error al eliminar proveedor' });
  }
};

