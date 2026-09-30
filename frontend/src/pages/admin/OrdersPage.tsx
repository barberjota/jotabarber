import React, { useEffect, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import {
  ShoppingBag,
  History,
  Eye,
  Edit2,
  Trash2,
  CheckCircle2,
  Plus,
  Minus,
  Calendar,
  Search,
  RefreshCw,
} from 'lucide-react';
import api from '../../services/api';

export const OrdersPage: React.FC = () => {
  const [sales, setSales] = useState<any[]>([]);
  const [salesLoading, setSalesLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [filterEstado, setFilterEstado] = useState<string>('TODOS');
  const [searchQuery, setSearchQuery] = useState('');

  // Fechas en Huso Horario de Bolivia
  const getBoliviaTodayStr = () => {
    try {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat('fr-CA', {
        timeZone: 'America/La_Paz',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      return formatter.format(now);
    } catch (e) {
      const today = new Date();
      const offset = today.getTimezoneOffset();
      const localToday = new Date(today.getTime() - offset * 60 * 1000);
      return localToday.toISOString().split('T')[0];
    }
  };

  const getBoliviaPastDateStr = (daysAgo: number) => {
    try {
      const now = new Date();
      const past = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      const formatter = new Intl.DateTimeFormat('fr-CA', {
        timeZone: 'America/La_Paz',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      return formatter.format(past);
    } catch (e) {
      const today = new Date();
      const past = new Date(today.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      const offset = past.getTimezoneOffset();
      const localPast = new Date(past.getTime() - offset * 60 * 1000);
      return localPast.toISOString().split('T')[0];
    }
  };

  const [startDate, setStartDate] = useState(getBoliviaPastDateStr(30));
  const [endDate, setEndDate] = useState(getBoliviaTodayStr());

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modales
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCobrarOpen, setIsCobrarOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'EFECTIVO' | 'QR'>('EFECTIVO');
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Edición de items
  const [editItems, setEditItems] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);

  const fetchSales = async () => {
    setSalesLoading(true);
    try {
      const res = await api.get('/admin/sales');
      setSales(res.data);
    } catch (err) {
      console.error('Error al obtener ventas/pedidos:', err);
    } finally {
      setSalesLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await api.get('/client/products');
      setAllProducts(res.data);
    } catch (err) {
      console.error('Error al obtener productos:', err);
    }
  };

  useEffect(() => {
    fetchSales();
    fetchProducts();
  }, [refreshKey]);

  const handleDeleteOrder = async (id: string) => {
    if (!window.confirm('¿Está seguro de que desea eliminar este pedido? Se devolverán los productos al stock del inventario.')) return;
    try {
      await api.delete(`/admin/sales/${id}`);
      alert('Pedido eliminado con éxito.');
      setRefreshKey((prev) => prev + 1);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al eliminar el pedido.');
    }
  };

  const handleCobrarConfirm = async () => {
    if (!selectedOrder) return;
    try {
      await api.post(`/admin/sales/${selectedOrder.id}/checkout`, { paymentMethod });
      alert('Pedido cobrado con éxito.');
      setIsCobrarOpen(false);
      setSelectedOrder(null);
      setRefreshKey((prev) => prev + 1);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al cobrar el pedido.');
    }
  };

  const handleStartEdit = (order: any) => {
    setSelectedOrder(order);
    const items = order.items.map((it: any) => {
      const prod = allProducts.find((p) => p.id === it.productId);
      return {
        productId: it.productId,
        quantity: it.quantity,
        name: it.product ? it.product.name : 'Producto',
        price: it.product ? it.product.price : it.unitPrice,
        maxStock: (prod ? prod.stock : 0) + it.quantity,
      };
    });
    setEditItems(items);
    setIsEditOpen(true);
  };

  const handleUpdateEditItemQty = (productId: string, delta: number) => {
    setEditItems((prev) =>
      prev.map((item) => {
        if (item.productId === productId) {
          const newQty = Math.max(1, Math.min(item.quantity + delta, item.maxStock));
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
  };

  const handleRemoveEditItem = (productId: string) => {
    if (editItems.length <= 1) {
      alert('El pedido debe tener al menos un producto.');
      return;
    }
    setEditItems((prev) => prev.filter((item) => item.productId !== productId));
  };

  const handleSaveEdit = async () => {
    if (!selectedOrder) return;
    try {
      const payload = editItems.map((it) => ({
        productId: it.productId,
        quantity: it.quantity,
      }));
      await api.put(`/admin/sales/${selectedOrder.id}`, { items: payload });
      alert('Pedido modificado con éxito.');
      setIsEditOpen(false);
      setSelectedOrder(null);
      setRefreshKey((prev) => prev + 1);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al actualizar el pedido');
    }
  };

  const calculateEditTotal = () => {
    return editItems.reduce((acc, item) => acc + Number(item.price) * item.quantity, 0);
  };

  // Helper de fecha Bolivia
  const getSaleBoliviaDate = (createdAtStr: string) => {
    try {
      const d = new Date(createdAtStr);
      const formatter = new Intl.DateTimeFormat('fr-CA', {
        timeZone: 'America/La_Paz',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      return formatter.format(d);
    } catch (e) {
      return new Date(createdAtStr).toISOString().split('T')[0];
    }
  };

  // Resetear página 1 en filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [filterEstado, startDate, endDate, searchQuery]);

  // Filtrado
  const filteredSales = sales.filter((s) => {
    const saleDate = getSaleBoliviaDate(s.createdAt);
    const matchesStart = startDate ? saleDate >= startDate : true;
    const matchesEnd = endDate ? saleDate <= endDate : true;
    const matchesEstado = filterEstado === 'TODOS' ? true : s.estado === filterEstado;

    const clientName = s.user ? s.user.name.toLowerCase() : 'cliente general';
    const clientPhone = s.user ? s.user.phone : '';
    const orderId = s.id.toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesQuery = !searchQuery || clientName.includes(query) || clientPhone.includes(query) || orderId.includes(query);

    return matchesStart && matchesEnd && matchesEstado && matchesQuery;
  });

  const totalPages = Math.ceil(filteredSales.length / itemsPerPage);
  const paginatedSales = filteredSales.slice(
    (currentPage - 1) * itemsPerPage,
    (currentPage - 1) * itemsPerPage + itemsPerPage
  );

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold uppercase tracking-widest text-white flex items-center gap-2">
            <ShoppingBag className="text-zinc-400" /> Gestión de Pedidos
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            Administra los pedidos de productos reservados por los clientes, procesa sus cobros y gestiona entregas.
          </p>
        </div>
        <Button onClick={() => setRefreshKey((prev) => prev + 1)} variant="outline" size="sm">
          <RefreshCw size={14} />
        </Button>
      </div>

      {/* Barra de Filtros */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-950 border border-zinc-900 p-4">
        {/* Búsqueda por texto */}
        <div className="flex-1 max-w-xs">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar cliente, teléfono o #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-500 rounded-none placeholder-zinc-600"
            />
            <Search size={14} className="absolute left-2.5 top-2.5 text-zinc-500" />
          </div>
        </div>

        {/* Estado */}
        <div className="flex gap-2">
          {['TODOS', 'PENDIENTE', 'COMPLETADO'].map((e) => (
            <button
              key={e}
              onClick={() => setFilterEstado(e)}
              className={`px-3 py-1.5 text-[10px] uppercase font-bold tracking-widest border transition-colors cursor-pointer ${
                filterEstado === e
                  ? 'bg-white border-white text-black font-semibold'
                  : 'border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              {e}s
            </button>
          ))}
        </div>

        {/* Rango de Fechas */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-medium">Desde:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 px-2 py-1 text-[10px] text-white focus:outline-none focus:border-zinc-500 rounded-none uppercase font-mono"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-medium">Hasta:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 px-2 py-1 text-[10px] text-white focus:outline-none focus:border-zinc-500 rounded-none uppercase font-mono"
            />
          </div>
          {(startDate || endDate) && (
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
              }}
              className="text-[9px] uppercase font-bold text-zinc-500 hover:text-white transition-colors border border-zinc-800 px-2 py-1 ml-1 cursor-pointer"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Tabla de Pedidos */}
      {salesLoading ? (
        <div className="text-center py-12 text-xs uppercase tracking-widest text-zinc-500">Cargando pedidos...</div>
      ) : filteredSales.length === 0 ? (
        <div className="text-center py-12 text-xs uppercase tracking-widest text-zinc-500 border border-zinc-900 bg-zinc-950">
          No hay pedidos registrados con los filtros aplicados.
        </div>
      ) : (
        <>
          <div className="bg-zinc-950 border border-zinc-900 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-900 text-[10px] uppercase tracking-widest text-zinc-400 bg-zinc-900/20">
                  <th className="p-4 font-semibold">ID / Fecha</th>
                  <th className="p-4 font-semibold">Cliente</th>
                  <th className="p-4 font-semibold">Método Pago</th>
                  <th className="p-4 font-semibold">Estado</th>
                  <th className="p-4 font-semibold">Total</th>
                  <th className="p-4 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900 text-xs">
                {paginatedSales.map((s: any) => (
                  <tr key={s.id} className="hover:bg-zinc-900/20 transition-colors">
                    <td className="p-4 space-y-1">
                      <span className="font-bold text-white block uppercase tracking-wider text-[10px]">#{s.id.substring(0, 8)}</span>
                      <span className="text-[10px] text-zinc-500 font-mono">{new Date(s.createdAt).toLocaleString()}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-zinc-200 block">{s.user ? s.user.name : 'Cliente General'}</span>
                      <span className="text-[10px] text-zinc-500 font-mono">{s.user ? s.user.phone : '-'}</span>
                    </td>
                    <td className="p-4 font-semibold tracking-wider text-[10px]">
                      {s.metodoPago ? (
                        <span className={s.metodoPago === 'EFECTIVO' ? 'text-emerald-400' : 'text-sky-400'}>
                          {s.metodoPago}
                        </span>
                      ) : (
                        <span className="text-zinc-500">-</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-block px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase border ${
                          s.estado === 'COMPLETADO'
                            ? 'border-emerald-900/30 bg-emerald-950/20 text-emerald-400'
                            : 'border-yellow-900/30 bg-yellow-950/20 text-yellow-400'
                        }`}
                      >
                        {s.estado}
                      </span>
                    </td>
                    <td className="p-4 font-mono font-bold text-white">Bs. {Number(s.total).toFixed(2)}</td>
                    <td className="p-4 text-right space-x-2">
                      <Button
                        onClick={() => {
                          setSelectedOrder(s);
                          setIsDetailsOpen(true);
                        }}
                        variant="outline"
                        size="sm"
                        className="px-2.5 py-1 text-[9px] uppercase tracking-wider font-semibold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Eye size={10} /> Detalle
                      </Button>
                      {s.estado === 'PENDIENTE' && (
                        <>
                          <Button
                            onClick={() => handleStartEdit(s)}
                            variant="outline"
                            size="sm"
                            className="px-2.5 py-1 text-[9px] uppercase tracking-wider font-semibold inline-flex items-center gap-1 cursor-pointer text-zinc-300 hover:text-white"
                          >
                            <Edit2 size={10} /> Modificar
                          </Button>
                          <Button
                            onClick={() => {
                              setSelectedOrder(s);
                              setPaymentMethod('EFECTIVO');
                              setIsCobrarOpen(true);
                            }}
                            variant="primary"
                            size="sm"
                            className="px-2.5 py-1 text-[9px] uppercase tracking-wider font-semibold inline-flex items-center gap-1 cursor-pointer"
                          >
                            <CheckCircle2 size={10} /> Cobrar
                          </Button>
                        </>
                      )}
                      <Button
                        onClick={() => handleDeleteOrder(s.id)}
                        variant="outline"
                        size="sm"
                        className="px-2.5 py-1 text-[9px] uppercase tracking-wider font-semibold inline-flex items-center gap-1 cursor-pointer text-red-500 border-red-950 hover:bg-red-950/20"
                      >
                        <Trash2 size={10} /> Eliminar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center bg-zinc-950 border-x border-b border-zinc-900 p-4">
              <Button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                variant="outline"
                size="sm"
                className="text-[10px] uppercase font-bold tracking-wider cursor-pointer"
              >
                Anterior
              </Button>
              <span className="text-[10px] text-zinc-400 font-mono">
                Página {currentPage} de {totalPages} ({filteredSales.length} registros)
              </span>
              <Button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                variant="outline"
                size="sm"
                className="text-[10px] uppercase font-bold tracking-wider cursor-pointer"
              >
                Siguiente
              </Button>
            </div>
          )}
        </>
      )}

      {/* Modal Ver Detalle de Pedido */}
      {isDetailsOpen && selectedOrder && (
        <Modal isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} title="Detalle del Pedido">
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4 border-b border-zinc-900 pb-3">
              <div>
                <span className="text-zinc-500 font-semibold block uppercase text-[10px]">ID Pedido</span>
                <span className="font-mono text-white">#{selectedOrder.id}</span>
              </div>
              <div>
                <span className="text-zinc-500 font-semibold block uppercase text-[10px]">Fecha</span>
                <span className="text-zinc-200">{new Date(selectedOrder.createdAt).toLocaleString()}</span>
              </div>
            </div>

            <div>
              <span className="text-zinc-500 font-semibold block uppercase text-[10px] mb-2">Productos</span>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                {selectedOrder.items.map((it: any) => (
                  <div key={it.id} className="flex justify-between items-center bg-zinc-900/40 border border-zinc-900 p-2 uppercase text-[10px]">
                    <span className="text-white font-bold">
                      {it.quantity}x {it.product ? it.product.name : 'Producto'}
                    </span>
                    <span className="font-mono text-zinc-400">Bs. {(Number(it.unitPrice) * it.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-zinc-900 pt-3 flex justify-between items-center text-sm font-bold">
              <span className="text-zinc-400 uppercase text-xs">Total:</span>
              <span className="font-mono text-white">Bs. {Number(selectedOrder.total).toFixed(2)}</span>
            </div>

            <div className="pt-2 flex justify-end">
              <Button onClick={() => setIsDetailsOpen(false)} variant="outline">
                Cerrar
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Cobrar Pedido */}
      {isCobrarOpen && selectedOrder && (
        <Modal isOpen={isCobrarOpen} onClose={() => setIsCobrarOpen(false)} title="Cobrar Pedido Pendiente">
          <div className="space-y-4 text-xs">
            <p className="text-zinc-400 text-[11px] leading-relaxed">
              Seleccione el método de pago utilizado por el cliente para completar el cobro del pedido.
            </p>
            <div className="border border-zinc-900 bg-zinc-900/30 p-3 space-y-1">
              <p>
                <span className="text-zinc-500 font-semibold uppercase text-[10px]">Cliente:</span>{' '}
                {selectedOrder.user ? selectedOrder.user.name : 'Cliente General'}
              </p>
              <p>
                <span className="text-zinc-500 font-semibold uppercase text-[10px]">Monto a Cobrar:</span>{' '}
                <span className="font-bold text-white font-mono">Bs. {Number(selectedOrder.total).toFixed(2)}</span>
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] uppercase tracking-widest text-zinc-400 font-medium">Método de Pago *</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('EFECTIVO')}
                  className={`py-3 text-[10px] font-bold tracking-widest uppercase border transition-colors cursor-pointer ${
                    paymentMethod === 'EFECTIVO' ? 'border-white bg-white text-black' : 'border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  💵 Efectivo
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('QR')}
                  className={`py-3 text-[10px] font-bold tracking-widest uppercase border transition-colors cursor-pointer ${
                    paymentMethod === 'QR' ? 'border-white bg-white text-black' : 'border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  📱 Pago QR
                </button>
              </div>
            </div>

            <div className="border-t border-zinc-900 pt-4 flex justify-end gap-3">
              <Button onClick={() => setIsCobrarOpen(false)} variant="outline">
                Cancelar
              </Button>
              <Button onClick={handleCobrarConfirm} variant="primary">
                Confirmar Cobro
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Modificar Pedido */}
      {isEditOpen && selectedOrder && (
        <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Modificar Pedido Pendiente" size="md">
          <div className="space-y-4 text-xs">
            <span className="text-zinc-500 uppercase text-[10px] font-bold block mb-2">Editar Cantidades de Productos</span>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {editItems.map((item) => (
                <div key={item.productId} className="flex justify-between items-center bg-zinc-900/30 border border-zinc-900 p-3">
                  <div className="space-y-0.5">
                    <span className="font-bold text-white text-[10px] uppercase block">{item.name}</span>
                    <span className="text-zinc-500 font-mono text-[9px]">Bs. {Number(item.price).toFixed(2)} c/u</span>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Sumar / Restar */}
                    <div className="flex items-center border border-zinc-800 bg-zinc-900">
                      <button onClick={() => handleUpdateEditItemQty(item.productId, -1)} className="px-2 py-1 text-zinc-400 hover:text-white">
                        <Minus size={10} />
                      </button>
                      <span className="px-2 font-mono font-bold text-white">{item.quantity}</span>
                      <button
                        onClick={() => handleUpdateEditItemQty(item.productId, 1)}
                        className="px-2 py-1 text-zinc-400 hover:text-white"
                        disabled={item.quantity >= item.maxStock}
                      >
                        <Plus size={10} />
                      </button>
                    </div>

                    <button
                      onClick={() => handleRemoveEditItem(item.productId)}
                      className="text-zinc-500 hover:text-red-400 transition-colors p-1"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-zinc-900 pt-3 flex justify-between items-center font-bold text-xs">
              <span className="text-zinc-400 uppercase">Nuevo Total Estimado:</span>
              <span className="font-mono text-white text-sm">Bs. {calculateEditTotal().toFixed(2)}</span>
            </div>

            <div className="border-t border-zinc-900 pt-4 flex justify-end gap-3">
              <Button onClick={() => setIsEditOpen(false)} variant="outline">
                Cancelar
              </Button>
              <Button onClick={handleSaveEdit} variant="primary">
                Guardar Cambios
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
