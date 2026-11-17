import React, { useState } from 'react';
import {
  ShoppingBag,
  Search,
  Plus,
  Minus,
  Trash2,
  Printer,
  CreditCard,
  Banknote,
  QrCode,
  CheckCircle2,
  DollarSign,
  User,
  ArrowRight,
  Receipt
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { CounterSale, Item } from '../../types/erp';

export const CounterModule: React.FC = () => {
  const {
    items,
    counterSales,
    checkoutCounter,
    activeCompany,
    currentUser
  } = useERP();

  const [cart, setCart] = useState<{ item: Item; quantity: number; unitPrice: number }[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMode, setPaymentMode] = useState<'cash' | 'upi' | 'card'>('cash');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState<CounterSale | null>(null);
  const [cashTendered, setCashTendered] = useState<number | ''>('');

  const handleAddToCart = (item: Item) => {
    setCart(prev => {
      const existing = prev.find(i => i.item.id === item.id);
      if (existing) {
        return prev.map(i => i.item.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { item, quantity: 1, unitPrice: item.standardCost || 100 }];
    });
  };

  const handleUpdateQty = (itemId: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.item.id !== itemId) return i;
      const newQty = Math.max(1, i.quantity + delta);
      return { ...i, quantity: newQty };
    }));
  };

  const handleRemoveFromCart = (itemId: string) => {
    setCart(prev => prev.filter(i => i.item.id !== itemId));
  };

  // Cart calculations
  const subtotal = cart.reduce((sum, i) => sum + (i.quantity * i.unitPrice), 0);
  const tax = subtotal * 0.18; // 18% standard GST
  const grandTotal = Math.round(subtotal + tax);
  const changeDue = typeof cashTendered === 'number' && cashTendered >= grandTotal ? cashTendered - grandTotal : 0;

  const handleCompleteSale = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);
    try {
      const sale = await checkoutCounter({
        customerName: customerName.trim() || 'Walk-in Customer',
        customerPhone: customerPhone.trim() || undefined,
        items: cart.map(i => ({
          itemId: i.item.id,
          itemCode: i.item.itemCode,
          itemName: i.item.name,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          taxRate: 18,
          total: i.quantity * i.unitPrice
        })),
        subtotal,
        discountAmount: 0,
        gstAmount: tax,
        totalAmount: grandTotal,
        paymentMode,
        cashierName: currentUser?.name || 'Counter Operator',
        cashTendered: typeof cashTendered === 'number' ? cashTendered : grandTotal,
        changeReturned: changeDue
      });

      setActiveReceipt(sale);
      setCart([]);
      setCustomerName('Walk-in Customer');
      setCustomerPhone('');
      setCashTendered('');
    } catch (err: any) {
      alert(`Sale failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredItems = items.filter(it =>
    it.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    it.itemCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const todaySalesTotal = counterSales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-canvas border-b border-hairline pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-ink-nav mb-1">
            <span>Sales & Commercial</span>
            <span>/</span>
            <span className="text-primary font-medium">Counter Express Billing</span>
          </div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">Counter POS & Express Billing</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-chrome rounded border border-hairline text-right">
            <span className="text-[10px] text-ink-nav block">Today's Counter Revenue</span>
            <span className="text-sm font-bold font-mono text-primary">₹{todaySalesTotal.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Item Catalog & Quick Add (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-canvas border border-hairline rounded-md p-3 flex items-center gap-2">
            <Search className="w-4 h-4 text-ink-nav shrink-0" />
            <input
              type="text"
              placeholder="Search items by code, name, or scan barcode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs bg-transparent focus:outline-none text-ink"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filteredItems.slice(0, 12).map((item) => (
              <div
                key={item.id}
                onClick={() => handleAddToCart(item)}
                className="p-3 bg-canvas border border-hairline rounded-md hover:border-primary/50 cursor-pointer transition-all hover:shadow-xs flex flex-col justify-between"
              >
                <div>
                  <span className="text-[10px] font-mono text-ink-meta uppercase">{item.itemCode}</span>
                  <div className="text-xs font-semibold text-ink mt-0.5 line-clamp-1">{item.name}</div>
                  <div className="text-[10px] text-ink-nav capitalize">{item.category}</div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-hairline">
                  <span className="text-xs font-bold font-mono text-primary">
                    ₹{(item.standardCost || 100).toFixed(2)}
                  </span>
                  <button
                    type="button"
                    className="p-1 rounded bg-chrome hover:bg-primary hover:text-white transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Active Cart & Checkout (5 cols) */}
        <div className="lg:col-span-5 bg-canvas border border-hairline rounded-md flex flex-col h-[650px] shadow-xs">
          {/* Cart Header */}
          <div className="p-3 bg-chrome border-b border-hairline flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold text-ink">Active Register Cart</span>
            </div>
            <span className="text-[11px] font-mono text-ink-nav">{cart.length} items</span>
          </div>

          {/* Customer Input Strip */}
          <div className="p-3 border-b border-hairline bg-chrome/30 grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="block text-[10px] text-ink-nav mb-0.5">Customer Name</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full text-xs px-2 py-1 bg-canvas border border-hairline rounded text-ink"
              />
            </div>
            <div>
              <label className="block text-[10px] text-ink-nav mb-0.5">Mobile / UPI Phone</label>
              <input
                type="tel"
                placeholder="9876543210"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full text-xs px-2 py-1 bg-canvas border border-hairline rounded text-ink"
              />
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-3 divide-y divide-hairline">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-ink-meta text-xs">
                <ShoppingBag className="w-8 h-8 opacity-40 mb-2" />
                <span>Cart is empty. Select items to bill.</span>
              </div>
            ) : (
              cart.map((i) => (
                <div key={i.item.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex-1 pr-2">
                    <div className="font-semibold text-ink line-clamp-1">{i.item.name}</div>
                    <div className="text-[10px] text-ink-nav font-mono">
                      ₹{i.unitPrice} × {i.quantity} = ₹{(i.unitPrice * i.quantity).toFixed(2)}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleUpdateQty(i.item.id, -1)}
                      className="p-1 rounded bg-chrome hover:bg-surface-2 border border-hairline"
                    >
                      <Minus className="w-3 h-3 text-ink-nav" />
                    </button>
                    <span className="font-mono font-bold text-xs w-6 text-center">{i.quantity}</span>
                    <button
                      onClick={() => handleUpdateQty(i.item.id, 1)}
                      className="p-1 rounded bg-chrome hover:bg-surface-2 border border-hairline"
                    >
                      <Plus className="w-3 h-3 text-ink-nav" />
                    </button>
                    <button
                      onClick={() => handleRemoveFromCart(i.item.id)}
                      className="p-1 text-red-500 hover:text-red-700 ml-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Payment Mode Selector & Totals */}
          <div className="p-3 border-t border-hairline bg-chrome/40 space-y-3">
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-ink-body">
                <span>Taxable Items Subtotal:</span>
                <span className="font-mono">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-ink-nav text-[11px]">
                <span>GST (18% Total):</span>
                <span className="font-mono">₹{tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-ink border-t border-hairline pt-1">
                <span>Grand Payable Total:</span>
                <span className="font-mono text-primary">₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Mode of Payment */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMode('cash')}
                className={`py-1.5 px-2 text-xs font-semibold rounded border flex items-center justify-center gap-1 cursor-pointer transition-colors ${paymentMode === 'cash' ? 'bg-primary text-white border-primary' : 'bg-canvas text-ink-nav border-hairline'
                  }`}
              >
                <Banknote className="w-3.5 h-3.5" />
                <span>Cash</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMode('upi')}
                className={`py-1.5 px-2 text-xs font-semibold rounded border flex items-center justify-center gap-1 cursor-pointer transition-colors ${paymentMode === 'upi' ? 'bg-primary text-white border-primary' : 'bg-canvas text-ink-nav border-hairline'
                  }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>UPI QR</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMode('card')}
                className={`py-1.5 px-2 text-xs font-semibold rounded border flex items-center justify-center gap-1 cursor-pointer transition-colors ${paymentMode === 'card' ? 'bg-primary text-white border-primary' : 'bg-canvas text-ink-nav border-hairline'
                  }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Card</span>
              </button>
            </div>

            {/* Cash Tendered Input if Cash selected */}
            {paymentMode === 'cash' && cart.length > 0 && (
              <div className="grid grid-cols-2 gap-2 text-xs bg-canvas p-2 border border-hairline rounded">
                <div>
                  <span className="text-[10px] text-ink-nav">Cash Received (₹)</span>
                  <input
                    type="number"
                    placeholder="Tendered"
                    value={cashTendered}
                    onChange={(e) => setCashTendered(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full text-xs font-mono p-1 border border-hairline rounded text-ink"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-ink-nav">Change Return (₹)</span>
                  <div className="text-xs font-mono font-bold text-emerald-600 p-1">
                    ₹{changeDue.toFixed(2)}
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleCompleteSale}
              disabled={cart.length === 0 || isProcessing}
              className="btn-primary w-full py-2.5 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>{isProcessing ? 'Processing Receipt...' : `Complete Sale & Print Receipt (₹${grandTotal})`}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 80mm Thermal Receipt Print Modal */}
      {activeReceipt && (
        <div className="fixed inset-0 bg-ink/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-canvas border border-hairline rounded-md max-w-sm w-full p-4 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-hairline pb-2">
              <span className="text-xs font-bold text-ink">Retail Sale Complete</span>
              <button onClick={() => setActiveReceipt(null)} className="text-ink-nav hover:text-ink cursor-pointer">
                ✕
              </button>
            </div>

            {/* Thermal Print Slip View */}
            <div className="p-4 bg-white border border-hairline text-ink font-mono text-xs space-y-3 shadow-inner">
              <div className="text-center space-y-0.5">
                <div className="font-bold text-sm uppercase">{activeCompany?.name || 'Codozent One'}</div>
                <div className="text-[10px] text-ink-meta">{activeCompany?.address || 'Industrial Area'}</div>
                <div className="text-[10px] text-ink-meta">GSTIN: {activeCompany?.gstin || '27AAACP0123M1Z5'}</div>
                <div className="border-b border-dashed border-hairline my-2"></div>
                <div className="text-xs font-bold">RETAIL TAX RECEIPT</div>
                <div className="text-[10px] text-ink-nav">{activeReceipt.receiptNumber}</div>
                <div className="text-[10px] text-ink-meta">Date: {activeReceipt.timestamp ? activeReceipt.timestamp.split('T')[0] : 'Today'}</div>
              </div>

              <div className="border-b border-dashed border-hairline"></div>

              <div className="space-y-1">
                {activeReceipt.items?.map((it, idx) => (
                  <div key={idx} className="flex justify-between text-[11px]">
                    <span className="line-clamp-1">{it.itemName} × {it.quantity}</span>
                    <span>₹{it.total.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-b border-dashed border-hairline"></div>

              <div className="space-y-0.5 text-[11px]">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{activeReceipt.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST (18%):</span>
                  <span>₹{activeReceipt.gstAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-xs pt-1 border-t border-hairline">
                  <span>GRAND TOTAL:</span>
                  <span>₹{activeReceipt.totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[10px] text-ink-meta pt-0.5">
                  <span>Mode:</span>
                  <span className="uppercase">{activeReceipt.paymentMode}</span>
                </div>
              </div>

              <div className="border-b border-dashed border-hairline"></div>
              <div className="text-center text-[10px] text-ink-meta">
                Thank you for your business!<br />GST Invoice generated under MSME Act.
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="btn-outline flex-1 text-xs py-2 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print 80mm Slip</span>
              </button>
              <button
                onClick={() => setActiveReceipt(null)}
                className="btn-primary flex-1 text-xs py-2 cursor-pointer"
              >
                New Transaction
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
