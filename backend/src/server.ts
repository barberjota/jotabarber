import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import clientRoutes from './routes/clientRoutes';
import adminRoutes from './routes/adminRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Configuración de CORS
const corsOrigin = process.env.CORS_ORIGIN || '*';
app.use(cors({
  origin: corsOrigin,
  credentials: true,
}));

app.use(express.json());

// Montar Rutas
app.use('/api/auth', authRoutes);
app.use('/api/client', clientRoutes);
app.use('/api/admin', adminRoutes);

// Ruta de estado de la API
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Servidor de Jotabarber activo' });
});

// Lanzamiento del servidor
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
