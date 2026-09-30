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
import { getUsers, createUser, updateUser, deleteUser } from '../controllers/usersController';
import { Rol } from '@prisma/client';

const router = Router();

// Todas las rutas administrativas requieren autenticación y rol STAFF o ADMIN
router.use(authGuard);
router.use(roleGuard([Rol.STAFF, Rol.ADMIN]));

// Carga de imágenes (Cloudinary)
router.post('/upload', uploadMiddleware.single('image'), uploadImage);

// Citas y Agenda (Accesible para STAFF y ADMIN)
router.get('/appointments', getBookings);
router.post('/appointments', createBooking);
router.patch('/appointments/:id/status', updateBookingStatus);
router.post('/appointments/:id/cancel', cancelBooking);
router.put('/appointments/:id', updateBooking);
router.delete('/appointments/:id', deleteBooking);
router.post('/appointments/:id/checkout', checkoutBooking);

// Middleware para rutas exclusivas de Administrador
const adminOnly = roleGuard([Rol.ADMIN]);

// Clientes y Fidelización (Exclusivo ADMIN)
router.get('/customers', adminOnly, getCustomersList);

// Ventas y POS (Exclusivo ADMIN)
router.get('/sales', adminOnly, getSales);
router.post('/sales', adminOnly, createSale);
router.put('/sales/:id', adminOnly, updateSale);
router.delete('/sales/:id', adminOnly, deleteSale);
router.post('/sales/:id/checkout', adminOnly, checkoutOrder);

// Control de Caja (Exclusivo ADMIN)
router.get('/caja/active', adminOnly, getActiveCaja);
router.post('/caja/open', adminOnly, openCaja);
router.post('/caja/close', adminOnly, closeCaja);
router.get('/caja/history', adminOnly, getCajasHistory);
router.put('/caja/:id', adminOnly, updateCaja);
router.delete('/caja/:id', adminOnly, deleteCaja);

// Métricas de Dashboard (Exclusivo ADMIN)
router.get('/metrics', adminOnly, getDashboardMetrics);

// Gestión de Servicios (Exclusivo ADMIN)
router.post('/services', adminOnly, createService);
router.put('/services/:id', adminOnly, updateService);
router.delete('/services/:id', adminOnly, deleteService);

// Gestión de Estilistas / Personal (Exclusivo ADMIN)
router.post('/stylists', adminOnly, createStylist);
router.put('/stylists/:id', adminOnly, updateStylist);
router.delete('/stylists/:id', adminOnly, deleteStylist);

// Gestión de Productos (Exclusivo ADMIN)
router.post('/products', adminOnly, createProduct);
router.put('/products/:id', adminOnly, updateProduct);
router.delete('/products/:id', adminOnly, deleteProduct);

// Gestión de Usuarios (Exclusivo ADMIN)
router.get('/users', adminOnly, getUsers);
router.post('/users', adminOnly, createUser);
router.put('/users/:id', adminOnly, updateUser);
router.delete('/users/:id', adminOnly, deleteUser);

// Ajuste manual de puntos y cortes (Exclusivo ADMIN)
router.post('/loyalty/adjust', adminOnly, adjustLoyaltyManual);

export default router;
