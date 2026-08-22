import { Request, Response } from 'express';
import prisma from '../config/db';

const mapServicio = (s: any) => ({
  id: s.id,
  name: s.nombre,
  description: s.descripcion,
  durationMin: s.duracionMin,
  price: s.precio,
  countsForFidelity: s.aplicaFidelidad,
  isActive: s.isActive,
});

export const getServices = async (req: Request, res: Response) => {
  const showInactive = req.query.all === 'true';

  try {
    const services = await prisma.servicio.findMany({
      where: showInactive ? {} : { isActive: true },
      orderBy: { nombre: 'asc' },
    });
    return res.json(services.map(mapServicio));
  } catch (error: any) {
    return res.status(500).json({ message: 'Error al obtener los servicios', error: error.message });
  }
};

export const getServiceById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const service = await prisma.servicio.findUnique({
      where: { id },
    });
    if (!service) {
      return res.status(404).json({ message: 'Servicio no encontrado' });
    }
    return res.json(mapServicio(service));
  } catch (error: any) {
    return res.status(500).json({ message: 'Error al obtener el servicio', error: error.message });
  }
};

export const createService = async (req: Request, res: Response) => {
  const { name, description, durationMin, price, countsForFidelity } = req.body;

  if (!name || durationMin === undefined || price === undefined) {
    return res.status(400).json({ message: 'Nombre, duración y precio son campos requeridos' });
  }

  try {
    const service = await prisma.servicio.create({
      data: {
        nombre: name,
        descripcion: description,
        duracionMin: Number(durationMin),
        precio: Number(price),
        aplicaFidelidad: countsForFidelity === undefined ? true : Boolean(countsForFidelity),
      },
    });
    return res.status(201).json(mapServicio(service));
  } catch (error: any) {
    return res.status(500).json({ message: 'Error al crear el servicio', error: error.message });
  }
};

export const updateService = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, description, durationMin, price, countsForFidelity, isActive } = req.body;

  try {
    const service = await prisma.servicio.findUnique({ where: { id } });
    if (!service) {
      return res.status(404).json({ message: 'Servicio no encontrado' });
    }

    const updated = await prisma.servicio.update({
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
  } catch (error: any) {
    return res.status(500).json({ message: 'Error al actualizar el servicio', error: error.message });
  }
};

export const deleteService = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const appointmentsCount = await prisma.cita.count({
      where: { servicioId: id },
    });

    if (appointmentsCount > 0) {
      await prisma.servicio.update({
        where: { id },
        data: { isActive: false },
      });
      return res.json({ message: 'El servicio tiene citas registradas. Se ha desactivado en su lugar.' });
    }

    await prisma.servicio.delete({
      where: { id },
    });
    return res.json({ message: 'Servicio eliminado con éxito' });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error al eliminar el servicio', error: error.message });
  }
};
