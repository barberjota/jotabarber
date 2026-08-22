"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteService = exports.updateService = exports.createService = exports.getServiceById = exports.getServices = void 0;
const db_1 = __importDefault(require("../config/db"));
const mapServicio = (s) => ({
    id: s.id,
    name: s.nombre,
    description: s.descripcion,
    durationMin: s.duracionMin,
    price: s.precio,
    countsForFidelity: s.aplicaFidelidad,
    isActive: s.isActive,
});
const getServices = async (req, res) => {
    const showInactive = req.query.all === 'true';
    try {
        const services = await db_1.default.servicio.findMany({
            where: showInactive ? {} : { isActive: true },
            orderBy: { nombre: 'asc' },
        });
        return res.json(services.map(mapServicio));
    }
    catch (error) {
        return res.status(500).json({ message: 'Error al obtener los servicios', error: error.message });
    }
};
exports.getServices = getServices;
const getServiceById = async (req, res) => {
    const { id } = req.params;
    try {
        const service = await db_1.default.servicio.findUnique({
            where: { id },
        });
        if (!service) {
            return res.status(404).json({ message: 'Servicio no encontrado' });
        }
        return res.json(mapServicio(service));
    }
    catch (error) {
        return res.status(500).json({ message: 'Error al obtener el servicio', error: error.message });
    }
};
exports.getServiceById = getServiceById;
const createService = async (req, res) => {
    const { name, description, durationMin, price, countsForFidelity } = req.body;
    if (!name || durationMin === undefined || price === undefined) {
        return res.status(400).json({ message: 'Nombre, duración y precio son campos requeridos' });
    }
    try {
        const service = await db_1.default.servicio.create({
            data: {
                nombre: name,
                descripcion: description,
                duracionMin: Number(durationMin),
                precio: Number(price),
                aplicaFidelidad: countsForFidelity === undefined ? true : Boolean(countsForFidelity),
            },
        });
        return res.status(201).json(mapServicio(service));
    }
    catch (error) {
        return res.status(500).json({ message: 'Error al crear el servicio', error: error.message });
    }
};
exports.createService = createService;
const updateService = async (req, res) => {
    const { id } = req.params;
    const { name, description, durationMin, price, countsForFidelity, isActive } = req.body;
    try {
        const service = await db_1.default.servicio.findUnique({ where: { id } });
        if (!service) {
            return res.status(404).json({ message: 'Servicio no encontrado' });
        }
        const updated = await db_1.default.servicio.update({
            where: { id },
            data: {
                nombre: name !== undefined ? name : service.nombre,
                descripcion: description !== undefined ? description : service.descripcion,
                duracionMin: durationMin !== undefined ? Number(durationMin) : service.duracionMin,
                precio: price !== undefined ? Number(price) : service.precio,
                aplicaFidelidad: countsForFidelity !== undefined ? Boolean(countsForFidelity) : service.aplicaFidelidad,
                isActive: isActive !== undefined ? Boolean(isActive) : service.isActive,
            },
        });
        return res.json(mapServicio(updated));
    }
    catch (error) {
        return res.status(500).json({ message: 'Error al actualizar el servicio', error: error.message });
    }
};
exports.updateService = updateService;
const deleteService = async (req, res) => {
    const { id } = req.params;
    try {
        const appointmentsCount = await db_1.default.cita.count({
            where: { servicioId: id },
        });
        if (appointmentsCount > 0) {
            await db_1.default.servicio.update({
                where: { id },
                data: { isActive: false },
            });
            return res.json({ message: 'El servicio tiene citas registradas. Se ha desactivado en su lugar.' });
        }
        await db_1.default.servicio.delete({
            where: { id },
        });
        return res.json({ message: 'Servicio eliminado con éxito' });
    }
    catch (error) {
        return res.status(500).json({ message: 'Error al eliminar el servicio', error: error.message });
    }
};
exports.deleteService = deleteService;
