import { Router } from 'express';
import { authGuard } from '../middlewares/authGuard';
import { roleGuard } from '../middlewares/roleGuard';
import { getServices } from '../controllers/servicesController';
import { getStylists } from '../controllers/stylistsController';
import { getProducts } from '../controllers/productsController';
import { getAvailability, getBookings, createBooking, cancelBooking } from '../controllers/appointmentsController';
import { getLoyaltyDashboard, getLoyaltyHistory } from '../controllers/loyaltyController';
import { redeemProduct } from '../controllers/salesController';
import { Rol } from '@prisma/client';

const router = Router();

// Rutas públicas o de cliente autenticado
router.get('/services', getServices);
router.get('/stylists', getStylists);
router.get('/products', getProducts);
router.get('/availability', getAvailability);

// Rutas protegidas para clientes (y accesibles para personal/admin)
router.use(authGuard);
router.use(roleGuard([Rol.CLIENTE, Rol.STAFF, Rol.ADMIN]));

router.get('/appointments', getBookings);
router.post('/appointments', createBooking);
router.post('/appointments/:id/cancel', cancelBooking);

router.get('/loyalty/dashboard', getLoyaltyDashboard);
router.get('/loyalty/history', getLoyaltyHistory);
router.post('/loyalty/redeem', redeemProduct);

export default router;
