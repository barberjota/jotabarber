# JotaBarber - Sistema de Gestión y Fidelización Monocromático

Este proyecto es un sistema web integral para una peluquería/barbería con un diseño minimalista monocromático ("Black & White / Dark Luxe"). Incluye un portal para clientes con tarjeta de fidelidad digital (5to corte gratis y puntos acumulables) y un panel administrativo completo con agenda diaria, control de personal, inventario y facturación rápida (POS).

## Estructura del Proyecto

El repositorio está dividido en:
* `/backend`: API REST construida con Node.js + Express + TypeScript + Prisma ORM + PostgreSQL/Supabase.
* `/frontend`: Aplicación cliente construida con React + Vite + TypeScript + Tailwind CSS.

---

## Requisitos Previos

Asegúrate de tener instalado:
- **Node.js** (Versión 18 o superior)
- **NPM** (o Yarn)
- Acceso a una base de datos **PostgreSQL** (local o en la nube como Supabase)

---

## Instrucciones de Lanzamiento

### 1. Configuración del Backend

1. Entra a la carpeta de backend:
   ```bash
   cd backend
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Configura las variables de entorno:
   Edita el archivo `backend/.env` y reemplaza la variable `DATABASE_URL` y `DIRECT_URL` con los datos de conexión de tu base de datos de PostgreSQL (por ejemplo, Supabase).
   ```env
   PORT=5000
   JWT_SECRET=super-secret-key-jotabarber-2026
   CORS_ORIGIN=http://localhost:5173
   DATABASE_URL="tu_url_de_supabase_pooler"
   DIRECT_URL="tu_url_de_supabase_directa"
   ```

4. Genera el cliente Prisma y ejecuta las migraciones para crear la base de datos:
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```

5. Inicializa los datos de la base de datos (Seeding):
   ```bash
   npm run prisma:seed
   ```
   *Esto creará los estilistas, servicios, productos iniciales y la cuenta de administrador: `admin@jotabarber.com` con contraseña `admin123`.*

6. Inicia el servidor de desarrollo del backend:
   ```bash
   npm run dev
   ```
   *La API estará escuchando en `http://localhost:5000`.*

---

### 2. Configuración del Frontend

1. Abre una nueva terminal y entra a la carpeta de frontend:
   ```bash
   cd frontend
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Inicia el servidor de desarrollo de Vite:
   ```bash
   npm run dev
   ```
   *La aplicación web estará disponible en `http://localhost:5173`.*

---

## Características de la Plataforma

### Portal de Clientes:
- **Tarjeta de Fidelidad Animada:** Progreso visible "X de 4 cortes". El 5to corte se aplica con un descuento del 100% (Gratis) de manera automática al agendar.
- **Wizard de Reserva por Pasos:** Selección inteligente de Servicio $\rightarrow$ Selección de Barbero $\rightarrow$ Selección de Fecha y Hora en base a disponibilidad real $\rightarrow$ Resumen y aplicación automática de beneficios.
- **Canje de Puntos:** Los puntos acumulados ($1 gastado = 1 punto) se pueden visualizar y usar para canjear productos para barba o cabello.

### Portal Administrativo (`admin@jotabarber.com` / `admin123`):
- **Dashboard Principal:** Visualización de ingresos totales, cantidad de cortes, balance de puntos de clientes, y gráficos de rendimiento de barberos.
- **Agenda diaria:** Calendario visual para que el personal confirme citas (marcando a `COMPLETED` se acumulan los puntos y cortes al cliente) o cancele turnos.
- **POS / Caja Rápida:** Facturación rápida de productos directamente en la sucursal, sumando puntos o permitiendo canje por puntos en vivo para clientes registrados.
- **Gestión CRUD:** Completo creador/editor de servicios, horarios de estilistas y stock de productos en inventario.
