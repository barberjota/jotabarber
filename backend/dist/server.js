"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const clientRoutes_1 = __importDefault(require("./routes/clientRoutes"));
const adminRoutes_1 = __importDefault(require("./routes/adminRoutes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Configuración de CORS
const corsOrigin = process.env.CORS_ORIGIN || '*';
app.use((0, cors_1.default)({
    origin: corsOrigin,
    credentials: true,
}));
app.use(express_1.default.json());
// Montar Rutas
app.use('/api/auth', authRoutes_1.default);
app.use('/api/client', clientRoutes_1.default);
app.use('/api/admin', adminRoutes_1.default);
// Ruta de estado de la API
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Servidor de Jotabarber activo' });
});
// Lanzamiento del servidor
app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
