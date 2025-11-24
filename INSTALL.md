# Guía de Instalación Detallada

## Paso a Paso Completo

### 1. Preparar el Entorno

Asegúrate de tener instalado:
- **Node.js** (versión 18 o superior)
- **PostgreSQL** (versión 12 o superior)
- **npm** o **yarn**

### 2. Instalar Dependencias

Desde la raíz del proyecto:
```bash
npm install
cd backend && npm install
cd ../frontend && npm install
```

O usar el script:
```bash
npm run install:all
```

### 3. Configurar PostgreSQL

1. Abre PostgreSQL y crea una nueva base de datos:
```sql
CREATE DATABASE almacen_ch_computer;
```

2. O usa el nombre que prefieras y actualízalo en el `.env`

### 4. Configurar Variables de Entorno

#### Backend (`backend/.env`)

Copia el archivo de ejemplo y edita:
```bash
cd backend
cp .env.example .env
```

Edita `backend/.env` con tus valores:
```env
# Base de datos
DATABASE_URL="postgresql://usuario:password@localhost:5432/almacen_ch_computer?schema=public"

# JWT (genera un string aleatorio seguro)
JWT_SECRET="tu_secret_jwt_super_seguro_aqui_cambiar"
JWT_EXPIRE=7d

# Frontend URL
FRONTEND_URL=http://localhost:5173

# SMTP (opcional, para alertas por email)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_email@gmail.com
SMTP_PASS=tu_password_aplicacion
SMTP_FROM=noreply@chcomputer.com
```

#### Frontend (`frontend/.env`)

Crea `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

### 5. Configurar Base de Datos

```bash
cd backend

# Generar cliente Prisma
npx prisma generate

# Ejecutar migraciones
npx prisma migrate dev --name init

# Poblar con datos iniciales (usuarios y proveedores de ejemplo)
npm run seed
```

### 6. Ejecutar la Aplicación

#### Opción A: Terminales Separadas

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

#### Opción B: Desde la Raíz

```bash
# Terminal 1
npm run dev:backend

# Terminal 2
npm run dev:frontend
```

### 7. Acceder a la Aplicación

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000/api
- **Prisma Studio** (opcional): `cd backend && npm run studio`

### 8. Primer Inicio de Sesión

Usa las credenciales del seed:
- **Admin:** admin@chcomputer.com / admin123
- **Empleado:** empleado@chcomputer.com / empleado123

## Solución de Problemas

### Error de conexión a la base de datos
- Verifica que PostgreSQL esté corriendo
- Revisa la URL en `DATABASE_URL`
- Asegúrate de que la base de datos existe

### Error de migración
```bash
cd backend
npx prisma migrate reset  # ⚠️ Esto borra todos los datos
npx prisma migrate dev
npm run seed
```

### Error de CORS
- Verifica que `FRONTEND_URL` en `backend/.env` coincida con la URL del frontend

### Puerto ya en uso
- Cambia el puerto en `backend/.env` (PORT) o `frontend/vite.config.js` (server.port)

## Producción

Para producción, asegúrate de:
1. Cambiar `NODE_ENV=production`
2. Usar contraseñas seguras y JWT_SECRET fuerte
3. Configurar HTTPS
4. Configurar variables de entorno en el servidor
5. Usar un servidor de producción (PM2, Docker, etc.)

