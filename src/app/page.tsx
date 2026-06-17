"use client";
import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import OrderMenu from "@/components/OrderMenu";
import { Search, ChevronDown, Loader2, Plus, Minus, X } from "lucide-react";
import { collection, getDocs, addDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export type Product = {
  id?: string;
  name: string;
  price: number;
  img: string;
  category: string;
  isNew?: boolean;
  stock: number;
};

export type CartItem = Product & {
  cartItemId: string;
  qty: number;
  total: number;
  options?: {
    spicy?: string;
    ice?: string;
    sugar?: string;
  };
};

export const formatIDR = (price: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

const initialProducts: Product[] = [
  // Nasi
  { name: "Nasi Goreng Spesial", price: 35000, img: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&q=80&v=3", category: "Nasi", isNew: true, stock: 50 },
  { name: "Nasi Goreng Seafood", price: 40000, img: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&q=80&v=3", category: "Nasi", stock: 50 },
  { name: "Nasi Gila", price: 35000, img: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&q=80&v=3", category: "Nasi", stock: 50 },
  { name: "Nasi Bakar Ayam", price: 25000, img: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400&q=80&v=3", category: "Nasi", stock: 50 },
  { name: "Nasi Putih", price: 8000, img: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&q=80&v=3", category: "Nasi", stock: 50 },
  
  // Mie
  { name: "Mie Goreng Jawa", price: 30000, img: "https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=400&q=80&v=3", category: "Mie", isNew: true, stock: 50 },
  { name: "Mie Kuah Spesial", price: 30000, img: "https://images.unsplash.com/photo-1555126634-323283e090fa?w=400&q=80&v=3", category: "Mie", stock: 50 },
  { name: "Kwetiau Goreng", price: 32000, img: "https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=400&q=80&v=3", category: "Mie", stock: 50 },
  { name: "Bihun Goreng Seafood", price: 35000, img: "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400&q=80&v=3", category: "Mie", stock: 50 },
  { name: "Bakmi Ayam Jamur", price: 28000, img: "https://images.unsplash.com/photo-1555126634-323283e090fa?w=400&q=80&v=3", category: "Mie", stock: 50 },

  // Lauk Pauk
  { name: "Ayam Bakar Madu", price: 28000, img: "https://images.unsplash.com/photo-1598514982205-f36b96d1e8d4?w=400&q=80&v=3", category: "Lauk Pauk", isNew: true, stock: 50 },
  { name: "Ayam Goreng Kremes", price: 25000, img: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400&q=80&v=3", category: "Lauk Pauk", stock: 50 },
  { name: "Bebek Goreng", price: 35000, img: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400&q=80&v=3", category: "Lauk Pauk", stock: 50 },
  { name: "Gurame Asam Manis", price: 65000, img: "https://images.unsplash.com/photo-1580476262798-bddd9f4b7369?w=400&q=80&v=3", category: "Lauk Pauk", stock: 50 },
  { name: "Sate Ayam (10 Tusuk)", price: 30000, img: "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=400&q=80&v=3", category: "Lauk Pauk", stock: 50 },
  
  // Sayuran
  { name: "Capcay Seafood", price: 35000, img: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80&v=3", category: "Sayuran", isNew: true, stock: 50 },
  { name: "Cah Kangkung", price: 15000, img: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80&v=3", category: "Sayuran", stock: 50 },
  { name: "Sayur Asem", price: 12000, img: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80&v=3", category: "Sayuran", stock: 50 },
  { name: "Tumis Toge Ikan Asin", price: 18000, img: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80&v=3", category: "Sayuran", stock: 50 },
  { name: "Karedok", price: 15000, img: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80&v=3", category: "Sayuran", stock: 50 },

  // Camilan
  { name: "Tahu Walik", price: 15000, img: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&q=80&v=3", category: "Camilan", stock: 50 },
  { name: "Tempe Mendoan", price: 12000, img: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&q=80&v=3", category: "Camilan", stock: 50 },
  { name: "Pisang Goreng Keju", price: 18000, img: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&q=80&v=3", category: "Camilan", stock: 50 },
  { name: "Singkong Keju", price: 15000, img: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&q=80&v=3", category: "Camilan", stock: 50 },
  { name: "Bakwan Jagung", price: 12000, img: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&q=80&v=3", category: "Camilan", isNew: true, stock: 50 },
  
  // Minuman
  { name: "Jus Alpukat", price: 18000, img: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&q=80&v=3", category: "Minuman", isNew: true, stock: 50 },
  { name: "Es Teh Manis", price: 8000, img: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&q=80&v=3", category: "Minuman", stock: 50 },
  { name: "Es Jeruk", price: 10000, img: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&q=80&v=3", category: "Minuman", stock: 50 },
  { name: "Kopi Hitam", price: 12000, img: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&q=80&v=3", category: "Minuman", stock: 50 },
  { name: "Lemon Tea", price: 10000, img: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&q=80&v=3", category: "Minuman", stock: 50 },
  
  // Dessert
  { name: "Es Campur", price: 20000, img: "https://images.unsplash.com/photo-1579954115545-a95591f28bfc?w=400&q=80&v=4", category: "Dessert", isNew: true, stock: 50 },
  { name: "Es Teler", price: 20000, img: "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400&q=80&v=4", category: "Dessert", stock: 50 },
  { name: "Pudding Coklat", price: 15000, img: "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&q=80&v=4", category: "Dessert", stock: 50 },
  { name: "Pancake Ice Cream", price: 25000, img: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400&q=80&v=4", category: "Dessert", stock: 50 },
  { name: "Buko Pandan", price: 18000, img: "https://images.unsplash.com/photo-1579954115545-a95591f28bfc?w=400&q=80&v=4", category: "Dessert", stock: 50 },
];

export default function Home() {
  const [activeCategory, setActiveCategory] = useState("Rekomendasi");
  const [searchQuery, setSearchQuery] = useState("");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  // Modal State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalQty, setModalQty] = useState(1);
  const [modalOptions, setModalOptions] = useState<{spicy: string, ice: string, sugar: string}>({
    spicy: "Tidak Pedas",
    ice: "Dingin",
    sugar: "Normal"
  });

  const categories = [
    { name: "Rekomendasi", icon: "⭐" },
    { name: "Nasi", icon: "🍚" },
    { name: "Mie", icon: "🍜" },
    { name: "Lauk Pauk", icon: "🍗" },
    { name: "Sayuran", icon: "🥗" },
    { name: "Camilan", icon: "🥟" },
    { name: "Minuman", icon: "🥤" },
    { name: "Dessert", icon: "🍮" },
  ];

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "products"));
        let data: Product[] = [];
        querySnapshot.forEach((docSnap) => {
          data.push({ id: docSnap.id, ...docSnap.data() } as Product);
        });

        // Bersihkan data lama jika produk tidak punya field stock atau fotonya masih menggunakan versi sebelumnya (v=4 trigger)
        const hasOldData = data.some(p => p.stock === undefined || (p.img && !p.img.includes('v=4')));
        if (hasOldData) {
          console.log("Menghapus data menu lama...");
          for (const p of data) {
            await deleteDoc(doc(db, "products", p.id!));
          }
          data = [];
        }

        // Seed data baru jika kosong
        if (data.length === 0) {
          console.log("Seeding menu restoran...");
          for (const product of initialProducts) {
            const docRef = await addDoc(collection(db, "products"), product);
            data.push({ id: docRef.id, ...product });
          }
        }

        setAllProducts(data);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setIsLoadingProducts(false);
      }
    };
    fetchProducts();
  }, []);

  // Filter products based on search query or active category
  let displayedProducts = allProducts;
  if (searchQuery.trim() !== "") {
    displayedProducts = allProducts.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  } else {
    displayedProducts = activeCategory === "Rekomendasi" 
      ? allProducts.filter(p => p.isNew || p.name === "Nasi Goreng Spesial" || p.name === "Ayam Bakar Madu" || p.name === "Jus Alpukat")
      : allProducts.filter(p => p.category === activeCategory);
  }

  const openProductModal = (product: Product) => {
    setSelectedProduct(product);
    setModalQty(1);
    setModalOptions({
      spicy: "Tidak Pedas",
      ice: "Dingin",
      sugar: "Normal",
      note: ""
    });
  };

  const handleAddToCart = () => {
    if (!selectedProduct) return;
    
    // Generate unique ID based on product and selected options
    const isDrink = ["Minuman", "Dessert"].includes(selectedProduct.category);
    const optionsKey = isDrink 
      ? `${modalOptions.ice}-${modalOptions.sugar}-${modalOptions.note}` 
      : `${modalOptions.spicy}-${modalOptions.note}`;
      
    const cartItemId = `${selectedProduct.id || selectedProduct.name}-${optionsKey}`;

    setCartItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.cartItemId === cartItemId);
      if (existingIndex >= 0) {
        const newItems = [...prev];
        const newQty = newItems[existingIndex].qty + modalQty;
        newItems[existingIndex] = {
          ...newItems[existingIndex],
          qty: newQty,
          total: newQty * newItems[existingIndex].price
        };
        return newItems;
      }
      return [...prev, { 
        ...selectedProduct, 
        cartItemId,
        qty: modalQty, 
        total: selectedProduct.price * modalQty,
        options: isDrink 
          ? { ice: modalOptions.ice, sugar: modalOptions.sugar, note: modalOptions.note }
          : { spicy: modalOptions.spicy, note: modalOptions.note }
      }];
    });

    setSelectedProduct(null);
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#f8f9fa] w-full relative pb-[72px] lg:pb-0">
      <Sidebar />
      
      <main className="flex-1 flex flex-col p-4 lg:p-8 overflow-y-auto print:hidden">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 lg:gap-0 mb-6 lg:mb-8">
          <h1 className="text-2xl lg:text-3xl font-semibold text-zinc-800 tracking-tight">
            Menu <span className="font-light text-zinc-500">Category</span>
          </h1>
          <div className="relative w-full lg:w-72">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-zinc-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-4 py-3 bg-white border-none rounded-full text-sm shadow-sm placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all text-zinc-700 font-medium"
              placeholder="Search for food, coffee, etc"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="flex gap-4 mb-10 overflow-x-auto pb-2 pt-2 scrollbar-hide">
          {categories.map((cat, idx) => {
            const isActive = activeCategory === cat.name && searchQuery === "";
            return (
              <button
                key={idx}
                onClick={() => {
                  setActiveCategory(cat.name);
                  setSearchQuery(""); // Clear search when clicking category
                }}
                className={`flex flex-col items-center justify-center min-w-[100px] h-28 rounded-3xl transition-all duration-300 group shadow-sm ${
                  isActive
                    ? "bg-amber-100 border-2 border-primary translate-y-[-4px]"
                    : "bg-white border-2 border-transparent hover:border-zinc-100 hover:shadow-md hover:translate-y-[-2px]"
                }`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl mb-2 transition-colors ${
                  isActive ? "bg-white text-primary" : "bg-zinc-50 text-zinc-600 group-hover:bg-amber-50"
                }`}>
                  {cat.icon}
                </div>
                <span className={`text-sm font-semibold ${isActive ? "text-primary" : "text-zinc-600"}`}>
                  {cat.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Products Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-zinc-800 tracking-tight">
            {searchQuery ? "Search Results" : "Choose Order"}
          </h2>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6 pb-8">
          {isLoadingProducts ? (
            <div className="col-span-full py-12 flex justify-center items-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : displayedProducts.length === 0 ? (
            <div className="col-span-full py-12 text-center text-zinc-500 font-medium">
              {searchQuery 
                ? `Tidak menemukan hasil untuk "${searchQuery}"`
                : `Menu untuk kategori ${activeCategory} sedang kosong.`}
            </div>
          ) : (
            displayedProducts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => openProductModal(p)}
                disabled={p.stock === 0}
                className={`bg-white rounded-[2rem] p-4 lg:p-6 flex flex-col items-center text-center transition-all duration-300 border border-zinc-100 relative group active:scale-95 ${p.stock === 0 ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:shadow-xl hover:-translate-y-1"}`}
              >
                {p.isNew && (
                  <span className="absolute top-4 right-4 bg-primary text-white text-[10px] font-bold px-2.5 py-1 rounded-full z-10 shadow-sm shadow-primary/30">
                    New
                  </span>
                )}
                <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center text-4xl mb-4 shadow-sm border border-amber-100 group-hover:scale-110 transition-transform overflow-hidden">
                  {p.img && p.img.length > 10 ? (
                    <img src={p.img} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    p.img
                  )}
                </div>
                <h3 className="font-bold text-zinc-800 text-center text-sm leading-tight group-hover:text-primary transition-colors">
                  {p.name}
                </h3>
                <p className="text-zinc-500 font-medium text-xs mt-1 mb-2">{formatIDR(p.price)}</p>
                
                <div className={`mt-auto text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  p.stock === 0 ? "bg-red-100 text-red-600" : "bg-zinc-100 text-zinc-500"
                }`}>
                  {p.stock === 0 ? "Stok Habis" : `Stok: ${p.stock}`}
                </div>
              </button>
            ))
          )}
        </div>
      </main>

      <OrderMenu cartItems={cartItems} setCartItems={setCartItems} />

      {/* Product Options Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col relative">
            <form onSubmit={(e) => { e.preventDefault(); handleAddToCart(); }} className="p-6">
              <button 
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 bg-zinc-100 hover:bg-zinc-200 p-2 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              
              {/* Image and Name */}
              <div className="flex gap-4 items-center mb-6 mt-4">
                <div className="w-20 h-20 bg-amber-50 rounded-2xl flex items-center justify-center text-4xl border border-amber-100 overflow-hidden">
                  {selectedProduct.img && selectedProduct.img.length > 10 ? (
                    <img src={selectedProduct.img} alt={selectedProduct.name} className="w-full h-full object-cover" />
                  ) : (
                    selectedProduct.img
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-800 leading-tight mb-1">{selectedProduct.name}</h3>
                  <p className="text-primary font-semibold text-base">{formatIDR(selectedProduct.price)}</p>
                  <p className="text-zinc-500 text-xs mt-1">Sisa Stok: <span className="font-bold">{selectedProduct.stock}</span></p>
                </div>
              </div>

              {/* Options */}
              {["Minuman", "Dessert"].includes(selectedProduct.category) ? (
                // Drink Options
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-zinc-800 mb-2">Es / Panas</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {["Dingin", "Panas"].map(opt => (
                        <button
                          type="button"
                          key={opt}
                          onClick={() => setModalOptions({...modalOptions, ice: opt})}
                          className={`py-2 text-sm font-semibold rounded-xl border-2 transition-all ${
                            modalOptions.ice === opt 
                              ? "border-primary bg-amber-50 text-primary" 
                              : "border-zinc-100 text-zinc-500 hover:border-zinc-200"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-zinc-800 mb-2">Gula</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {["Normal", "Tanpa Gula"].map(opt => (
                        <button
                          type="button"
                          key={opt}
                          onClick={() => setModalOptions({...modalOptions, sugar: opt})}
                          className={`py-2 text-sm font-semibold rounded-xl border-2 transition-all ${
                            modalOptions.sugar === opt 
                              ? "border-primary bg-amber-50 text-primary" 
                              : "border-zinc-100 text-zinc-500 hover:border-zinc-200"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                // Food Options
                <div>
                  <h4 className="text-sm font-semibold text-zinc-800 mb-2">Level Pedas</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {["Tidak Pedas", "Pedas"].map(opt => (
                      <button
                        type="button"
                        key={opt}
                        onClick={() => setModalOptions({...modalOptions, spicy: opt})}
                        className={`py-2 text-sm font-semibold rounded-xl border-2 transition-all ${
                          modalOptions.spicy === opt 
                            ? "border-primary bg-amber-50 text-primary" 
                            : "border-zinc-100 text-zinc-500 hover:border-zinc-200"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Catatan */}
              <div className="mt-4">
                <input 
                  type="text" 
                  value={modalOptions.note || ""}
                  onChange={(e) => setModalOptions({...modalOptions, note: e.target.value})}
                  placeholder="Catatan (Opsional) - cth: jangan pakai sayur"
                  className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-zinc-800 text-sm placeholder:text-zinc-400"
                />
              </div>

              {/* Qty & Submit */}
              <div className="flex items-center gap-4 mt-6">
                <div className="flex items-center bg-zinc-50 rounded-xl border border-zinc-200">
                  <button type="button" onClick={() => setModalQty(Math.max(1, modalQty - 1))} className="w-12 h-10 flex items-center justify-center text-zinc-500 hover:text-zinc-800 transition-colors">
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center font-bold text-zinc-800 text-sm">{modalQty}</span>
                  <button 
                    type="button" 
                    onClick={() => setModalQty(Math.min(selectedProduct.stock, modalQty + 1))} 
                    className="w-12 h-10 flex items-center justify-center text-zinc-500 hover:text-zinc-800 transition-colors disabled:opacity-50"
                    disabled={modalQty >= selectedProduct.stock}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                
                <button 
                  type="submit" 
                  disabled={selectedProduct.stock === 0}
                  className="flex-1 bg-primary hover:bg-primary-hover disabled:bg-zinc-300 disabled:cursor-not-allowed text-white h-10 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/30 active:scale-[0.98] text-sm"
                >
                  Tambah - {formatIDR(selectedProduct.price * modalQty)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
