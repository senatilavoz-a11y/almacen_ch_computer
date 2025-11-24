import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendLowStockAlert = async (product) => {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('SMTP no configurado, saltando envío de email');
      return;
    }

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: process.env.SMTP_USER, // En producción, usar lista de administradores
      subject: `⚠️ Alerta: Stock Bajo - ${product.name}`,
      html: `
        <h2>Alerta de Stock Bajo</h2>
        <p>El producto <strong>${product.name}</strong> (${product.code}) tiene stock bajo.</p>
        <ul>
          <li>Stock actual: ${product.quantity}</li>
          <li>Stock mínimo: ${product.minStock}</li>
          <li>Ubicación: ${product.location}</li>
        </ul>
        <p>Por favor, revisa el inventario y realiza las acciones necesarias.</p>
      `,
    });
  } catch (error) {
    console.error('Error al enviar email:', error);
  }
};

