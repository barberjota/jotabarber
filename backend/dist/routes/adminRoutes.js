"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authGuard_1 = require("../middlewares/authGuard");
const roleGuard_1 = require("../middlewares/roleGuard");
const servicesController_1 = require("../controllers/servicesController");
const stylistsController_1 = require("../controllers/stylistsController");
const productsController_1 = require("../controllers/productsController");
const appointmentsController_1 = require("../controllers/appointmentsController");
const salesController_1 = require("../controllers/salesController");
const loyaltyController_1 = require("../controllers/loyaltyController");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
// Todas las rutas administrativas requieren autenticación y rol STAFF o ADMIN
router.use(authGuard_1.authGuard);
router.use((0, roleGuard_1.roleGuard)([client_1.Rol.STAFF, client_1.Rol.ADMIN]));
// Citas y Agenda (STAFF/ADMIN)
router.get('/appointments', appointmentsController_1.getBookings);
router.post('/appointments', appointmentsController_1.createBooking);
router.patch('/appointments/:id/status', appointmentsController_1.updateBookingStatus);
router.post('/appointments/:id/cancel', appointmentsController_1.cancelBooking);
router.put('/appointments/:id', appointmentsController_1.updateBooking);
router.delete('/appointments/:id', appointmentsController_1.deleteBooking);
// Clientes y Fidelización (STAFF/ADMIN)
router.get('/customers', loyaltyController_1.getCustomersList);
// Ventas y POS (STAFF/ADMIN)
router.get('/sales', salesController_1.getSales);
router.post('/sales', salesController_1.createSale);
// Métricas de Dashboard (STAFF/ADMIN)
router.get('/metrics', salesController_1.getDashboardMetrics);
// Rutas exclusivas para ADMIN (CRUD y Ajustes Manuales)
const adminOnly = (0, roleGuard_1.roleGuard)([client_1.Rol.ADMIN]);
// Gestión de Servicios
router.post('/services', adminOnly, servicesController_1.createService);
router.put('/services/:id', adminOnly, servicesController_1.updateService);
router.delete('/services/:id', adminOnly, servicesController_1.deleteService);
// Gestión de Estilistas
router.post('/stylists', adminOnly, stylistsController_1.createStylist);
router.put('/stylists/:id', adminOnly, stylistsController_1.updateStylist);
router.delete('/stylists/:id', adminOnly, stylistsController_1.deleteStylist);
// Gestión de Productos
router.post('/products', adminOnly, productsController_1.createProduct);
router.put('/products/:id', adminOnly, productsController_1.updateProduct);
router.delete('/products/:id', adminOnly, productsController_1.deleteProduct);
// Ajuste manual de puntos y cortes
router.post('/loyalty/adjust', adminOnly, loyaltyController_1.adjustLoyaltyManual);
exports.default = router;
