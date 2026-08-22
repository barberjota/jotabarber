"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoyaltyService = void 0;
const db_1 = __importDefault(require("../config/db"));
const client_1 = require("@prisma/client");
class LoyaltyService {
    /**
     * Procesa la finalización de una cita para otorgar puntos y actualizar el contador de cortes.
     */
    static async processCompletedAppointment(citaId) {
        const appointment = await db_1.default.cita.findUnique({
            where: { id: citaId },
            include: { servicio: true, usuario: true },
        });
        if (!appointment) {
            throw new Error('Cita no encontrada');
        }
        if (appointment.estado !== 'COMPLETADO') {
            throw new Error('La cita debe estar en estado COMPLETADO para procesar la fidelización');
        }
        const { usuarioId, servicio, esPromoQuintoCorte, descuentoAplicado } = appointment;
        const finalAmount = Number(appointment.servicio.precio) - Number(descuentoAplicado);
        const amountToCharge = Math.max(0, finalAmount);
        // 1. Calcular puntos a otorgar (1 punto por cada $1 gastado)
        const pointsAwarded = Math.floor(amountToCharge);
        await db_1.default.$transaction(async (tx) => {
            let newCompletedCuts = appointment.usuario.cortesCompletados;
            // 2. Manejo del ciclo de 5 cortes
            if (servicio.aplicaFidelidad) {
                if (esPromoQuintoCorte) {
                    // Si se le aplicó la promo del 5to corte, reiniciamos el contador a 0
                    newCompletedCuts = 0;
                    // Registrar en el historial de lealtad
                    await tx.historialFidelidad.create({
                        data: {
                            usuarioId,
                            puntos: 0,
                            motivo: `Descuento de 5to corte aplicado en cita de ${servicio.nombre}`,
                            tipoRecompensa: client_1.TipoRecompensa.DESCUENTO_QUINTO_CORTE,
                        },
                    });
                }
                else {
                    // Si no fue promo, sumamos 1 corte
                    newCompletedCuts += 1;
                }
            }
            // 3. Otorgar puntos si corresponde
            let newPointsBalance = appointment.usuario.saldoPuntos;
            if (pointsAwarded > 0) {
                newPointsBalance += pointsAwarded;
                // Registrar en el historial de lealtad
                await tx.historialFidelidad.create({
                    data: {
                        usuarioId,
                        puntos: pointsAwarded,
                        motivo: `Puntos ganados por cita: ${servicio.nombre}`,
                        tipoRecompensa: null,
                    },
                });
            }
            // 4. Actualizar usuario
            await tx.usuario.update({
                where: { id: usuarioId },
                data: {
                    saldoPuntos: newPointsBalance,
                    cortesCompletados: newCompletedCuts,
                },
            });
            // 5. Crear la venta asociada si no existe
            const existingSale = await tx.venta.findUnique({
                where: { citaId },
            });
            if (!existingSale) {
                await tx.venta.create({
                    data: {
                        usuarioId,
                        citaId,
                        subtotal: servicio.precio,
                        descuento: descuentoAplicado,
                        total: amountToCharge,
                        puntosGanados: pointsAwarded,
                        puntosUsados: esPromoQuintoCorte ? 0 : 0,
                    },
                });
            }
        });
    }
    /**
     * Realiza el canje de puntos por un producto.
     */
    static async redeemProductWithPoints(userId, productId, quantity = 1) {
        const user = await db_1.default.usuario.findUnique({ where: { id: userId } });
        const product = await db_1.default.producto.findUnique({ where: { id: productId } });
        if (!user)
            throw new Error('Usuario no encontrado');
        if (!product)
            throw new Error('Producto no encontrado');
        if (!product.isActive)
            throw new Error('El producto no está activo');
        if (product.stock < quantity)
            throw new Error('Stock insuficiente');
        if (!product.costoPuntos)
            throw new Error('Este producto no se puede canjear con puntos');
        const totalPointsCost = product.costoPuntos * quantity;
        if (user.saldoPuntos < totalPointsCost) {
            throw new Error('Saldo de puntos insuficiente');
        }
        await db_1.default.$transaction(async (tx) => {
            // Descontar puntos
            await tx.usuario.update({
                where: { id: userId },
                data: {
                    saldoPuntos: {
                        decrement: totalPointsCost,
                    },
                },
            });
            // Descontar stock
            await tx.producto.update({
                where: { id: productId },
                data: {
                    stock: {
                        decrement: quantity,
                    },
                },
            });
            // Registrar historial de fidelidad
            await tx.historialFidelidad.create({
                data: {
                    usuarioId: userId,
                    puntos: -totalPointsCost,
                    motivo: `Canje de puntos por ${quantity}x ${product.nombre}`,
                    tipoRecompensa: client_1.TipoRecompensa.CANJE_PUNTOS,
                },
            });
            // Crear registro de venta (con costo total 0 y puntos consumidos)
            const sale = await tx.venta.create({
                data: {
                    usuarioId: userId,
                    subtotal: Number(product.precio) * quantity,
                    descuento: Number(product.precio) * quantity, // 100% de descuento porque es canje
                    total: 0,
                    puntosGanados: 0,
                    puntosUsados: totalPointsCost,
                },
            });
            // Detalle de la venta
            await tx.itemVenta.create({
                data: {
                    ventaId: sale.id,
                    productoId: productId,
                    cantidad: quantity,
                    precioUnit: product.precio,
                },
            });
        });
    }
}
exports.LoyaltyService = LoyaltyService;
