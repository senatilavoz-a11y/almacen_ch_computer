# Sistema de Gestión de Almacén - Inversiones CH Computer

Sistema web completo para la gestión profesional del almacén, incluyendo control de entrada, salida, ubicación y estado de productos.

## 🚀 Características

- ✅ Gestión completa de productos con código automático
- ✅ Control de entradas y salidas del almacén
- ✅ Sistema de usuarios y roles (Administrador/Empleado)
- ✅ Dashboard profesional con gráficos y estadísticas
- ✅ Alertas de stock bajo
- ✅ Búsquedas y filtros avanzados
- ✅ Exportación a PDF, Excel y CSV
- ✅ Diseño moderno y responsive

## 📁 Estructura del Proyecto

```
/
├── backend/          # API REST con Node.js + Express
├── frontend/         # Aplicación React + Vite
├── database/         # Esquema de base de datos Prisma
└── .env.example      # Variables de entorno de ejemplo
```

## 🛠️ Instalación

### Requisitos previos
- Node.js 18+ y npm
- PostgreSQL 12+
- Git

### Pasos de instalación

1. **Clonar e instalar dependencias:**
```bash
npm run install:all
```

2. **Configurar base de datos PostgreSQL:**
   - Crear una base de datos llamada `almacen_ch_computer`
   - O modificar el nombre en la URL de conexión

3. **Configurar variables de entorno:**
   - Copiar `backend/.env.example` a `backend/.env`
   - Editar `backend/.env` y configurar:
     - `DATABASE_URL`: URL de conexión a PostgreSQL
     - `JWT_SECRET`: Una cadena secreta aleatoria para JWT
     - `SMTP_*`: Configuración de email (opcional, para alertas)

4. **Configurar base de datos:**
```bash
cd backend
npx prisma generate
npx prisma migrate dev --name init
npm run seed
```

5. **Ejecutar el proyecto:**
```bash
# Terminal 1 - Backend (puerto 5000)
npm run dev:backend

# Terminal 2 - Frontend (puerto 5173)
npm run dev:frontend
```

6. **Acceder a la aplicación:**
   - Abrir navegador en `http://localhost:5173`
   - Iniciar sesión con las credenciales del seed

## 🔐 Usuarios por defecto (después del seed)

- **Administrador:**
  - Email: `admin@chcomputer.com`
  - Contraseña: `admin123`

- **Empleado:**
  - Email: `empleado@chcomputer.com`
  - Contraseña: `empleado123`

⚠️ **Importante:** Cambiar estas contraseñas después del primer inicio de sesión en producción.

## 📝 Tecnologías

- **Backend**: Node.js, Express, Prisma, PostgreSQL, JWT
- **Frontend**: React, Vite, TailwindCSS, React Router, React Query
- **Gráficos**: Recharts
- **Exportación**: jsPDF, xlsx

