"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authGuard_1 = require("../middlewares/authGuard");
const roleGuard_1 = require("../middlewares/roleGuard");
const servicesController_1 = require("../controllers/servicesController");
const stylistsController_1 = require("../controllers/stylistsController");
const productsController_1 = require("../controllers/productsController");
const appointmentsController_1 = require("../controllers/appointmentsController");
const loyaltyController_1 = require("../controllers/loyaltyController");
const salesController_1 = require("../controllers/salesController");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
// Rutas públicas o de cliente autenticado
router.get('/services', servicesController_1.getServices);
router.get('/stylists', stylistsController_1.getStylists);
router.get('/products', productsController_1.getProducts);
router.get('/availability', appointmentsController_1.getAvailability);
// Rutas protegidas para clientes (y accesibles para personal/admin)
router.use(authGuard_1.authGuard);
router.use((0, roleGuard_1.roleGuard)([client_1.Rol.CLIENTE, client_1.Rol.STAFF, client_1.Rol.ADMIN]));
router.get('/appointments', appointmentsController_1.getBookings);
router.post('/appointments', appointmentsController_1.createBooking);
router.post('/appointments/:id/cancel', appointmentsController_1.cancelBooking);
router.get('/loyalty/dashboard', loyaltyController_1.getLoyaltyDashboard);
router.get('/loyalty/history', loyaltyController_1.getLoyaltyHistory);
router.post('/loyalty/redeem', salesController_1.redeemProduct);
exports.default = router;
