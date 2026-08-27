import { Router } from 'express';
import { authGuard } from '../middlewares/authGuard';
import { roleGuard } from '../middlewares/roleGuard';
import { createService, updateService, deleteService } from '../controllers/servicesController';
import { createStylist, updateStylist, deleteStylist } from '../controllers/stylistsController';
import { createProduct, updateProduct, deleteProduct } from '../controllers/productsController';
import { getBookings, createBooking, updateBookingStatus, cancelBooking, updateBooking, deleteBooking, checkoutBooking } from '../controllers/appointmentsController';
import { getSales, createSale, deleteSale, updateSale, checkoutOrder, getDashboardMetrics } from '../controllers/salesController';
import { getCustomersList, adjustLoyaltyManual } from '../controllers/loyaltyController';
import { uploadMiddleware, uploadImage } from '../controllers/uploadController';
import { getActiveCaja, openCaja, closeCaja, getCajasHistory, updateCaja, deleteCaja } from '../controllers/cajaController';
import { Rol } from '@prisma/client';

const router = Router();

// Todas las rutas administrativas requieren autenticación y rol STAFF o ADMIN
router.use(authGuard);
router.use(roleGuard([Rol.STAFF, Rol.ADMIN]));

// Carga de imágenes (Cloudinary)
router.post('/upload', uploadMiddleware.single('image'), uploadImage);

// Citas y Agenda (STAFF/ADMIN)
router.get('/appointments', getBookings);
router.post('/appointments', createBooking);
router.patch('/appointments/:id/status', updateBookingStatus);
router.post('/appointments/:id/cancel', cancelBooking);
router.put('/appointments/:id', updateBooking);
router.delete('/appointments/:id', deleteBooking);
router.post('/appointments/:id/checkout', checkoutBooking);

// Clientes y Fidelización (STAFF/ADMIN)
router.get('/customers', getCustomersList);

// Ventas y POS (STAFF/ADMIN)
router.get('/sales', getSales);
router.post('/sales', createSale);
router.put('/sales/:id', updateSale);
router.delete('/sales/:id', deleteSale);
router.post('/sales/:id/checkout', checkoutOrder);

// Control de Caja (STAFF/ADMIN)
router.get('/caja/active', getActiveCaja);
router.post('/caja/open', openCaja);
router.post('/caja/close', closeCaja);
router.get('/caja/history', getCajasHistory);
router.put('/caja/:id', updateCaja);
router.delete('/caja/:id', deleteCaja);

// Métricas de Dashboard (STAFF/ADMIN)
router.get('/metrics', getDashboardMetrics);

// Rutas exclusivas para ADMIN (CRUD y Ajustes Manuales)
const adminOnly = roleGuard([Rol.ADMIN]);

// Gestión de Servicios
router.post('/services', adminOnly, createService);
router.put('/services/:id', adminOnly, updateService);
router.delete('/services/:id', adminOnly, deleteService);

// Gestión de Estilistas
router.post('/stylists', adminOnly, createStylist);
router.put('/stylists/:id', adminOnly, updateStylist);
router.delete('/stylists/:id', adminOnly, deleteStylist);

// Gestión de Productos
router.post('/products', adminOnly, createProduct);
router.put('/products/:id', adminOnly, updateProduct);
router.delete('/products/:id', adminOnly, deleteProduct);

// Ajuste manual de puntos y cortes
router.post('/loyalty/adjust', adminOnly, adjustLoyaltyManual);

export default router;
