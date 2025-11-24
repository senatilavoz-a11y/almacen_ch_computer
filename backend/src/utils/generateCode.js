import prisma from '../config/database.js';

export const generateProductCode = async () => {
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

// Generar código aleatorio para Brand
export const generateBrandCode = async () => {
  const prefix = 'BRD';
  let code;
  let exists = true;
  let attempts = 0;
  const maxAttempts = 100;

  while (exists && attempts < maxAttempts) {
    // Generar código aleatorio: BRD-XXXX donde XXXX son 4 caracteres alfanuméricos
    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    code = `${prefix}-${randomPart}`;
    
    const brand = await prisma.brand.findUnique({
      where: { code }
    });

    if (!brand) {
      exists = false;
    } else {
      attempts++;
    }
  }

  if (attempts >= maxAttempts) {
    // Fallback: usar timestamp
    const timestamp = Date.now().toString(36).toUpperCase();
    code = `${prefix}-${timestamp.substring(timestamp.length - 4)}`;
  }

  return code;
};

// Generar código aleatorio para Model
export const generateModelCode = async () => {
  const prefix = 'MOD';
  let code;
  let exists = true;
  let attempts = 0;
  const maxAttempts = 100;

  while (exists && attempts < maxAttempts) {
    // Generar código aleatorio: MOD-XXXX donde XXXX son 4 caracteres alfanuméricos
    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    code = `${prefix}-${randomPart}`;
    
    const model = await prisma.model.findUnique({
      where: { code }
    });

    if (!model) {
      exists = false;
    } else {
      attempts++;
    }
  }

  if (attempts >= maxAttempts) {
    // Fallback: usar timestamp
    const timestamp = Date.now().toString(36).toUpperCase();
    code = `${prefix}-${timestamp.substring(timestamp.length - 4)}`;
  }

  return code;
};

export const generateMovementCode = async () => {
  const prefix = 'MOV';
  let code;
  let exists = true;
  let counter = 1;

  while (exists) {
    const number = String(counter).padStart(6, '0');
    code = `${prefix}-${number}`;

    const batch = await prisma.movementBatch.findUnique({
      where: { code }
    });

    if (!batch) {
      exists = false;
    } else {
      counter++;
    }
  }

  return code;
};

