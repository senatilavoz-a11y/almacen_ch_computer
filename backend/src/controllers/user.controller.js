import bcrypt from 'bcryptjs';
import prisma from '../config/database.js';
 
export const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        createdAt: true,
        _count: {
          select: {
            movementBatches: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
 
    res.json(users);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ message: 'Error al obtener usuarios' });
  }
};
 
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
 
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        createdAt: true,
        movementBatches: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            movements: {
              include: {
                product: {
                  select: {
                    name: true,
                    code: true
                  }
                }
              }
            }
          }
        }
      }
    });
 
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
 
    res.json(user);
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({ message: 'Error al obtener usuario' });
  }
};
 
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, active, password } = req.body;
 
    const user = await prisma.user.findUnique({
      where: { id }
    });
 
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
 
    const updateData = { name, email, role, active };
 
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }
 
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true
      }
    });
 
    res.json({
      message: 'Usuario actualizado exitosamente',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ message: 'Error al actualizar usuario' });
  }
};
 
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
 
    // No permitir eliminar el propio usuario
    if (id === req.user.id) {
      return res.status(400).json({ message: 'No puedes eliminar tu propio usuario' });
    }
 
    const user = await prisma.user.findUnique({
      where: { id }
    });
 
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
 
    await prisma.user.delete({
      where: { id }
    });
 
    res.json({ message: 'Usuario eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ message: 'Error al eliminar usuario' });
  }
};
 
 
 