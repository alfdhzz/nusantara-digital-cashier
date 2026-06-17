"use client";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { formatIDR } from "@/app/page";
import { Loader2, Plus, Edit2, Trash2, X, Search, Check } from "lucide-react";

export type Product = {
  id?: string;
  name: string;
  price: number;
  img: string;
  category: string;
  isNew?: boolean;
  stock: number;
};

const categoryEmojis: Record<string, string> = {
  "Rekomendasi": "⭐",
  "Nasi": "🍚",
  "Mie": "🍜",
  "Lauk Pauk": "🍗",
  "Sayuran": "🥗",
  "Camilan": "🥟",
  "Minuman": "🥤",
  "Dessert": "🍮"
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    img: "🍚",
    category: "Nasi",
    isNew: false,
    stock: "50"
  });

  const categories = Object.keys(categoryEmojis);

  const formatInputPrice = (val: string) => {
    if (!val) return "";
    return val.replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "products"));
      const data: Product[] = [];
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as Product);
      });
      // Sort products by name alphabetically
      data.sort((a, b) => a.name.localeCompare(b.name));
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingId(product.id || null);
      setFormData({
        name: product.name,
        price: product.price.toString(),
        img: product.img,
        category: product.category,
        isNew: product.isNew || false,
        stock: product.stock?.toString() || "0"
      });
    } else {
      setEditingId(null);
      setFormData({ name: "", price: "", img: "🍚", category: "Nasi", isNew: false, stock: "50" });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price) return;

    const productData = {
      name: formData.name,
      price: parseInt(formData.price),
      img: formData.img,
      category: formData.category,
      isNew: formData.isNew,
      stock: parseInt(formData.stock) || 0
    };

    setIsProcessingAction(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulasi delay
      if (editingId) {
        await updateDoc(doc(db, "products", editingId), productData);
        setSuccessMessage("Produk berhasil diperbarui!");
      } else {
        await addDoc(collection(db, "products"), productData);
        setSuccessMessage("Produk berhasil ditambahkan!");
      }
      handleCloseModal();
      fetchProducts();
    } catch (error) {
      console.error("Error saving product:", error);
      alert("Gagal menyimpan produk.");
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus produk ini?")) return;
    setIsProcessingAction(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulasi delay
      await deleteDoc(doc(db, "products", id));
      setSuccessMessage("Produk berhasil dihapus!");
      fetchProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Gagal menghapus produk.");
    } finally {
      setIsProcessingAction(false);
    }
  };

  const displayedProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#f8f9fa] w-full relative pb-[72px] lg:pb-0">
      <Sidebar />
      
      <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 lg:gap-0 mb-8">
          <div>
            <h1 className="text-2xl lg:text-3xl font-semibold text-zinc-800 tracking-tight mb-1">
              Kelola <span className="font-light text-zinc-500">Produk</span>
            </h1>
            <p className="text-zinc-500 text-sm">Tambah, edit, atau hapus menu makanan & minuman.</p>
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="w-full lg:w-auto justify-center bg-primary hover:bg-primary-hover text-white px-5 py-3 lg:py-2.5 rounded-xl lg:rounded-full font-semibold text-sm flex items-center gap-2 shadow-lg shadow-primary/30 transition-all hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" /> Tambah Produk
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-6 relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-zinc-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-4 py-3 bg-white border border-zinc-100 rounded-2xl text-sm shadow-sm placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-zinc-700"
            placeholder="Cari produk berdasarkan nama..."
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
        ) : (
          <div className="bg-white rounded-[2rem] shadow-sm border border-zinc-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-100">
                    <th className="px-4 lg:px-6 py-3 lg:py-4 text-sm font-semibold text-zinc-600 w-16 lg:w-20">Ikon</th>
                    <th className="px-4 lg:px-6 py-3 lg:py-4 text-sm font-semibold text-zinc-600 whitespace-nowrap">Nama Produk</th>
                    <th className="px-4 lg:px-6 py-3 lg:py-4 text-sm font-semibold text-zinc-600 whitespace-nowrap">Kategori</th>
                    <th className="px-4 lg:px-6 py-3 lg:py-4 text-sm font-semibold text-zinc-600">Stok</th>
                    <th className="px-4 lg:px-6 py-3 lg:py-4 text-sm font-semibold text-zinc-600">Harga</th>
                    <th className="px-4 lg:px-6 py-3 lg:py-4 text-sm font-semibold text-zinc-600 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {displayedProducts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                        {searchQuery 
                          ? `Tidak ada produk yang cocok dengan "${searchQuery}"`
                          : "Belum ada produk. Silakan tambahkan produk baru."}
                      </td>
                    </tr>
                  ) : (
                    displayedProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-zinc-50/50 transition-colors">
                        <td className="px-4 lg:px-6 py-3 lg:py-4">
                          <div className="w-10 h-10 lg:w-12 lg:h-12 bg-amber-50 rounded-xl flex items-center justify-center text-xl lg:text-2xl border border-amber-100/50 overflow-hidden">
                            {p.img && p.img.length > 10 ? (
                              <img src={p.img} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              p.img
                            )}
                          </div>
                        </td>
                        <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap">
                          <div className="font-semibold text-zinc-800 flex items-center gap-2">
                            {p.name}
                            {p.isNew && (
                              <span className="bg-primary text-white text-[10px] px-2 py-0.5 rounded-full font-bold">New</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-zinc-600 bg-zinc-100 px-3 py-1 rounded-full">
                            {p.category}
                          </span>
                        </td>
                        <td className="px-4 lg:px-6 py-3 lg:py-4">
                          <span className={`text-sm font-bold ${p.stock <= 5 ? "text-red-500" : "text-zinc-600"}`}>
                            {p.stock}
                          </span>
                        </td>
                        <td className="px-4 lg:px-6 py-3 lg:py-4 font-bold text-zinc-800">
                          {formatIDR(p.price)}
                        </td>
                        <td className="px-4 lg:px-6 py-3 lg:py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => handleOpenModal(p)}
                              className="w-8 h-8 rounded-lg bg-zinc-50 text-zinc-500 hover:bg-blue-50 hover:text-blue-600 flex items-center justify-center transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => p.id && handleDelete(p.id)}
                              className="w-8 h-8 rounded-lg bg-zinc-50 text-zinc-500 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-zinc-100">
              <h2 className="text-xl font-bold text-zinc-800">{editingId ? "Edit Produk" : "Tambah Produk"}</h2>
              <button onClick={handleCloseModal} className="text-zinc-400 hover:text-zinc-600 bg-zinc-100 hover:bg-zinc-200 p-2 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-1">Nama Produk</label>
                <input 
                  type="text" required
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-zinc-800"
                  placeholder="Misal: Cheese Burger"
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
                  <label className="block text-sm font-semibold text-zinc-700 mb-1">Harga (Rp)</label>
                  <input 
                    type="text" required
                    value={formatInputPrice(formData.price)} 
                    onChange={e => setFormData({...formData, price: e.target.value.replace(/\D/g, "")})}
                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-zinc-800"
                    placeholder="45.000"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-semibold text-zinc-700 mb-1">Stok</label>
                  <input 
                    type="number" required min="0"
                    value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})}
                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-zinc-800"
                    placeholder="50"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-semibold text-zinc-700 mb-1">Ikon Emoji</label>
                  <input 
                    type="text" required
                    value={formData.img} onChange={e => setFormData({...formData, img: e.target.value})}
                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-zinc-800"
                    placeholder="🍚"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-1">Kategori</label>
                <select 
                  value={formData.category} 
                  onChange={e => {
                    const newCategory = e.target.value;
                    setFormData({
                      ...formData, 
                      category: newCategory,
                      img: categoryEmojis[newCategory] || "🍔" // Auto-update emoji
                    });
                  }}
                  className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-zinc-800 appearance-none"
                >
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input 
                  type="checkbox" id="isNew"
                  checked={formData.isNew} onChange={e => setFormData({...formData, isNew: e.target.checked})}
                  className="w-4 h-4 rounded border-zinc-300 text-primary focus:ring-primary/20"
                />
                <label htmlFor="isNew" className="text-sm font-medium text-zinc-700 cursor-pointer">Tandai sebagai produk "Baru"</label>
              </div>

              <div className="pt-6">
                <button type="submit" className="w-full bg-primary hover:bg-primary-hover text-white py-3 rounded-xl font-bold text-lg shadow-lg shadow-primary/30 transition-all hover:-translate-y-0.5 active:translate-y-0">
                  Simpan Produk
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
