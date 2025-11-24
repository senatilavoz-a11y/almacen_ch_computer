import prisma from '../config/database.js';

export const getLocations = async (req, res) => {
  try {
    const [savedLocations, productLocations] = await Promise.all([
      prisma.storageLocation.findMany({
        orderBy: { name: 'asc' },
        select: { name: true }
      }),
      prisma.product.findMany({
        distinct: ['location'],
        select: { location: true }
      })
    ]);

    const locationSet = new Set();

    savedLocations.forEach((loc) => {
      if (loc.name) {
        locationSet.add(loc.name);
      }
    });

    productLocations.forEach((loc) => {
      if (loc.location) {
        locationSet.add(loc.location);
      }
    });

    const locations = Array.from(locationSet).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: 'base' })
    );

    res.json({ locations });
  } catch (error) {
    console.error('Error al obtener ubicaciones:', error);
    res.status(500).json({ message: 'Error al obtener ubicaciones' });
  }
};

export const createLocation = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'El nombre de la ubicación es obligatorio' });
    }

    const normalizedName = name.trim();

    const existingLocation = await prisma.storageLocation.findUnique({
      where: { name: normalizedName }
    });

    if (existingLocation) {
      return res.status(400).json({ message: 'La ubicación ya existe' });
    }

    const location = await prisma.storageLocation.create({
      data: { name: normalizedName }
    });

    res.status(201).json({
      message: 'Ubicación creada exitosamente',
      location
    });
  } catch (error) {
    console.error('Error al crear ubicación:', error);
    res.status(500).json({ message: 'Error al crear ubicación', error: error.message });
  }
};

