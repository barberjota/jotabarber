import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { ShoppingBag, Search, Plus, Trash2, User, Gift } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: string;
  pointsCost: number | null;
  stock: number;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  pointsBalance: number;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface QuickSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const QuickSaleModal: React.FC<QuickSaleModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'sale' | 'redeem'>('sale');
  
  // Catálogos
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados de Selección
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [discount, setDiscount] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [posPaymentMethod, setPosPaymentMethod] = useState<'EFECTIVO' | 'QR'>('EFECTIVO');

  // Carrito de Venta
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [prodRes, custRes] = await Promise.all([
          api.get('/client/products'), // Solo activos
          api.get('/admin/customers'),
        ]);
        setProducts(prodRes.data);
        setCustomers(custRes.data);
      } catch (err) {
        console.error('Error al obtener datos POS:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // Limpiar estados al abrir
    setCart([]);
    setSelectedCustomerId('');
    setSelectedProductId('');
    setQuantity(1);
    setDiscount(0);
  }, [isOpen]);

  const handleAddToCart = () => {
    if (!selectedProductId) return;
    const product = products.find((p) => p.id === selectedProductId);
    if (!product) return;

    if (product.stock < quantity) {
      alert(`Stock insuficiente. Solo quedan ${product.stock} unidades.`);
      return;
    }

    // Verificar si ya está en el carrito
    const existingIndex = cart.findIndex((item) => item.product.id === product.id);
    if (existingIndex >= 0) {
      const newQty = cart[existingIndex].quantity + quantity;
      if (product.stock < newQty) {
        alert(`Stock insuficiente en total. Solo quedan ${product.stock} unidades.`);
        return;
      }
      const newCart = [...cart];
      newCart[existingIndex].quantity = newQty;
      setCart(newCart);
    } else {
      setCart([...cart, { product, quantity }]);
    }

    // Resetear campos
    setSelectedProductId('');
    setQuantity(1);
  };

  const handleRemoveFromCart = (index: number) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  const calculateSubtotal = () => {
    return cart.reduce((acc, item) => acc + Number(item.product.price) * item.quantity, 0);
  };

  const calculateTotal = () => {
    return Math.max(0, calculateSubtotal() - discount);
  };

  const selectedCustomerObj = customers.find((c) => c.id === selectedCustomerId);

  // Enviar Venta POS
  const handleSaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      alert('Agregue al menos un producto al carrito');
      return;
    }

    setSubmitting(true);
    try {
      const items = cart.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
      }));

      await api.post('/admin/sales', {
        userId: selectedCustomerId || null,
        items,
        discount,
        paymentMethod: posPaymentMethod,
      });

      alert('Venta procesada con éxito');
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al procesar la venta');
    } finally {
      setSubmitting(false);
    }
  };

  // Enviar Canje de Puntos
  const handleRedeemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || !selectedProductId) {
      alert('Seleccione un cliente y un producto');
      return;
    }

    const product = products.find((p) => p.id === selectedProductId);
    const customer = customers.find((c) => c.id === selectedCustomerId);

    if (!product || !customer) return;
    if (!product.pointsCost) {
      alert('Este producto no es elegible para canje por puntos');
      return;
    }

    const totalCost = product.pointsCost * quantity;
    if (customer.pointsBalance < totalCost) {
      alert(`Puntos insuficientes. Costo: ${totalCost} PTS. Saldo actual: ${customer.pointsBalance} PTS.`);
      return;
    }

    if (product.stock < quantity) {
      alert(`Stock insuficiente. Solo quedan ${product.stock} unidades.`);
      return;
    }

    if (!window.confirm(`¿Confirmar canje de ${quantity}x "${product.name}" por ${totalCost} PTS para el cliente ${customer.name}?`)) {
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/client/loyalty/redeem', {
        userId: selectedCustomerId,
        productId: selectedProductId,
        quantity,
      });

      alert('Canje de puntos procesado con éxito');
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al procesar canje');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Caja POS & Canjes" size="lg">
      {/* Tabs */}
      <div className="flex border-b border-zinc-900 mb-5">
        <button
          onClick={() => setActiveTab('sale')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs uppercase tracking-wider font-semibold border-b-2 transition-colors ${
            activeTab === 'sale'
              ? 'border-white text-white'
              : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <ShoppingBag size={14} /> Venta de Productos
        </button>
        <button
          onClick={() => setActiveTab('redeem')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs uppercase tracking-wider font-semibold border-b-2 transition-colors ${
            activeTab === 'redeem'
              ? 'border-white text-white'
              : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Gift size={14} /> Canje de Puntos
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-xs uppercase tracking-widest text-zinc-500">Iniciando terminal POS...</div>
      ) : activeTab === 'sale' ? (
        /* ================= VENTA DE PRODUCTOS ================= */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Columna Izquierda: Registro e Inputs */}
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-zinc-400 mb-1.5 font-medium">Asociar Cliente (Opcional)</label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-500 rounded-none uppercase tracking-wider"
              >
                <option value="">Cliente al Paso (No acumula puntos)</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone}) - {c.pointsBalance} PTS
                  </option>
                ))}
              </select>
            </div>

            <div className="border-t border-zinc-900 pt-4 space-y-3">
              <span className="block text-[10px] uppercase tracking-widest text-zinc-400 font-semibold">Agregar Producto</span>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[9px] uppercase tracking-wider text-zinc-500 mb-1">Producto</label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-500 rounded-none uppercase tracking-wider"
                  >
                    <option value="">Seleccione...</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} - Bs. {Number(p.price).toFixed(2)} (Stock: {p.stock})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] uppercase tracking-wider text-zinc-500 mb-1">Cant.</label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-white text-center font-mono focus:outline-none focus:border-zinc-500 rounded-none"
                  />
                </div>
              </div>

              <Button
                type="button"
                onClick={handleAddToCart}
                variant="outline"
                size="sm"
                fullWidth
                disabled={!selectedProductId}
                className="flex items-center gap-1"
              >
                <Plus size={12} /> Agregar al Carrito
              </Button>
            </div>

            {/* Descuento Manual */}
            <div className="border-t border-zinc-900 pt-4">
              <label className="block text-[10px] uppercase tracking-widest text-zinc-400 mb-1.5 font-medium">Descuento Especial (Bs.)</label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
                className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-zinc-500 rounded-none"
              />
            </div>

            {/* Método de Pago */}
            <div className="border-t border-zinc-900 pt-4">
              <label className="block text-[10px] uppercase tracking-widest text-zinc-400 mb-1.5 font-medium">Método de Pago</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPosPaymentMethod('EFECTIVO')}
                  className={`py-2 text-[10px] font-bold tracking-widest uppercase border transition-colors cursor-pointer ${
                    posPaymentMethod === 'EFECTIVO'
                      ? 'border-white bg-white text-black font-semibold'
                      : 'border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  💵 Efectivo
                </button>
                <button
                  type="button"
                  onClick={() => setPosPaymentMethod('QR')}
                  className={`py-2 text-[10px] font-bold tracking-widest uppercase border transition-colors cursor-pointer ${
                    posPaymentMethod === 'QR'
                      ? 'border-white bg-white text-black font-semibold'
                      : 'border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  📱 QR
                </button>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Detalle Carrito y Total */}
          <div className="bg-zinc-900/30 border border-zinc-800 p-4 flex flex-col justify-between">
            <div>
              <h4 className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold border-b border-zinc-800 pb-2 mb-3">Detalle del Pedido</h4>
              
              {cart.length === 0 ? (
                <p className="text-center text-xs text-zinc-600 py-10 uppercase tracking-wider">Carrito vacío</p>
              ) : (
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {cart.map((item, idx) => {
                    const price = Number(item.product.price);
                    return (
                      <div key={item.product.id} className="flex justify-between items-start text-xs border-b border-zinc-900 pb-2">
                        <div>
                          <span className="font-bold text-white uppercase tracking-wider">{item.product.name}</span>
                          <span className="text-[10px] text-zinc-500 block mt-0.5">
                            {item.quantity} x Bs. {price.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white font-mono">Bs. {(price * item.quantity).toFixed(2)}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveFromCart(idx)}
                            className="text-zinc-600 hover:text-red-400"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Totalizadores */}
            <div className="border-t border-zinc-800 pt-4 mt-4 space-y-3">
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-zinc-500">
                  <span>Subtotal</span>
                  <span className="font-mono">Bs. {calculateSubtotal().toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-zinc-400">
                    <span>Descuento</span>
                    <span className="font-mono">-Bs. {discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-white font-bold text-sm border-t border-zinc-900 pt-1.5 uppercase tracking-wide">
                  <span>Total Neto</span>
                  <span className="font-mono text-white">Bs. {calculateTotal().toFixed(2)}</span>
                </div>
              </div>

              {selectedCustomerId && (
                <div className="p-2 bg-white/5 border border-white/10 text-[10px] text-zinc-300 uppercase tracking-widest text-center flex items-center justify-center gap-1.5">
                  <User size={12} /> Otorga: {Math.floor(calculateTotal())} Puntos de Fidelidad
                </div>
              )}

              <Button
                onClick={handleSaleSubmit}
                variant="primary"
                fullWidth
                disabled={cart.length === 0 || submitting}
              >
                {submitting ? 'Facturando...' : 'Cobrar & Registrar'}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* ================= CANJE DE PUNTOS ================= */
        <form onSubmit={handleRedeemSubmit} className="max-w-md mx-auto space-y-5">
          {/* Seleccionar Cliente */}
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-zinc-400 mb-1.5 font-medium">1. Seleccionar Cliente Fiel</label>
            <select
              required
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-500 rounded-none uppercase tracking-wider"
            >
              <option value="">Seleccione el cliente...</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.phone}) — Balance: {c.pointsBalance} PTS
                </option>
              ))}
            </select>
          </div>

          {/* Seleccionar Producto de Canje */}
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-zinc-400 mb-1.5 font-medium">2. Seleccionar Producto para Canje</label>
            <select
              required
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-500 rounded-none uppercase tracking-wider"
            >
              <option value="">Seleccione el producto...</option>
              {products
                .filter((p) => p.pointsCost !== null && p.pointsCost > 0)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — Costo: {p.pointsCost} PTS (Stock: {p.stock})
                  </option>
                ))}
            </select>
          </div>

          {/* Cantidad */}
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-zinc-400 mb-1.5 font-medium">3. Cantidad</label>
            <input
              type="number"
              min="1"
              required
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-zinc-500 rounded-none"
            />
          </div>

          {/* Resumen de Canje */}
          {selectedCustomerId && selectedProductId && (
            <div className="bg-zinc-900 p-4 border border-zinc-800 space-y-2 text-xs">
              {(() => {
                const prod = products.find((p) => p.id === selectedProductId);
                const cust = customers.find((c) => c.id === selectedCustomerId);
                if (!prod || !cust) return null;

                const singleCost = prod.pointsCost || 0;
                const totalCost = singleCost * quantity;
                const hasSufficientPoints = cust.pointsBalance >= totalCost;

                return (
                  <>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Costo Unitario:</span>
                      <span className="font-bold text-white font-mono">{singleCost} PTS</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Costo Total Canje:</span>
                      <span className={`font-bold font-mono ${hasSufficientPoints ? 'text-white' : 'text-red-400'}`}>
                        {totalCost} PTS
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-zinc-800 pt-2 mt-2">
                      <span className="text-zinc-500">Saldo del Cliente:</span>
                      <span className="font-bold text-white font-mono">{cust.pointsBalance} PTS</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Saldo Final:</span>
                      <span className={`font-bold font-mono ${hasSufficientPoints ? 'text-white' : 'text-red-400'}`}>
                        {cust.pointsBalance - totalCost} PTS
                      </span>
                    </div>

                    {!hasSufficientPoints && (
                      <div className="mt-3 p-2 bg-red-950/20 border border-red-900 text-red-400 text-[10px] text-center uppercase tracking-widest font-semibold">
                        ❌ Puntos Insuficientes para realizar el canje
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            fullWidth
            disabled={submitting || (() => {
              if (!selectedCustomerId || !selectedProductId) return true;
              const prod = products.find((p) => p.id === selectedProductId);
              const cust = customers.find((c) => c.id === selectedCustomerId);
              if (!prod || !cust || !prod.pointsCost) return true;
              return cust.pointsBalance < (prod.pointsCost * quantity);
            })()}
          >
            {submitting ? 'Procesando Canje...' : 'Efectuar Canje'}
          </Button>
        </form>
      )}
    </Modal>
  );
};
