import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Edit2, Trash2, Plus, RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: string;
  pointsCost: number | null;
  stock: number;
  imageUrl: string | null;
  isActive: boolean;
}

export const ProductTable: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Modales
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Formulario
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [pointsCost, setPointsCost] = useState('');
  const [stock, setStock] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/client/products?all=true');
      setProducts(res.data);
    } catch (err) {
      console.error('Error al obtener productos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [refreshTrigger]);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setName('');
    setDescription('');
    setPrice('');
    setPointsCost('');
    setStock('0');
    setImageUrl('');
    setIsActive(true);
    setIsProductModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setDescription(p.description || '');
    setPrice(Number(p.price).toString());
    setPointsCost(p.pointsCost ? p.pointsCost.toString() : '');
    setStock(p.stock.toString());
    setImageUrl(p.imageUrl || '');
    setIsActive(p.isActive);
    setIsProductModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const data = {
      name,
      description,
      price: Number(price),
      pointsCost: pointsCost ? Number(pointsCost) : null,
      stock: Number(stock),
      imageUrl: imageUrl || null,
      isActive,
    };

    try {
      if (editingProduct) {
        await api.put(`/admin/products/${editingProduct.id}`, data);
        alert('Producto actualizado con éxito');
      } else {
        await api.post('/admin/products', data);
        alert('Producto creado con éxito');
      }
      setIsProductModalOpen(false);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al guardar el producto');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar/desactivar este producto?')) return;
    try {
      await api.delete(`/admin/products/${id}`);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al eliminar producto');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xs uppercase tracking-widest text-zinc-400 font-medium">Inventario de Productos</h3>
        <div className="flex gap-2">
          <Button onClick={fetchProducts} variant="outline" size="sm">
            <RefreshCw size={14} />
          </Button>
          <Button onClick={handleOpenAdd} variant="primary" size="sm" className="flex items-center gap-1">
            <Plus size={14} /> Nuevo Producto
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-sm uppercase tracking-widest text-zinc-500">Cargando productos...</div>
      ) : products.length === 0 ? (
        <div className="text-center py-12 bg-zinc-950 border border-zinc-800">
          <p className="text-xs text-zinc-500 uppercase tracking-wider">No hay productos en inventario</p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-zinc-800 bg-zinc-950">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/50 text-[10px] uppercase tracking-widest text-zinc-400">
                <th className="p-3">Producto</th>
                <th className="p-3 text-right">Precio de Venta</th>
                <th className="p-3 text-center">Costo en Puntos</th>
                <th className="p-3 text-center">Stock</th>
                <th className="p-3 text-center">Estado</th>
                <th className="p-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900 text-xs">
              {products.map((p) => {
                const isLowStock = p.stock <= 5;
                return (
                  <tr key={p.id} className="hover:bg-zinc-900/30 transition-colors">
                    <td className="p-3 flex items-center gap-3">
                      <img
                        src={p.imageUrl || 'https://images.unsplash.com/photo-1608248597481-496100c8c836?w=100&h=100&fit=crop'}
                        alt={p.name}
                        className="w-10 h-10 object-cover border border-zinc-800 filter grayscale"
                      />
                      <div>
                        <span className="font-bold text-white uppercase tracking-wider block">{p.name}</span>
                        <span className="text-[10px] text-zinc-500 line-clamp-1">{p.description || 'Sin descripción'}</span>
                      </div>
                    </td>
                    <td className="p-3 text-right font-bold text-white font-mono">${Number(p.price).toFixed(2)}</td>
                    <td className="p-3 text-center font-mono text-zinc-300">
                      {p.pointsCost ? `${p.pointsCost} PTS` : <span className="text-zinc-600">—</span>}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <span className={`font-bold font-mono ${isLowStock ? 'text-red-400' : 'text-white'}`}>
                          {p.stock}
                        </span>
                        {isLowStock && p.stock > 0 && <AlertTriangle size={12} className="text-red-400" />}
                        {p.stock === 0 && <span className="text-[9px] bg-red-950 text-red-400 px-1 font-bold uppercase tracking-wider">Agotado</span>}
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      {p.isActive ? (
                        <span className="text-[9px] bg-zinc-900 text-zinc-300 px-1 py-0.5 border border-zinc-800 uppercase tracking-widest font-semibold">Activo</span>
                      ) : (
                        <span className="text-[9px] bg-black text-zinc-600 px-1 py-0.5 border border-zinc-950 uppercase tracking-widest font-semibold">Inactivo</span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="text-zinc-400 hover:text-white p-1"
                          title="Editar"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="text-zinc-400 hover:text-white p-1"
                          title="Eliminar"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de Crear/Editar Producto */}
      <Modal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        title={editingProduct ? 'Editar Producto' : 'Crear Nuevo Producto'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-widest text-zinc-400 mb-1 font-medium">Nombre del Producto</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-500 rounded-none uppercase tracking-wider"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-zinc-400 mb-1 font-medium">URL de Imagen</label>
              <input
                type="text"
                value={imageUrl}
                placeholder="https://ejemplo.com/foto.jpg"
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-500 rounded-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-zinc-400 mb-1 font-medium">Descripción</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 p-2 text-xs text-white focus:outline-none focus:border-zinc-500 rounded-none h-16 resize-none"
            ></textarea>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-widest text-zinc-400 mb-1 font-medium">Precio ($)</label>
              <input
                type="number"
                step="0.01"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-zinc-500 rounded-none"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-zinc-400 mb-1 font-medium">Costo en Puntos (Canje)</label>
              <input
                type="number"
                value={pointsCost}
                placeholder="Ej: 100 (Vacío si no aplica)"
                onChange={(e) => setPointsCost(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-zinc-500 rounded-none"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-zinc-400 mb-1 font-medium">Stock Inicial</label>
              <input
                type="number"
                required
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-zinc-500 rounded-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 py-2">
            <input
              type="checkbox"
              id="isActiveCheck"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="accent-white h-4 w-4"
            />
            <label htmlFor="isActiveCheck" className="text-xs uppercase tracking-widest text-zinc-300 cursor-pointer font-medium">
              Producto Activo (Visible en tienda / canjes)
            </label>
          </div>

          <Button type="submit" variant="primary" fullWidth disabled={submitting}>
            {submitting ? 'Guardando...' : editingProduct ? 'Actualizar Producto' : 'Crear Producto'}
          </Button>
        </form>
      </Modal>
    </div>
  );
};
