import { Request, Response } from 'express';
import prisma from '../config/db';

const mapProducto = (p: any) => ({
  id: p.id,
  name: p.nombre,
  description: p.descripcion,
  price: p.precio,
  pointsCost: p.costoPuntos,
  stock: p.stock,
  imageUrl: p.imageUrl,
  isActive: p.isActive,
});

export const getProducts = async (req: Request, res: Response) => {
  const showInactive = req.query.all === 'true';

  try {
    const products = await prisma.producto.findMany({
      where: showInactive ? {} : { isActive: true },
      orderBy: { nombre: 'asc' },
    });
    return res.json(products.map(mapProducto));
  } catch (error: any) {
    return res.status(500).json({ message: 'Error al obtener los productos', error: error.message });
  }
};

export const getProductById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const product = await prisma.producto.findUnique({
      where: { id },
    });
    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }
    return res.json(mapProducto(product));
  } catch (error: any) {
    return res.status(500).json({ message: 'Error al obtener el producto', error: error.message });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  const { name, description, price, pointsCost, stock, imageUrl } = req.body;

  if (!name || price === undefined || stock === undefined) {
    return res.status(400).json({ message: 'Nombre, precio y stock son obligatorios' });
  }

  try {
    const product = await prisma.producto.create({
      data: {
        nombre: name,
        descripcion: description,
        precio: Number(price),
        costoPuntos: pointsCost ? Number(pointsCost) : null,
        stock: Number(stock),
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1608248597481-496100c8c836?w=200&h=200&fit=crop',
      },
    });
    return res.status(201).json(mapProducto(product));
  } catch (error: any) {
    return res.status(500).json({ message: 'Error al crear el producto', error: error.message });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, description, price, pointsCost, stock, imageUrl, isActive } = req.body;

  try {
    const product = await prisma.producto.findUnique({ where: { id } });
    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    const updated = await prisma.producto.update({
      where: { id },
      data: {
        nombre: name !== undefined ? name : product.nombre,
        descripcion: description !== undefined ? description : product.descripcion,
        precio: price !== undefined ? Number(price) : product.precio,
        costoPuntos: pointsCost !== undefined ? (pointsCost ? Number(pointsCost) : null) : product.costoPuntos,
        stock: stock !== undefined ? Number(stock) : product.stock,
        imageUrl: imageUrl !== undefined ? imageUrl : product.imageUrl,
        isActive: isActive !== undefined ? Boolean(isActive) : product.isActive,
      },
    });

    return res.json(mapProducto(updated));
  } catch (error: any) {
    return res.status(500).json({ message: 'Error al actualizar el producto', error: error.message });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const salesCount = await prisma.itemVenta.count({
      where: { productoId: id },
    });

    if (salesCount > 0) {
      await prisma.producto.update({
        where: { id },
        data: { isActive: false },
      });
      return res.json({ message: 'El producto está vinculado a ventas realizadas. Se ha desactivado en su lugar.' });
    }

    await prisma.producto.delete({
      where: { id },
    });
    return res.json({ message: 'Producto eliminado con éxito' });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error al eliminar el producto', error: error.message });
  }
};
