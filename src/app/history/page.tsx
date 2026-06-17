"use client";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { collection, getDocs, query, orderBy, Timestamp, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { formatIDR } from "@/app/page";
import { CalendarDays, Loader2, Utensils, ShoppingBag, Edit2, Trash2, X, Check } from "lucide-react";

type Transaction = {
  id: string;
  subTotal: number;
  tax: number;
  total: number;
  orderType: string;
  customerInfo: string;
  createdAt: Timestamp | null;
  items: any[];
};

export default function HistoryPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTrx, setEditingTrx] = useState<Transaction | null>(null);
  const [formData, setFormData] = useState({
    customerInfo: "",
    orderType: "Dine In"
  });

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const q = query(collection(db, "transactions"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const data: Transaction[] = [];
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as Transaction);
      });
      setTransactions(data);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const formatDate = (timestamp: Timestamp | null) => {
    if (!timestamp) return "-";
    return timestamp.toDate().toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const openEditModal = (trx: Transaction) => {
    setEditingTrx(trx);
    setFormData({
      customerInfo: trx.customerInfo,
      orderType: trx.orderType || "Dine In"
    });
    setIsModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTrx || !formData.customerInfo.trim()) return;

    setIsProcessingAction(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulasi delay
      await updateDoc(doc(db, "transactions", editingTrx.id), {
        customerInfo: formData.customerInfo.trim(),
        orderType: formData.orderType
      });
      setIsModalOpen(false);
      setSuccessMessage("Transaksi berhasil diperbarui!");
      fetchTransactions(); // Refresh
    } catch (error) {
      console.error("Error updating transaction:", error);
      alert("Gagal mengupdate transaksi.");
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus riwayat transaksi ini? Data tidak dapat dikembalikan.")) return;
    setIsProcessingAction(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulasi delay
      await deleteDoc(doc(db, "transactions", id));
      setSuccessMessage("Riwayat transaksi berhasil dihapus!");
      fetchTransactions();
    } catch (error) {
      console.error("Error deleting transaction:", error);
      alert("Gagal menghapus transaksi.");
    } finally {
      setIsProcessingAction(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#f8f9fa] w-full relative pb-[72px] lg:pb-0">
      <Sidebar />
      
      <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 lg:mb-8">
          <div>
            <h1 className="text-3xl font-semibold text-zinc-800 tracking-tight mb-1">
              Transaction <span className="font-light text-zinc-500">History</span>
            </h1>
            <p className="text-zinc-500 text-sm">Lihat semua riwayat pesanan yang sudah selesai.</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="bg-white rounded-[2rem] p-12 text-center shadow-sm border border-zinc-100 flex flex-col items-center">
            <div className="w-20 h-20 bg-zinc-50 text-4xl flex items-center justify-center rounded-full mb-4">
              📝
            </div>
            <h3 className="text-xl font-semibold text-zinc-800 mb-2">Belum Ada Transaksi</h3>
            <p className="text-zinc-500">Mulai terima pesanan di halaman Kasir untuk melihat riwayat.</p>
          </div>
        ) : (
          <div className="bg-white rounded-[2rem] shadow-sm border border-zinc-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-100">
                    <th className="px-4 lg:px-6 py-3 lg:py-4 text-sm font-semibold text-zinc-600 whitespace-nowrap">ID / Waktu</th>
                    <th className="px-4 lg:px-6 py-3 lg:py-4 text-sm font-semibold text-zinc-600 whitespace-nowrap">Info Pelanggan</th>
                    <th className="px-4 lg:px-6 py-3 lg:py-4 text-sm font-semibold text-zinc-600 whitespace-nowrap">Tipe Pesanan</th>
                    <th className="px-4 lg:px-6 py-3 lg:py-4 text-sm font-semibold text-zinc-600 text-right">Total</th>
                    <th className="px-4 lg:px-6 py-3 lg:py-4 text-sm font-semibold text-zinc-600 text-center w-24">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {transactions.map((trx) => (
                    <tr key={trx.id} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap">
                        <div className="text-xs font-mono text-zinc-500 mb-1">#{trx.id.slice(0, 8).toUpperCase()}</div>
                        <div className="flex items-center gap-2 text-sm font-medium text-zinc-700">
                          <CalendarDays className="w-4 h-4 text-zinc-400" />
                          {formatDate(trx.createdAt)}
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-zinc-800">{trx.customerInfo}</div>
                        <div className="text-xs text-zinc-500 mt-1">
                          {trx.items?.length || 0} items
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          trx.orderType === "Dine In" 
                            ? "bg-blue-50 text-blue-600" 
                            : "bg-orange-50 text-orange-600"
                        }`}>
                          {trx.orderType === "Dine In" ? <Utensils className="w-3 h-3" /> : <ShoppingBag className="w-3 h-3" />}
                          {trx.orderType || "Dine In"}
                        </span>
                      </td>
                      <td className="px-4 lg:px-6 py-3 lg:py-4 text-right whitespace-nowrap">
                        <div className="text-base font-bold text-zinc-800">{formatIDR(trx.total)}</div>
                      </td>
                      <td className="px-4 lg:px-6 py-3 lg:py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => openEditModal(trx)}
                            className="w-8 h-8 rounded-lg bg-zinc-50 text-zinc-500 hover:bg-blue-50 hover:text-blue-600 flex items-center justify-center transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(trx.id)}
                            className="w-8 h-8 rounded-lg bg-zinc-50 text-zinc-500 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Edit Modal */}
      {isModalOpen && editingTrx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-zinc-100">
              <div>
                <h2 className="text-xl font-bold text-zinc-800">Edit Transaksi</h2>
                <p className="text-xs text-zinc-500 font-mono mt-0.5">#{editingTrx.id.slice(0, 8).toUpperCase()}</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-zinc-600 bg-zinc-100 hover:bg-zinc-200 p-2 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-1">Tipe Pesanan</label>
                <select 
                  value={formData.orderType} 
                  onChange={e => setFormData({...formData, orderType: e.target.value})}
                  className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-zinc-800 appearance-none"
                >
                  <option value="Dine In">Dine In</option>
                  <option value="Take Away">Take Away</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-1">Info Pelanggan (Nama & Meja)</label>
                <input 
                  type="text" required
                  value={formData.customerInfo} 
                  onChange={e => setFormData({...formData, customerInfo: e.target.value})}
                  className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-zinc-800"
                  placeholder="Misal: Budi (Meja 12)"
                />
              </div>

              <div className="pt-6">
                <button type="submit" className="w-full bg-primary hover:bg-primary-hover text-white py-3 rounded-xl font-bold text-lg shadow-lg shadow-primary/30 transition-all hover:-translate-y-0.5 active:translate-y-0">
                  Simpan Perubahan
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
            <p className="text-zinc-500 font-medium text-sm">Menyimpan perubahan ke database,<br/>mohon jangan tutup halaman ini.</p>
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
              onClick={() => setSuccessMessage(null)}
              className="w-full bg-primary hover:bg-primary-hover text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-primary/30 active:scale-[0.98]"
            >
              Lanjutkan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
