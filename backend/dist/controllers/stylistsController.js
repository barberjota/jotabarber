"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteStylist = exports.updateStylist = exports.createStylist = exports.getStylistById = exports.getStylists = void 0;
const db_1 = __importDefault(require("../config/db"));
const mapHorario = (h) => ({
    id: h.id,
    dayOfWeek: h.diaSemana,
    startTime: h.horaInicio,
    endTime: h.horaFin,
});
const mapEstilista = (e) => ({
    id: e.id,
    name: e.nombre,
    photoUrl: e.photoUrl,
    isActive: e.isActive,
    schedules: e.horarios ? e.horarios.map(mapHorario) : [],
});
const getStylists = async (req, res) => {
    const showInactive = req.query.all === 'true';
    try {
        const stylists = await db_1.default.estilista.findMany({
            where: showInactive ? {} : { isActive: true },
            include: {
                horarios: true,
            },
            orderBy: { nombre: 'asc' },
        });
        return res.json(stylists.map(mapEstilista));
    }
    catch (error) {
        return res.status(500).json({ message: 'Error al obtener los estilistas', error: error.message });
    }
};
exports.getStylists = getStylists;
const getStylistById = async (req, res) => {
    const { id } = req.params;
    try {
        const stylist = await db_1.default.estilista.findUnique({
            where: { id },
            include: { horarios: true },
        });
        if (!stylist) {
            return res.status(404).json({ message: 'Estilista no encontrado' });
        }
        return res.json(mapEstilista(stylist));
    }
    catch (error) {
        return res.status(500).json({ message: 'Error al obtener el estilista', error: error.message });
    }
};
exports.getStylistById = getStylistById;
const createStylist = async (req, res) => {
    const { name, photoUrl, schedules } = req.body;
    if (!name) {
        return res.status(400).json({ message: 'El nombre es obligatorio' });
    }
    try {
        const stylist = await db_1.default.$transaction(async (tx) => {
            const created = await tx.estilista.create({
                data: {
                    nombre: name,
                    photoUrl: photoUrl || 'https://images.unsplash.com/photo-1517832606299-7ae9b720a186?w=200&h=200&fit=crop',
                    isActive: true,
                },
            });
            if (schedules && Array.isArray(schedules) && schedules.length > 0) {
                const scheduleData = schedules.map((sch) => ({
                    estilistaId: created.id,
                    diaSemana: Number(sch.dayOfWeek),
                    horaInicio: sch.startTime,
                    horaFin: sch.endTime,
                }));
                await tx.horarioEstilista.createMany({
                    data: scheduleData,
                });
            }
            else {
                // Horario por defecto de Lunes (1) a Sábado (6) de 09:00 a 19:00
                const defaultSchedules = [];
                for (let day = 1; day <= 6; day++) {
                    defaultSchedules.push({
                        estilistaId: created.id,
                        diaSemana: day,
                        horaInicio: '09:00',
                        horaFin: '19:00',
                    });
                }
                await tx.horarioEstilista.createMany({
                    data: defaultSchedules,
                });
            }
            return tx.estilista.findUnique({
                where: { id: created.id },
                include: { horarios: true },
            });
        });
        return res.status(201).json(mapEstilista(stylist));
    }
    catch (error) {
        return res.status(500).json({ message: 'Error al crear el estilista', error: error.message });
    }
};
exports.createStylist = createStylist;
const updateStylist = async (req, res) => {
    const { id } = req.params;
    const { name, photoUrl, isActive, schedules } = req.body;
    try {
        const stylist = await db_1.default.estilista.findUnique({ where: { id } });
        if (!stylist) {
            return res.status(404).json({ message: 'Estilista no encontrado' });
        }
        const updated = await db_1.default.$transaction(async (tx) => {
            // Actualizar datos del estilista
            await tx.estilista.update({
                where: { id },
                data: {
                    nombre: name !== undefined ? name : stylist.nombre,
                    photoUrl: photoUrl !== undefined ? photoUrl : stylist.photoUrl,
                    isActive: isActive !== undefined ? Boolean(isActive) : stylist.isActive,
                },
            });
            // Si vienen horarios, reescribirlos
            if (schedules && Array.isArray(schedules)) {
                await tx.horarioEstilista.deleteMany({
                    where: { estilistaId: id },
                });
                const scheduleData = schedules.map((sch) => ({
                    estilistaId: id,
                    diaSemana: Number(sch.dayOfWeek),
                    horaInicio: sch.startTime,
                    horaFin: sch.endTime,
                }));
                await tx.horarioEstilista.createMany({
                    data: scheduleData,
                });
            }
            return tx.estilista.findUnique({
                where: { id },
                include: { horarios: true },
            });
        });
        return res.json(mapEstilista(updated));
    }
    catch (error) {
        return res.status(500).json({ message: 'Error al actualizar el estilista', error: error.message });
    }
};
exports.updateStylist = updateStylist;
const deleteStylist = async (req, res) => {
    const { id } = req.params;
    try {
        const appointmentsCount = await db_1.default.cita.count({
            where: { estilistaId: id },
        });
        if (appointmentsCount > 0) {
            await db_1.default.estilista.update({
                where: { id },
                data: { isActive: false },
            });
            return res.json({ message: 'El estilista tiene citas registradas. Se ha desactivado en su lugar.' });
        }
        await db_1.default.estilista.delete({
            where: { id },
        });
        return res.json({ message: 'Estilista eliminado con éxito' });
    }
    catch (error) {
        return res.status(500).json({ message: 'Error al eliminar el estilista', error: error.message });
    }
};
exports.deleteStylist = deleteStylist;
