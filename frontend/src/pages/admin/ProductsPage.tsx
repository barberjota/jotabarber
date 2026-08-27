import React, { useEffect, useState } from 'react';
import { ProductTable } from '../../components/admin/ProductTable';
import { QuickSaleModal } from '../../components/admin/QuickSaleModal';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import {
  ShoppingBag,
  Box,
  History,
  DollarSign,
  Eye,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Plus,
  Minus,
  X
} from 'lucide-react';
import api from '../../services/api';

export const ProductsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'orders' | 'caja'>('inventory');
  const [isPOSOpen, setIsPOSOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Estados de Caja
  const [cajaStatus, setCajaStatus] = useState<'open' | 'closed'>('closed');
  const [activeCaja, setActiveCaja] = useState<any>(null);
  const [montoApertura, setMontoApertura] = useState('');
  const [montoCierre, setMontoCierre] = useState('');
  const [cajaLoading, setCajaLoading] = useState(false);

  // Estados de Pedidos/Ventas
  const [sales, setSales] = useState<any[]>([]);
  const [salesLoading, setSalesLoading] = useState(false);
  const [filterEstado, setFilterEstado] = useState<string>('TODOS');

  // Modales de Pedidos
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCobrarOpen, setIsCobrarOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'EFECTIVO' | 'QR'>('EFECTIVO');
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Edición de items de pedido
  const [editItems, setEditItems] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);

  const fetchCajaStatus = async () => {
    setCajaLoading(true);
    try {
      const res = await api.get('/admin/caja/active');
      setCajaStatus(res.data.status);
      setActiveCaja(res.data.activeCaja);
    } catch (err) {
      console.error('Error al obtener estado de caja:', err);
    } finally {
      setCajaLoading(false);
    }
  };

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
    fetchCajaStatus();
    fetchSales();
    fetchProducts();
  }, [refreshKey]);

  const handlePOSSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleOpenCaja = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!montoApertura || Number(montoApertura) < 0) {
      alert('Ingresa un monto de apertura válido.');
      return;
    }
    try {
      await api.post('/admin/caja/open', { montoApertura: Number(montoApertura) });
      alert('Caja abierta con éxito.');
      setMontoApertura('');
      setRefreshKey((prev) => prev + 1);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al abrir caja');
    }
  };

  const handleCloseCaja = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!montoCierre || Number(montoCierre) < 0) {
      alert('Ingresa un monto de cierre válido.');
      return;
    }
    if (!window.confirm('¿Está seguro de que desea cerrar la caja del turno actual?')) return;
    try {
      await api.post('/admin/caja/close', { montoCierre: Number(montoCierre) });
      alert('Caja cerrada con éxito.');
      setMontoCierre('');
      setRefreshKey((prev) => prev + 1);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al cerrar caja');
    }
  };

  const handleDeleteOrder = async (id: string) => {
    if (!window.confirm('¿Está seguro de que desea eliminar este pedido/venta? Se devolverán los productos al stock del inventario.')) return;
    try {
      await api.delete(`/admin/sales/${id}`);
      alert('Pedido/Venta eliminado con éxito.');
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

  // Filtrado de Pedidos
  const filteredSales = sales.filter((s) => {
    if (filterEstado === 'TODOS') return true;
    return s.estado === filterEstado;
  });

  return (
    <div className="space-y-6">
      {/* Cabecera de Página */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold uppercase tracking-widest text-white flex items-center gap-2">
            <Box className="text-zinc-400" /> POS, Ventas & Caja
          </h2>
          <p className="text-xs text-zinc-500 mt-1">Registra ventas, administra pedidos y controla la caja diaria.</p>
        </div>

        {cajaStatus === 'open' && (
          <Button
            onClick={() => setIsPOSOpen(true)}
            variant="primary"
            className="flex items-center gap-1.5 text-xs uppercase tracking-widest font-bold"
          >
            <ShoppingBag size={16} /> Venta POS Directa
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-900 mb-6">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs uppercase tracking-wider font-semibold border-b-2 transition-colors ${
            activeTab === 'inventory'
              ? 'border-white text-white'
              : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Box size={14} /> Inventario
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs uppercase tracking-wider font-semibold border-b-2 transition-colors ${
            activeTab === 'orders'
              ? 'border-white text-white'
              : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <History size={14} /> Pedidos & Reservas
        </button>
        <button
          onClick={() => setActiveTab('caja')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs uppercase tracking-wider font-semibold border-b-2 transition-colors ${
            activeTab === 'caja'
              ? 'border-white text-white'
              : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <DollarSign size={14} /> Control de Caja
        </button>
      </div>

      {/* Renders de Tab */}
      {activeTab === 'inventory' && (
        <ProductTable key={refreshKey} />
      )}

      {activeTab === 'orders' && (
        <div className="space-y-4">
          {/* Barra de Filtros */}
          <div className="flex flex-wrap justify-between items-center gap-4 bg-zinc-950 border border-zinc-900 p-4">
            <div className="flex gap-2">
              {['TODOS', 'PENDIENTE', 'COMPLETADO'].map((e) => (
                <button
                  key={e}
                  onClick={() => setFilterEstado(e)}
                  className={`px-3 py-1.5 text-[10px] uppercase font-bold tracking-widest border transition-colors ${
                    filterEstado === e
                      ? 'bg-white border-white text-black font-semibold'
                      : 'border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  {e}s
                </button>
              ))}
            </div>
          </div>

          {/* Tabla de Pedidos */}
          {salesLoading ? (
            <div className="text-center py-8 text-xs uppercase tracking-widest text-zinc-500">Cargando registros...</div>
          ) : filteredSales.length === 0 ? (
            <div className="text-center py-8 text-xs uppercase tracking-widest text-zinc-500 border border-zinc-900 bg-zinc-950/40">
              No hay pedidos en este estado.
            </div>
          ) : (
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
                  {filteredSales.map((s: any) => (
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
                        <span className={`inline-block px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase border ${
                          s.estado === 'COMPLETADO'
                            ? 'border-emerald-900/30 bg-emerald-950/20 text-emerald-400'
                            : 'border-yellow-900/30 bg-yellow-950/20 text-yellow-400'
                        }`}>
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
          )}
        </div>
      )}

      {activeTab === 'caja' && (
        <div className="space-y-6">
          {cajaLoading ? (
            <div className="text-center py-8 text-xs uppercase tracking-widest text-zinc-500">Cargando estado de caja...</div>
          ) : cajaStatus === 'open' && activeCaja ? (
            /* Caja Abierta */
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-5 border-zinc-800 space-y-2">
                  <span className="text-[10px] uppercase tracking-wider text-zinc-500 block">Fondo Apertura</span>
                  <p className="font-mono font-bold text-white text-base">Bs. {activeCaja.montoApertura.toFixed(2)}</p>
                </Card>
                <Card className="p-5 border-zinc-800 space-y-2">
                  <span className="text-[10px] uppercase tracking-wider text-zinc-500 block">Cobros en Efectivo</span>
                  <p className="font-mono font-bold text-emerald-400 text-base">Bs. {activeCaja.montoEfectivo.toFixed(2)}</p>
                </Card>
                <Card className="p-5 border-zinc-800 space-y-2">
                  <span className="text-[10px] uppercase tracking-wider text-zinc-500 block">Cobros QR</span>
                  <p className="font-mono font-bold text-sky-400 text-base">Bs. {activeCaja.montoQR.toFixed(2)}</p>
                </Card>
                <Card className="p-5 border-zinc-800 space-y-2 bg-zinc-900/20 border-white/5">
                  <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold block">Total Estimado en Caja</span>
                  <p className="font-mono font-bold text-white text-base">Bs. {activeCaja.totalGeneral.toFixed(2)}</p>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <Card className="p-6 border-zinc-800 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-white">Cerrar Caja del Turno</h3>
                  <p className="text-[11px] text-zinc-500 leading-relaxed">
                    Verifica que las cuentas y los montos cuadren. Al cerrar la caja se consolidará el total en el historial general.
                  </p>
                  <form onSubmit={handleCloseCaja} className="space-y-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-zinc-400 mb-1">Monto Físico Real de Cierre (Bs.) *</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={montoCierre}
                        onChange={(e) => setMontoCierre(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-500 rounded-none font-mono"
                        placeholder="0.00"
                      />
                    </div>
                    <Button type="submit" variant="primary" fullWidth>
                      Confirmar y Cerrar Caja
                    </Button>
                  </form>
                </Card>

                <Card className="p-6 border-zinc-800 space-y-2 text-xs">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-white mb-2">Información del Turno</h3>
                  <div className="space-y-2 text-zinc-400">
                    <p><span className="text-zinc-500 font-semibold uppercase text-[10px]">Cajero Responsable:</span> {activeCaja.usuarioNombre}</p>
                    <p><span className="text-zinc-500 font-semibold uppercase text-[10px]">Hora de Apertura:</span> {new Date(activeCaja.createdAt).toLocaleString()}</p>
                    <p><span className="text-zinc-500 font-semibold uppercase text-[10px]">Total Ventas Directas:</span> Bs. {activeCaja.totalVentas.toFixed(2)}</p>
                  </div>
                </Card>
              </div>
            </div>
          ) : (
            /* Caja Cerrada */
            <div className="animate-in fade-in duration-200">
              <Card className="p-8 border-zinc-800 max-w-md space-y-4">
                <div className="flex gap-2 items-center text-zinc-400">
                  <AlertCircle size={20} className="text-zinc-500" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-white">La Caja está Cerrada</h3>
                </div>
                <p className="text-[11px] text-zinc-500 leading-relaxed">
                  Para poder efectuar ventas rápidas en el local o cobrar los pedidos de clientes, es obligatorio inicializar la caja con el fondo inicial del turno.
                </p>
                <form onSubmit={handleOpenCaja} className="space-y-4 pt-2">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-zinc-400 mb-1">Monto Fondo Inicial (Bs.) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={montoApertura}
                      onChange={(e) => setMontoApertura(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-500 rounded-none font-mono"
                      placeholder="0.00"
                    />
                  </div>
                  <Button type="submit" variant="primary" fullWidth>
                    Abrir Caja del Turno
                  </Button>
                </form>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* Modal POS */}
      <QuickSaleModal
        isOpen={isPOSOpen}
        onClose={() => setIsPOSOpen(false)}
        onSuccess={handlePOSSuccess}
      />

      {/* Modal Ver Detalle */}
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
                    <span className="text-white font-bold">{it.quantity}x {it.product ? it.product.name : 'Producto'}</span>
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
              Seleccione el método de pago utilizado por el cliente para completar el cobro e ingresar el dinero a la caja.
            </p>
            <div className="border border-zinc-900 bg-zinc-900/30 p-3 space-y-1">
              <p><span className="text-zinc-500 font-semibold uppercase text-[10px]">Cliente:</span> {selectedOrder.user ? selectedOrder.user.name : 'Cliente General'}</p>
              <p><span className="text-zinc-500 font-semibold uppercase text-[10px]">Monto a Cobrar:</span> <span className="font-bold text-white font-mono">Bs. {Number(selectedOrder.total).toFixed(2)}</span></p>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] uppercase tracking-widest text-zinc-400 font-medium">Método de Pago *</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('EFECTIVO')}
                  className={`py-3 text-[10px] font-bold tracking-widest uppercase border transition-colors cursor-pointer ${
                    paymentMethod === 'EFECTIVO'
                      ? 'border-white bg-white text-black'
                      : 'border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  💵 Efectivo
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('QR')}
                  className={`py-3 text-[10px] font-bold tracking-widest uppercase border transition-colors cursor-pointer ${
                    paymentMethod === 'QR'
                      ? 'border-white bg-white text-black'
                      : 'border-zinc-800 text-zinc-400 hover:text-white'
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
                      <button
                        onClick={() => handleUpdateEditItemQty(item.productId, -1)}
                        className="px-2 py-1 text-zinc-400 hover:text-white"
                      >
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
export default ProductsPage;
