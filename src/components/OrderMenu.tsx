"use client";
import { Edit3, Loader2, Trash2, DoorClosed, Printer, Check, ShoppingBag, X } from "lucide-react";
import { useState } from "react";
import { collection, addDoc, serverTimestamp, writeBatch, doc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getCollectionName } from "@/lib/session";
import { CartItem, formatIDR } from "@/app/page";
import { useShift } from "@/context/ShiftContext";

type OrderMenuProps = {
  cartItems: CartItem[];
  setCartItems: React.Dispatch<React.SetStateAction<CartItem[]>>;
};

export default function OrderMenu({ cartItems, setCartItems }: OrderMenuProps) {
  const { shift, isShiftLoading } = useShift();
  const [isCharging, setIsCharging] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [lastOrder, setLastOrder] = useState<any>(null);
  const [orderType, setOrderType] = useState<"Dine In" | "Take Away">("Dine In");
  const [customerName, setCustomerName] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  const subTotal = cartItems.reduce((sum, item) => sum + item.total, 0);
  const tax = subTotal * 0.05; // 5% PB
  const total = subTotal + tax;

  const handleCharge = async () => {
    if (cartItems.length === 0) {
      alert("Pesanan masih kosong!");
      return;
    }

    if (!customerName.trim()) {
      alert("Mohon isi Nama Pelanggan!");
      return;
    }

    if (orderType === "Dine In" && !tableNumber.trim()) {
      alert("Mohon isi Nomor Meja!");
      return;
    }

    const customerData = orderType === "Dine In" 
      ? `${customerName.trim()} (Meja ${tableNumber.trim()})`
      : customerName.trim();

    setIsCharging(true);
    try {
      // Simulasi delay pembayaran nyata (1.5 detik)
      await new Promise(resolve => setTimeout(resolve, 1500));

      const batch = writeBatch(db);
      
      // Simpan data transaksi
      const transactionRef = doc(collection(db, getCollectionName("transactions")));
      batch.set(transactionRef, {
        items: cartItems,
        subTotal,
        tax,
        total,
        orderType,
        customerInfo: customerData,
        createdAt: serverTimestamp(),
      });

      // Kurangi stok produk
      cartItems.forEach(item => {
        if (item.id) {
          const productRef = doc(db, getCollectionName("products"), item.id);
          batch.update(productRef, { stock: increment(-item.qty) });
        }
      });

      await batch.commit();
      
      setLastOrder({
        items: [...cartItems],
        subTotal,
        tax,
        total,
        orderType,
        customerInfo: customerData,
        date: new Date()
      });

      setIsSuccess(true);
      setCartItems([]); // Kosongkan keranjang
      setCustomerName(""); // Reset form
      setTableNumber("");
    } catch (error) {
      console.error("Gagal menyimpan transaksi: ", error);
      alert("Gagal menyimpan ke Firebase. Cek console dan pastikan konfigurasi benar.");
    } finally {
      setIsCharging(false);
    }
  };

  const handleRemove = (cartItemId: string) => {
    setCartItems(prev => prev.filter(item => item.cartItemId !== cartItemId));
  };

  const totalQty = cartItems.reduce((sum, item) => sum + item.qty, 0);

  return (
    <>
    {/* Mobile FAB to open cart */}
    {!isMobileCartOpen && (
      <button 
        onClick={() => setIsMobileCartOpen(true)}
        className="lg:hidden fixed bottom-[88px] right-4 bg-primary text-white p-4 rounded-full shadow-xl shadow-primary/30 z-[40] flex items-center justify-center gap-2 transition-transform active:scale-95 print:hidden"
      >
        <ShoppingBag className="w-6 h-6" />
        {totalQty > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#f8f9fa]">{totalQty}</span>
        )}
      </button>
    )}

    {/* Backdrop for mobile cart */}
    <div 
      className={`lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-[55] transition-opacity duration-300 print:hidden ${isMobileCartOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      onClick={() => setIsMobileCartOpen(false)}
    />

    <aside className={`fixed top-0 right-0 h-screen w-full sm:w-[360px] bg-white shadow-2xl transition-transform duration-300 transform z-[60] lg:translate-x-0 lg:static lg:w-[320px] lg:border-l lg:border-t-0 lg:border-zinc-100 lg:shadow-sm flex flex-col p-4 lg:p-6 print:hidden ${isMobileCartOpen ? "translate-x-0" : "translate-x-full"}`}>
      
      {/* close button for mobile */}
      <button onClick={() => setIsMobileCartOpen(false)} className="lg:hidden absolute top-4 right-4 p-2 bg-zinc-100 hover:bg-zinc-200 rounded-full text-zinc-500 transition-colors z-10">
         <X className="w-5 h-5"/>
      </button>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-zinc-800">
            Order <span className="font-light text-zinc-500">Menu</span>
          </h2>
          {shift ? (
            <p className="text-[10px] text-green-500 font-bold flex items-center gap-1 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> Kasir Buka
            </p>
          ) : (
            <p className="text-[10px] text-red-500 font-bold flex items-center gap-1 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> Kasir Tutup
            </p>
          )}
        </div>
      </div>

      {/* Order Options */}
      <div className="mb-6 space-y-3">
        <div className="flex bg-zinc-50 rounded-lg p-1 border border-zinc-100">
          <button 
            onClick={() => setOrderType("Dine In")}
            className={`flex-1 text-xs font-semibold py-2 rounded-md transition-all ${orderType === "Dine In" ? "bg-white text-primary shadow-sm" : "text-zinc-500 hover:text-zinc-700"}`}
          >
            Dine In
          </button>
          <button 
            onClick={() => setOrderType("Take Away")}
            className={`flex-1 text-xs font-semibold py-2 rounded-md transition-all ${orderType === "Take Away" ? "bg-white text-primary shadow-sm" : "text-zinc-500 hover:text-zinc-700"}`}
          >
            Take Away
          </button>
        </div>
        
        <div className="space-y-2">
          <input 
            type="text"
            placeholder="Nama Pelanggan"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full text-sm py-2 px-3 bg-zinc-50 border border-zinc-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-zinc-700 placeholder:text-zinc-400"
          />
          {orderType === "Dine In" && (
            <input 
              type="number"
              placeholder="Nomor Meja"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              className="w-full text-sm py-2 px-3 bg-zinc-50 border border-zinc-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-zinc-700 placeholder:text-zinc-400"
            />
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-hide">
        {cartItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-zinc-400">
            <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center text-2xl mb-3">
              🍽️
            </div>
            <p className="text-sm font-medium">Belum ada pesanan</p>
          </div>
        ) : (
          cartItems.map((item, idx) => (
            <div key={item.cartItemId} className="flex justify-between items-start group">
              <div className="flex gap-3">
                <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-2xl border border-amber-100 overflow-hidden shrink-0">
                {item.img && item.img.length > 10 ? (
                  <img src={item.img} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  item.img
                )}
              </div>
                <div className="flex flex-col justify-center">
                  <h4 className="font-semibold text-zinc-800 text-sm leading-tight mb-0.5">{item.name}</h4>
                  {item.options && (
                    <div className="text-[10px] text-zinc-500 font-medium mb-1 leading-snug">
                      <p>{item.options.spicy || [item.options.ice, item.options.sugar].filter(Boolean).join(", ")}</p>
                      {item.options.note && <p className="italic text-primary">Catatan: {item.options.note}</p>}
                    </div>
                  )}
                  <p className="text-zinc-500 text-xs font-medium">{formatIDR(item.price)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs font-bold text-zinc-800">x{item.qty}</span>
                <span className="text-sm font-bold text-zinc-800 min-w-[70px] text-right">{formatIDR(item.total)}</span>
                <button 
                  onClick={() => handleRemove(item.cartItemId)}
                  className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-6 border-t border-zinc-100 pt-6 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-zinc-500 font-medium">Sub Total</span>
          <span className="font-bold text-zinc-800">{formatIDR(subTotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-zinc-500 font-medium">PB (5%)</span>
          <span className="font-bold text-zinc-800">{formatIDR(tax)}</span>
        </div>
        
        <button 
          onClick={handleCharge}
          disabled={!shift || cartItems.length === 0 || isCharging || isSuccess}
          className={`w-full mt-4 py-4 rounded-2xl font-bold text-lg shadow-lg transition-all active:scale-[0.98] ${
            isSuccess 
              ? "bg-green-500 text-white shadow-green-500/30" 
              : !shift || cartItems.length === 0
                ? "bg-zinc-100 text-zinc-400 shadow-none cursor-not-allowed"
                : "bg-primary hover:bg-primary-hover text-white shadow-primary/30 hover:-translate-y-0.5"
          }`}
        >
          {isSuccess ? (
            "Berhasil!"
          ) : isCharging ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Memproses...
            </div>
          ) : (
            `Charge ${formatIDR(total)}`
          )}
        </button>
      </div>
    </aside>

    {/* Processing Payment Modal */}
    {isCharging && (
      <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 print:hidden">
        <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden p-8 text-center flex flex-col items-center justify-center animate-in fade-in duration-200">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-zinc-800 mb-2">Memproses...</h2>
          <p className="text-zinc-500 font-medium text-sm">Menghubungkan ke server pembayaran,<br/>mohon jangan tutup halaman ini.</p>
        </div>
      </div>
    )}

    {/* Success & Print Modal */}
    {isSuccess && lastOrder && (
      <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 print:hidden">
        <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-8 text-center">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-zinc-800 mb-2">Transaksi Berhasil!</h2>
          <p className="text-zinc-500 mb-6 font-medium">Total pembayaran: <span className="font-bold text-zinc-800">{formatIDR(lastOrder.total)}</span></p>
          
          <div className="flex gap-3">
            <button 
              onClick={() => window.print()}
              className="flex-1 bg-zinc-800 hover:bg-zinc-900 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg active:scale-[0.98]"
            >
              <Printer className="w-4 h-4" /> Cetak Struk
            </button>
            <button 
              onClick={() => { setIsSuccess(false); setLastOrder(null); }}
              className="flex-1 bg-primary hover:bg-primary-hover text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-primary/30 active:scale-[0.98]"
            >
              Pesanan Baru
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Hidden Print Receipt */}
    {lastOrder && (
      <div className="hidden print:block fixed inset-0 bg-white z-[500] p-8 text-black" style={{ width: "80mm", margin: "0 auto" }}>
        <div className="text-center mb-6">
          <h1 className="text-2xl font-black mb-1">Nusantara POS</h1>
          <p className="text-xs text-zinc-500 font-medium">Sistem Kasir Digital Terdepan</p>
          <p className="text-xs text-zinc-500 font-medium mt-1">Telp: 08123456789</p>
        </div>
        
        <div className="border-b-2 border-dashed border-zinc-300 pb-4 mb-4 text-xs font-medium space-y-1">
          <div className="flex justify-between">
            <span>Waktu:</span>
            <span>{lastOrder.date.toLocaleString("id-ID")}</span>
          </div>
          <div className="flex justify-between">
            <span>Pelanggan:</span>
            <span>{lastOrder.customerInfo || "Umum"}</span>
          </div>
          <div className="flex justify-between">
            <span>Tipe Pesanan:</span>
            <span>{lastOrder.orderType}</span>
          </div>
        </div>

        <div className="border-b-2 border-dashed border-zinc-300 pb-4 mb-4">
          {lastOrder.items.map((item: any, idx: number) => (
            <div key={idx} className="mb-3 text-xs">
              <div className="flex justify-between font-bold text-zinc-800 mb-1">
                <span>{item.name}</span>
                <span>{formatIDR(item.total)}</span>
              </div>
              <div className="text-zinc-600 font-medium">
                {item.qty} x {formatIDR(item.price)}
              </div>
              {item.options && (
                <div className="text-zinc-500 italic text-[10px] mt-0.5">
                  - {item.options.spicy || [item.options.ice, item.options.sugar].filter(Boolean).join(", ")}
                  {item.options.note && ` | Catatan: ${item.options.note}`}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="text-xs space-y-1 mb-6 font-medium text-zinc-600">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatIDR(lastOrder.subTotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>PB (5%)</span>
            <span>{formatIDR(lastOrder.tax)}</span>
          </div>
          <div className="flex justify-between font-bold text-sm mt-3 pt-3 border-t border-zinc-800 text-zinc-800">
            <span>TOTAL</span>
            <span>{formatIDR(lastOrder.total)}</span>
          </div>
        </div>

        <div className="text-center text-xs font-medium text-zinc-500">
          <p>Terima kasih atas kunjungan Anda!</p>
          <p className="mt-2">======================</p>
        </div>
      </div>
    )}
    </>
  );
}

