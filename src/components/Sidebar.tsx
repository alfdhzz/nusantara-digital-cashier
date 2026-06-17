"use client";
import { Store, PieChart, Settings, LogOut, ClipboardList, Package, DoorOpen, DoorClosed, X, Loader2, Check } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useShift } from "@/context/ShiftContext";
import { collection, addDoc, serverTimestamp, query, where, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getCollectionName } from "@/lib/session";

export default function Sidebar() {
  const pathname = usePathname();
  const { shift, isShiftLoading } = useShift();

  const [isOpenModalOpen, setIsOpenModalOpen] = useState(false);
  const [openingBalance, setOpeningBalance] = useState("");

  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [closingBalance, setClosingBalance] = useState("");
  const [shiftSummary, setShiftSummary] = useState<any>(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const menuItems = [
    { icon: Store, label: "Kasir", href: "/" },
    { icon: ClipboardList, label: "History", href: "/history" },
    { icon: PieChart, label: "Report", href: "/report" },
    { icon: Package, label: "Products", href: "/products" },
  ];

  const formatIDR = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleBalanceChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string>>) => {
    const rawValue = e.target.value.replace(/\D/g, "");
    if (!rawValue) {
      setter("");
      return;
    }
    const formattedValue = new Intl.NumberFormat("id-ID").format(Number(rawValue));
    setter(formattedValue);
  };

  const parseNumber = (val: string) => Number(val.replace(/\D/g, ""));

  const handleOpenCashier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!openingBalance) return;
    const numericBalance = parseNumber(openingBalance);
    
    setIsProcessingAction(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulasi delay
      await addDoc(collection(db, getCollectionName("shifts")), {
        status: "open",
        openedAt: serverTimestamp(),
        openingBalance: numericBalance,
      });
      setIsOpenModalOpen(false);
      setOpeningBalance("");
      setSuccessMessage("Shift Kasir Berhasil Dibuka!");
    } catch (error) {
      console.error(error);
      alert("Gagal membuka kasir.");
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handlePrepareClose = async () => {
    if (!shift?.openedAt) return;
    setIsProcessingAction(true); 
    try {
      const q = query(
        collection(db, getCollectionName("transactions")), 
        where("createdAt", ">=", shift.openedAt)
      );
      const snapshot = await getDocs(q);
      let sales = 0;
      snapshot.forEach(docData => { sales += docData.data().total });
      
      setShiftSummary({
        sales,
        expected: shift.openingBalance + sales
      });
      setIsCloseModalOpen(true);
    } catch (error) {
      console.error(error);
      alert("Gagal memuat data transaksi.");
    } finally {
      setIsProcessingAction(false);
    }
  }

  const handleCloseCashier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!closingBalance) return;
    const numericClosing = parseNumber(closingBalance);
    
    setIsProcessingAction(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulasi delay
      await updateDoc(doc(db, getCollectionName("shifts"), shift.id), {
        status: "closed",
        closedAt: serverTimestamp(),
        closingBalance: numericClosing,
        totalSales: shiftSummary.sales,
        difference: numericClosing - shiftSummary.expected
      });
      setIsCloseModalOpen(false);
      setClosingBalance("");
      setSuccessMessage("Shift Kasir Berhasil Ditutup!");
    } catch (error) {
      console.error(error);
      alert("Gagal menutup kasir.");
    } finally {
      setIsProcessingAction(false);
    }
  }

  return (
    <>
      <aside className="fixed bottom-0 left-0 right-0 w-full lg:w-24 lg:static bg-white border-t lg:border-t-0 lg:border-r border-zinc-100 flex lg:flex-col items-center py-2 lg:py-6 h-[72px] lg:h-screen lg:sticky lg:top-0 z-50 print:hidden justify-around lg:justify-start">
        {/* Logo Placeholder */}
        <div className="hidden lg:flex flex-col items-center mb-8">
          <Image 
            src="/logo.png" 
            alt="Nusantara POS Logo" 
            width={48} 
            height={48} 
            className="rounded-xl shadow-sm mb-1.5"
            priority
          />
          <span className="text-[9px] font-bold text-zinc-400 tracking-widest uppercase">POS</span>
        </div>

        <nav className="flex flex-row lg:flex-col gap-2 lg:gap-6 items-center w-full justify-around lg:justify-start px-2 lg:px-0 flex-1 lg:flex-none">
          {menuItems.map((item, idx) => {
            const isActive = pathname === item.href;
            return (
              <Link
                href={item.href}
                key={idx}
                className={`flex flex-col items-center justify-center w-14 h-14 lg:w-16 lg:h-16 rounded-2xl transition-all duration-200 group ${
                  isActive
                    ? "bg-primary text-white shadow-lg shadow-primary/30"
                    : "text-zinc-400 hover:bg-zinc-50 hover:text-primary"
                }`}
              >
                <item.icon className={`w-5 h-5 lg:w-6 lg:h-6 mb-1 ${isActive ? "text-white" : "group-hover:text-primary"}`} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[9px] lg:text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex flex-col gap-2 lg:mt-auto px-2 lg:px-0">
          {!isShiftLoading && shift && (
            <button 
              onClick={handlePrepareClose}
              className="flex flex-col items-center justify-center w-14 h-14 lg:w-16 lg:h-16 rounded-2xl text-red-500 bg-red-50 hover:bg-red-500 hover:text-white transition-all duration-200 group shadow-sm"
              title="Tutup Kasir"
            >
              <DoorClosed className="w-5 h-5 lg:w-6 lg:h-6 mb-1" strokeWidth={2.5} />
              <span className="text-[9px] lg:text-[10px] font-bold text-center leading-tight">Tutup<br/>Kasir</span>
            </button>
          )}
        </div>
      </aside>

      {/* FULL SCREEN LOCK SCREEN OR LOADING SCREEN */}
      {(!shift || isShiftLoading) && (
        <div className="fixed inset-0 z-[200] bg-[#f8f9fa] flex flex-col items-center justify-center p-6 text-center">
          {isShiftLoading ? (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-12 h-12 animate-spin text-primary opacity-60" />
              <p className="text-zinc-400 font-medium text-sm animate-pulse">Menyiapkan sistem kasir...</p>
            </div>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 mb-12 sm:mb-16 animate-in slide-in-from-bottom-4 fade-in duration-500">
                <Image 
                  src="/logo.png" 
                  alt="Nusantara POS Logo" 
                  width={80} 
                  height={80} 
                  className="rounded-3xl shadow-xl shadow-primary/30 w-16 h-16 sm:w-20 sm:h-20"
                  priority
                />
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-zinc-800 tracking-tight text-center sm:text-left">
                  Nusantara <span className="text-primary font-light">POS</span>
                </h1>
              </div>
              
              <button 
                onClick={() => setIsOpenModalOpen(true)}
                className="bg-green-500 hover:bg-green-600 text-white px-10 py-5 rounded-full font-bold text-xl shadow-xl shadow-green-500/30 transition-all hover:-translate-y-1 active:translate-y-0 flex items-center gap-3 animate-in slide-in-from-bottom-8 fade-in duration-700 delay-150"
              >
                <DoorOpen className="w-7 h-7" /> Buka Shift Kasir
              </button>
            </>
          )}
        </div>
      )}

      {/* Modal Buka Kasir */}
      {isOpenModalOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-zinc-100">
              <h2 className="text-xl font-bold text-zinc-800">Buka Kasir</h2>
              <button onClick={() => setIsOpenModalOpen(false)} className="text-zinc-400 hover:text-zinc-600 bg-zinc-100 hover:bg-zinc-200 p-2 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleOpenCashier} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-1">Saldo Awal (Uang Laci)</label>
                <input 
                  type="text" required
                  value={openingBalance} 
                  onChange={e => handleBalanceChange(e, setOpeningBalance)}
                  className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-zinc-800"
                  placeholder="Contoh: 100.000"
                />
              </div>
              <div className="pt-4">
                <button type="submit" className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-bold text-lg shadow-lg shadow-green-500/30 transition-all hover:-translate-y-0.5 active:translate-y-0">
                  Buka Shift Sekarang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tutup Kasir */}
      {isCloseModalOpen && shiftSummary && shift && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-zinc-100">
              <h2 className="text-xl font-bold text-zinc-800">Tutup Kasir</h2>
              <button onClick={() => setIsCloseModalOpen(false)} className="text-zinc-400 hover:text-zinc-600 bg-zinc-100 hover:bg-zinc-200 p-2 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 bg-zinc-50/50 border-b border-zinc-100 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500 font-medium">Saldo Awal</span>
                <span className="font-bold text-zinc-800">{formatIDR(shift.openingBalance)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500 font-medium">Penjualan Shift Ini</span>
                <span className="font-bold text-zinc-800">+{formatIDR(shiftSummary.sales)}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-zinc-200">
                <span className="text-zinc-700 font-bold">Ekspektasi Uang di Laci</span>
                <span className="font-bold text-primary">{formatIDR(shiftSummary.expected)}</span>
              </div>
            </div>
            <form onSubmit={handleCloseCashier} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-1">Hitung Uang Aktual (Real)</label>
                <input 
                  type="text" required
                  value={closingBalance} 
                  onChange={e => handleBalanceChange(e, setClosingBalance)}
                  className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-zinc-800"
                  placeholder="Masukkan jumlah uang saat ini"
                />
                {closingBalance && (
                  <p className={`text-xs mt-2 font-medium ${parseNumber(closingBalance) === shiftSummary.expected ? "text-green-600" : "text-red-500"}`}>
                    Selisih: {formatIDR(parseNumber(closingBalance) - shiftSummary.expected)}
                  </p>
                )}
              </div>
              <div className="pt-4">
                <button 
                  type="submit" 
                  disabled={isProcessingAction}
                  className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-bold text-lg shadow-lg shadow-red-500/30 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:bg-zinc-300 disabled:shadow-none"
                >
                  Tutup Shift Sekarang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Processing Modal */}
      {isProcessingAction && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden p-8 text-center flex flex-col items-center justify-center animate-in fade-in duration-200">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-zinc-800 mb-2">Memproses...</h2>
            <p className="text-zinc-500 font-medium text-sm">Berinteraksi dengan database,<br/>mohon tunggu sebentar.</p>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {successMessage && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-8 text-center">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-zinc-800 mb-2">Berhasil!</h2>
            <p className="text-zinc-500 mb-6 font-medium">{successMessage}</p>
            <button 
              onClick={() => { setSuccessMessage(null); if (successMessage.includes("Ditutup")) window.location.reload(); }}
              className="w-full bg-primary hover:bg-primary-hover text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-primary/30 active:scale-[0.98]"
            >
              Lanjutkan
            </button>
          </div>
        </div>
      )}
    </>
  );
}

