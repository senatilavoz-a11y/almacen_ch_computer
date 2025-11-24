import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Función para generar código de producto
const generateProductCode = async () => {
  const prefix = 'PROD';
  let code;
  let exists = true;
  let counter = 1;

  while (exists) {
    const number = String(counter).padStart(6, '0');
    code = `${prefix}-${number}`;
    
    const product = await prisma.product.findUnique({
      where: { code }
    });

    if (!product) {
      exists = false;
    } else {
      counter++;
    }
  }

  return code;
};

async function main() {
  console.log('🌱 Iniciando seed de base de datos...');

  // Crear usuario administrador por defecto
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@chcomputer.com' },
    update: {},
    create: {
      email: 'admin@chcomputer.com',
      password: adminPassword,
      name: 'Administrador',
      role: 'ADMIN',
    },
  });

  console.log('✅ Usuario administrador creado:', admin.email);

  // Crear usuario empleado de ejemplo
  const employeePassword = await bcrypt.hash('empleado123', 10);
  const employee = await prisma.user.upsert({
    where: { email: 'empleado@chcomputer.com' },
    update: {},
    create: {
      email: 'empleado@chcomputer.com',
      password: employeePassword,
      name: 'Empleado Ejemplo',
      role: 'EMPLOYEE',
    },
  });

  console.log('✅ Usuario empleado creado:', employee.email);

  // Crear proveedores de ejemplo
  const supplier1 = await prisma.supplier.upsert({
    where: { id: 'supplier-1' },
    update: {},
    create: {
      id: 'supplier-1',
      name: 'Proveedor Principal',
      contact: 'Juan Pérez',
      email: 'contacto@proveedor.com',
      phone: '+1234567890',
      address: 'Calle Principal 123',
    },
  });

  const supplier2 = await prisma.supplier.upsert({
    where: { id: 'supplier-2' },
    update: {},
    create: {
      id: 'supplier-2',
      name: 'Distribuidora Tech',
      contact: 'María González',
      email: 'ventas@tech.com',
      phone: '+0987654321',
    },
  });

  console.log('✅ Proveedores creados');

  // Crear marcas de ejemplo
  const brands = [
    { name: 'HP' },
    { name: 'Dell' },
    { name: 'Lenovo' },
    { name: 'ASUS' },
    { name: 'Acer' },
    { name: 'Logitech' },
    { name: 'Razer' },
    { name: 'Samsung' },
    { name: 'LG' },
    { name: 'Canon' },
    { name: 'Epson' },
    { name: 'Xerox' },
    { name: 'Genérico' },
  ];

  const createdBrands = {};
  for (const brandData of brands) {
    const brand = await prisma.brand.upsert({
      where: { name: brandData.name },
      update: {},
      create: brandData,
    });
    createdBrands[brandData.name] = brand;
  }

  console.log('✅ Marcas creadas');

  // Crear modelos de ejemplo
  const modelsData = [
    // Modelos HP
    { name: '15-dw2000la', brandId: createdBrands['HP'].id },
    { name: 'HP 85A', brandId: createdBrands['HP'].id },
    { name: 'HP 85X', brandId: createdBrands['HP'].id },
    // Modelos Dell
    { name: 'Inspiron 15 3000', brandId: createdBrands['Dell'].id },
    { name: 'P2422H', brandId: createdBrands['Dell'].id },
    // Modelos Lenovo
    { name: 'ThinkPad E14', brandId: createdBrands['Lenovo'].id },
    // Modelos ASUS
    { name: 'VivoBook 15', brandId: createdBrands['ASUS'].id },
    // Modelos Samsung
    { name: 'F24T450FQL', brandId: createdBrands['Samsung'].id },
    // Modelos LG
    { name: '24MK430H-B', brandId: createdBrands['LG'].id },
    // Modelos Logitech
    { name: 'M100', brandId: createdBrands['Logitech'].id },
    { name: 'G203 Lightsync', brandId: createdBrands['Logitech'].id },
    { name: 'G240', brandId: createdBrands['Logitech'].id },
    // Modelos Razer
    { name: 'DeathAdder Essential', brandId: createdBrands['Razer'].id },
    // Modelos Canon
    { name: 'PG-245', brandId: createdBrands['Canon'].id },
    { name: 'CL-246', brandId: createdBrands['Canon'].id },
    { name: 'Canon 728', brandId: createdBrands['Canon'].id },
    // Modelos Epson
    { name: 'T6641', brandId: createdBrands['Epson'].id },
    { name: 'T6642', brandId: createdBrands['Epson'].id },
    // Modelos Xerox
    { name: 'Xerox 106R01359', brandId: createdBrands['Xerox'].id },
    // Modelos Genéricos
    { name: 'Genérico', brandId: createdBrands['Genérico'].id },
  ];

  const createdModels = {};
  for (const modelData of modelsData) {
    // Buscar si ya existe un modelo con el mismo nombre y marca
    const existing = await prisma.model.findFirst({
      where: {
        name: modelData.name,
        brandId: modelData.brandId,
      }
    });

    let model;
    if (existing) {
      model = existing;
    } else {
      model = await prisma.model.create({
        data: modelData,
      });
    }
    
    const key = `${modelData.name}_${modelData.brandId}`;
    createdModels[key] = model;
  }

  console.log('✅ Modelos creados');

  // Crear ubicaciones de ejemplo
  const storageLocations = [
    'Estante A1',
    'Estante A2',
    'Estante A3',
    'Estante A4',
    'Estante B1',
    'Estante B2',
    'Estante B3',
    'Estante C1',
    'Estante C2',
    'Estante C3',
    'Estante C4',
    'Estante D1',
    'Estante D2',
    'Estante E1',
    'Estante E2',
    'Estante E3',
    'Estante E4',
    'Estante F1',
    'Estante F2',
    'Estante F3',
    'Estante F4'
  ];

  for (const locationName of storageLocations) {
    await prisma.storageLocation.upsert({
      where: { name: locationName },
      update: {},
      create: { name: locationName }
    });
  }

  console.log('✅ Ubicaciones creadas');

  // Crear productos de ejemplo
  const products = [
    // Laptops
    {
      name: 'Laptop HP Pavilion',
      modelId: createdModels['15-dw2000la_' + createdBrands['HP'].id].id,
      brandId: createdBrands['HP'].id,
      serialNumber: 'HP-LAP-001',
      quantity: 5,
      minStock: 2,
      supplierId: supplier1.id,
      location: 'Estante A1',
      description: 'Laptop HP Pavilion 15 pulgadas, Intel Core i5, 8GB RAM, 256GB SSD',
    },
    {
      name: 'Laptop Dell Inspiron',
      modelId: createdModels['Inspiron 15 3000_' + createdBrands['Dell'].id].id,
      brandId: createdBrands['Dell'].id,
      serialNumber: 'DELL-LAP-001',
      quantity: 3,
      minStock: 2,
      supplierId: supplier1.id,
      location: 'Estante A2',
      description: 'Laptop Dell Inspiron 15 pulgadas, Intel Core i3, 4GB RAM, 128GB SSD',
    },
    {
      name: 'Laptop Lenovo ThinkPad',
      modelId: createdModels['ThinkPad E14_' + createdBrands['Lenovo'].id].id,
      brandId: createdBrands['Lenovo'].id,
      serialNumber: 'LEN-LAP-001',
      quantity: 4,
      minStock: 2,
      supplierId: supplier2.id,
      location: 'Estante A3',
      description: 'Laptop Lenovo ThinkPad E14, AMD Ryzen 5, 8GB RAM, 256GB SSD',
    },
    {
      name: 'Laptop ASUS VivoBook',
      modelId: createdModels['VivoBook 15_' + createdBrands['ASUS'].id].id,
      brandId: createdBrands['ASUS'].id,
      serialNumber: 'ASUS-LAP-001',
      quantity: 2,
      minStock: 1,
      supplierId: supplier2.id,
      location: 'Estante A4',
      description: 'Laptop ASUS VivoBook 15, Intel Core i5, 8GB RAM, 512GB SSD',
    },
    // Monitores
    {
      name: 'Monitor Samsung',
      modelId: createdModels['F24T450FQL_' + createdBrands['Samsung'].id].id,
      brandId: createdBrands['Samsung'].id,
      serialNumber: 'SAM-MON-001',
      quantity: 8,
      minStock: 3,
      supplierId: supplier1.id,
      location: 'Estante B1',
      description: 'Monitor Samsung 24 pulgadas Full HD, LED, HDMI, VGA',
    },
    {
      name: 'Monitor LG',
      modelId: createdModels['24MK430H-B_' + createdBrands['LG'].id].id,
      brandId: createdBrands['LG'].id,
      serialNumber: 'LG-MON-001',
      quantity: 6,
      minStock: 2,
      supplierId: supplier1.id,
      location: 'Estante B2',
      description: 'Monitor LG 24 pulgadas Full HD, IPS, HDMI, VGA',
    },
    {
      name: 'Monitor Dell',
      modelId: createdModels['P2422H_' + createdBrands['Dell'].id].id,
      brandId: createdBrands['Dell'].id,
      serialNumber: 'DELL-MON-001',
      quantity: 4,
      minStock: 2,
      supplierId: supplier2.id,
      location: 'Estante B3',
      description: 'Monitor Dell 24 pulgadas Full HD, IPS, USB-C, HDMI',
    },
    // Mouse
    {
      name: 'Mouse Logitech',
      modelId: createdModels['M100_' + createdBrands['Logitech'].id].id,
      brandId: createdBrands['Logitech'].id,
      serialNumber: 'LOG-MOU-001',
      quantity: 15,
      minStock: 5,
      supplierId: supplier1.id,
      location: 'Estante C1',
      description: 'Mouse Logitech óptico USB, 3 botones, cable',
    },
    {
      name: 'Mouse Genérico',
      modelId: createdModels['Genérico_' + createdBrands['Genérico'].id].id,
      brandId: createdBrands['Genérico'].id,
      serialNumber: 'Genérico',
      quantity: 20,
      minStock: 10,
      supplierId: supplier1.id,
      location: 'Estante C2',
      description: 'Mouse genérico óptico USB',
    },
    // Mouse Gamer
    {
      name: 'Mouse Gamer Razer',
      modelId: createdModels['DeathAdder Essential_' + createdBrands['Razer'].id].id,
      brandId: createdBrands['Razer'].id,
      serialNumber: 'RAZ-MOU-001',
      quantity: 6,
      minStock: 2,
      supplierId: supplier2.id,
      location: 'Estante C3',
      description: 'Mouse gamer Razer DeathAdder Essential, 6400 DPI, RGB',
    },
    {
      name: 'Mouse Gamer Logitech',
      modelId: createdModels['G203 Lightsync_' + createdBrands['Logitech'].id].id,
      brandId: createdBrands['Logitech'].id,
      serialNumber: 'LOG-GAM-001',
      quantity: 8,
      minStock: 3,
      supplierId: supplier2.id,
      location: 'Estante C4',
      description: 'Mouse gamer Logitech G203 Lightsync, 8000 DPI, RGB',
    },
    // Pad Mouse
    {
      name: 'Pad Mouse Logitech',
      modelId: createdModels['G240_' + createdBrands['Logitech'].id].id,
      brandId: createdBrands['Logitech'].id,
      serialNumber: 'Genérico',
      quantity: 12,
      minStock: 5,
      supplierId: supplier1.id,
      location: 'Estante D1',
      description: 'Pad mouse Logitech G240, tela, 340x280mm',
    },
    {
      name: 'Pad Mouse Genérico',
      modelId: createdModels['Genérico_' + createdBrands['Genérico'].id].id,
      brandId: createdBrands['Genérico'].id,
      serialNumber: 'Genérico',
      quantity: 25,
      minStock: 10,
      supplierId: supplier1.id,
      location: 'Estante D2',
      description: 'Pad mouse genérico, tela, tamaño estándar',
    },
    // Tinta de Impresora
    {
      name: 'Tinta Canon',
      modelId: createdModels['PG-245_' + createdBrands['Canon'].id].id,
      brandId: createdBrands['Canon'].id,
      serialNumber: 'CAN-TIN-001',
      quantity: 30,
      minStock: 15,
      supplierId: supplier1.id,
      location: 'Estante E1',
      description: 'Cartucho de tinta Canon PG-245 negro, compatible PIXMA',
    },
    {
      name: 'Tinta Canon Color',
      modelId: createdModels['CL-246_' + createdBrands['Canon'].id].id,
      brandId: createdBrands['Canon'].id,
      serialNumber: 'CAN-TIN-002',
      quantity: 25,
      minStock: 12,
      supplierId: supplier1.id,
      location: 'Estante E2',
      description: 'Cartucho de tinta Canon CL-246 tricolor, compatible PIXMA',
    },
    {
      name: 'Tinta Epson',
      modelId: createdModels['T6641_' + createdBrands['Epson'].id].id,
      brandId: createdBrands['Epson'].id,
      serialNumber: 'EPS-TIN-001',
      quantity: 20,
      minStock: 10,
      supplierId: supplier2.id,
      location: 'Estante E3',
      description: 'Cartucho de tinta Epson T6641 negro, compatible EcoTank',
    },
    {
      name: 'Tinta Epson Color',
      modelId: createdModels['T6642_' + createdBrands['Epson'].id].id,
      brandId: createdBrands['Epson'].id,
      serialNumber: 'EPS-TIN-002',
      quantity: 18,
      minStock: 10,
      supplierId: supplier2.id,
      location: 'Estante E4',
      description: 'Cartucho de tinta Epson T6642 color, compatible EcoTank',
    },
    // Toner
    {
      name: 'Toner HP',
      modelId: createdModels['HP 85A_' + createdBrands['HP'].id].id,
      brandId: createdBrands['HP'].id,
      serialNumber: 'HP-TON-001',
      quantity: 12,
      minStock: 5,
      supplierId: supplier1.id,
      location: 'Estante F1',
      description: 'Toner HP 85A negro, compatible LaserJet Pro',
    },
    {
      name: 'Toner HP Color',
      modelId: createdModels['HP 85X_' + createdBrands['HP'].id].id,
      brandId: createdBrands['HP'].id,
      serialNumber: 'HP-TON-002',
      quantity: 10,
      minStock: 5,
      supplierId: supplier1.id,
      location: 'Estante F2',
      description: 'Toner HP 85X tricolor, compatible LaserJet Pro',
    },
    {
      name: 'Toner Canon',
      modelId: createdModels['Canon 728_' + createdBrands['Canon'].id].id,
      brandId: createdBrands['Canon'].id,
      serialNumber: 'CAN-TON-001',
      quantity: 8,
      minStock: 4,
      supplierId: supplier2.id,
      location: 'Estante F3',
      description: 'Toner Canon 728 negro, compatible imageCLASS',
    },
    {
      name: 'Toner Xerox',
      modelId: createdModels['Xerox 106R01359_' + createdBrands['Xerox'].id].id,
      brandId: createdBrands['Xerox'].id,
      serialNumber: 'XER-TON-001',
      quantity: 6,
      minStock: 3,
      supplierId: supplier2.id,
      location: 'Estante F4',
      description: 'Toner Xerox 106R01359 negro, compatible VersaLink',
    },
  ];

  // Generar códigos para los productos
  for (const productData of products) {
    const code = await generateProductCode();
    await prisma.product.create({
      data: {
        ...productData,
        code,
      },
    });
  }

  console.log('✅ Productos de ejemplo creados');

  console.log('🎉 Seed completado exitosamente!');
  console.log('\n📝 Credenciales de acceso:');
  console.log('   Admin: admin@chcomputer.com / admin123');
  console.log('   Empleado: empleado@chcomputer.com / empleado123');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

