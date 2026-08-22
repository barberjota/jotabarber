"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProduct = exports.updateProduct = exports.createProduct = exports.getProductById = exports.getProducts = void 0;
const db_1 = __importDefault(require("../config/db"));
const mapProducto = (p) => ({
    id: p.id,
    name: p.nombre,
    description: p.descripcion,
    price: p.precio,
    pointsCost: p.costoPuntos,
    stock: p.stock,
    imageUrl: p.imageUrl,
    isActive: p.isActive,
});
const getProducts = async (req, res) => {
    const showInactive = req.query.all === 'true';
    try {
        const products = await db_1.default.producto.findMany({
            where: showInactive ? {} : { isActive: true },
            orderBy: { nombre: 'asc' },
        });
        return res.json(products.map(mapProducto));
    }
    catch (error) {
        return res.status(500).json({ message: 'Error al obtener los productos', error: error.message });
    }
};
exports.getProducts = getProducts;
const getProductById = async (req, res) => {
    const { id } = req.params;
    try {
        const product = await db_1.default.producto.findUnique({
            where: { id },
        });
        if (!product) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }
        return res.json(mapProducto(product));
    }
    catch (error) {
        return res.status(500).json({ message: 'Error al obtener el producto', error: error.message });
    }
};
exports.getProductById = getProductById;
const createProduct = async (req, res) => {
    const { name, description, price, pointsCost, stock, imageUrl } = req.body;
    if (!name || price === undefined || stock === undefined) {
        return res.status(400).json({ message: 'Nombre, precio y stock son obligatorios' });
    }
    try {
        const product = await db_1.default.producto.create({
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
    }
    catch (error) {
        return res.status(500).json({ message: 'Error al crear el producto', error: error.message });
    }
};
exports.createProduct = createProduct;
const updateProduct = async (req, res) => {
    const { id } = req.params;
    const { name, description, price, pointsCost, stock, imageUrl, isActive } = req.body;
    try {
        const product = await db_1.default.producto.findUnique({ where: { id } });
        if (!product) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }
        const updated = await db_1.default.producto.update({
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
    }
    catch (error) {
        return res.status(500).json({ message: 'Error al actualizar el producto', error: error.message });
    }
};
exports.updateProduct = updateProduct;
const deleteProduct = async (req, res) => {
    const { id } = req.params;
    try {
        const salesCount = await db_1.default.itemVenta.count({
            where: { productoId: id },
        });
        if (salesCount > 0) {
            await db_1.default.producto.update({
                where: { id },
                data: { isActive: false },
            });
            return res.json({ message: 'El producto está vinculado a ventas realizadas. Se ha desactivado en su lugar.' });
        }
        await db_1.default.producto.delete({
            where: { id },
        });
        return res.json({ message: 'Producto eliminado con éxito' });
    }
    catch (error) {
        return res.status(500).json({ message: 'Error al eliminar el producto', error: error.message });
    }
};
exports.deleteProduct = deleteProduct;
