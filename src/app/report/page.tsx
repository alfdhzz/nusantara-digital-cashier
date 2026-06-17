"use client";
import { useEffect, useState, useMemo } from "react";
import Sidebar from "@/components/Sidebar";
import { collection, getDocs, Timestamp, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { formatIDR } from "@/app/page";
import { Loader2, TrendingUp, Users, Receipt, CircleDollarSign, ShoppingBag, Printer, CalendarDays } from "lucide-react";

import { useShift } from "@/context/ShiftContext";

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

const getLocalDateString = (d: Date) => {
  const offsetMs = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offsetMs).toISOString().split("T")[0];
};

export default function ReportPage() {
  const { shift } = useShift();
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Default: dari awal bulan sampai hari ini
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    return getLocalDateString(start);
  });
  const [endDate, setEndDate] = useState(() => {
    return getLocalDateString(new Date());
  });

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const q = query(collection(db, "transactions"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const data: Transaction[] = [];
        querySnapshot.forEach((doc) => {
          data.push({ id: doc.id, ...doc.data() } as Transaction);
        });
        setAllTransactions(data);
      } catch (error) {
        console.error("Error fetching transactions:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  const filteredTransactions = useMemo(() => {
    return allTransactions.filter(trx => {
      if (!trx.createdAt) return true;
      const date = trx.createdAt.toDate();
      
      const sDate = startDate ? new Date(startDate) : null;
      let eDate = endDate ? new Date(endDate) : null;
      
      // Jika membandingkan di zona waktu lokal:
      // sDate dan eDate akan berada di 00:00:00 UTC, 
      // tapi tidak apa-apa karena kita hanya membandingkan dengan Date.
      
      // Set batas eDate ke jam 23:59:59 di hari tersebut
      if (eDate) {
        eDate.setHours(23, 59, 59, 999);
      }
      
      if (sDate && date < sDate) return false;
      if (eDate && date > eDate) return false;
      
      return true;
    });
  }, [allTransactions, startDate, endDate]);

  const stats = useMemo(() => {
    let sales = 0;
    let trxCount = 0;
    let dineIn = 0;
    let takeAway = 0;

    filteredTransactions.forEach((trx) => {
      sales += trx.total || 0;
      trxCount++;
      if (trx.orderType === "Dine In") dineIn++;
      if (trx.orderType === "Take Away") takeAway++;
    });

    return { totalSales: sales, totalTransactions: trxCount, dineInCount: dineIn, takeAwayCount: takeAway };
  }, [filteredTransactions]);

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (timestamp: Timestamp | null) => {
    if (!timestamp) return "-";
    return timestamp.toDate().toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  // Format the date range nicely for print view
  const formattedPrintDate = () => {
    if (!startDate && !endDate) return "Semua Waktu";
    if (startDate && endDate && startDate === endDate) return startDate;
    return `${startDate || "Awal"} s/d ${endDate || "Sekarang"}`;
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#f8f9fa] w-full print:bg-white pb-[72px] lg:pb-0">
      <div className="print:hidden">
        <Sidebar />
      </div>
      
      <main className="flex-1 p-4 lg:p-8 overflow-y-auto print:p-12 print:overflow-visible">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 lg:gap-0 mb-6 lg:mb-8 print:mb-8">
          <div>
            <h1 className="text-2xl lg:text-3xl font-semibold text-zinc-800 tracking-tight mb-1">
              Sales <span className="font-light text-zinc-500">Report</span>
            </h1>
            <p className="text-zinc-500 text-sm print:hidden">Ringkasan performa penjualan bisnis Anda.</p>
            <p className="hidden print:block text-zinc-500 text-sm">Periode Laporan: {formattedPrintDate()}</p>
          </div>
          
          <div className="flex flex-col sm:flex-row w-full lg:w-auto items-stretch sm:items-center gap-3 lg:gap-4 print:hidden">
            <div className="flex items-center justify-between sm:justify-start gap-2 bg-white border border-zinc-200 rounded-xl px-3 shadow-sm focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all flex-1">
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="py-2.5 focus:outline-none text-sm font-semibold text-zinc-700 bg-transparent w-full sm:w-32"
              />
              <span className="text-zinc-400 text-sm font-medium">s/d</span>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="py-2.5 focus:outline-none text-sm font-semibold text-zinc-700 bg-transparent w-full sm:w-32 text-right sm:text-left"
              />
            </div>

            <button 
              onClick={handlePrint}
              className="bg-zinc-800 hover:bg-zinc-900 text-white px-5 py-3 sm:py-2.5 rounded-xl font-semibold text-sm flex justify-center items-center gap-2 shadow-lg transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              <Printer className="w-4 h-4" /> Cetak Laporan
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64 print:hidden">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-8 print:space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 print:gap-4 print:grid-cols-5">
              {/* Saldo Awal */}
              <div className="bg-white p-6 rounded-[2rem] print:rounded-xl shadow-sm border border-zinc-100 flex flex-col justify-between h-40 print:h-auto print:border-zinc-300">
                <div className="flex justify-between items-start print:hidden">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                    <CircleDollarSign className="w-6 h-6" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-500 mb-1">Saldo Awal Laci</p>
                  <h3 className="text-2xl font-bold text-zinc-800">{shift ? formatIDR(shift.openingBalance) : "-"}</h3>
                </div>
              </div>

              {/* Total Revenue */}
              <div className="bg-white p-6 rounded-[2rem] print:rounded-xl shadow-sm border border-zinc-100 flex flex-col justify-between h-40 print:h-auto print:border-zinc-300">
                <div className="flex justify-between items-start print:hidden">
                  <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
                    <CircleDollarSign className="w-6 h-6" />
                  </div>
                  <span className="flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                    <TrendingUp className="w-3 h-3" />
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-500 mb-1">Total Pendapatan</p>
                  <h3 className="text-2xl font-bold text-zinc-800">{formatIDR(stats.totalSales)}</h3>
                </div>
              </div>

              {/* Total Transactions */}
              <div className="bg-white p-6 rounded-[2rem] print:rounded-xl shadow-sm border border-zinc-100 flex flex-col justify-between h-40 print:h-auto print:border-zinc-300">
                <div className="flex justify-between items-start print:hidden">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                    <Receipt className="w-6 h-6" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-500 mb-1">Total Transaksi</p>
                  <h3 className="text-2xl font-bold text-zinc-800">{stats.totalTransactions} Pesanan</h3>
                </div>
              </div>

              {/* Dine In */}
              <div className="bg-white p-6 rounded-[2rem] print:rounded-xl shadow-sm border border-zinc-100 flex flex-col justify-between h-40 print:h-auto print:border-zinc-300">
                <div className="flex justify-between items-start print:hidden">
                  <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                    <Users className="w-6 h-6" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-500 mb-1">Pesanan Dine In</p>
                  <h3 className="text-2xl font-bold text-zinc-800">{stats.dineInCount} Meja</h3>
                </div>
              </div>

              {/* Take Away */}
              <div className="bg-white p-6 rounded-[2rem] print:rounded-xl shadow-sm border border-zinc-100 flex flex-col justify-between h-40 print:h-auto print:border-zinc-300">
                <div className="flex justify-between items-start print:hidden">
                  <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-500 mb-1">Pesanan Take Away</p>
                  <h3 className="text-2xl font-bold text-zinc-800">{stats.takeAwayCount} Bungkus</h3>
                </div>
              </div>
            </div>

            {/* Transaction List for Print/Detail */}
            <div className="bg-white rounded-[2rem] print:rounded-xl shadow-sm border border-zinc-100 overflow-hidden print:border-zinc-300">
              <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50 print:bg-white print:border-b-2 print:border-zinc-800 flex justify-between items-center">
                <h3 className="font-semibold text-zinc-800">Rincian Transaksi</h3>
                <span className="text-sm font-medium text-zinc-500 print:hidden">{filteredTransactions.length} Transaksi Ditemukan</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 print:bg-white border-b border-zinc-100 print:border-b-2 print:border-zinc-800">
                      <th className="px-6 py-3 print:py-4 text-xs font-semibold text-zinc-600 uppercase">Waktu</th>
                      <th className="px-6 py-3 print:py-4 text-xs font-semibold text-zinc-600 uppercase">Info Pelanggan</th>
                      <th className="px-6 py-3 print:py-4 text-xs font-semibold text-zinc-600 uppercase">Tipe Pesanan</th>
                      <th className="px-6 py-3 print:py-4 text-xs font-semibold text-zinc-600 uppercase text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 print:divide-zinc-200">
                    {filteredTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-zinc-500">
                          Tidak ada transaksi pada periode ini.
                        </td>
                      </tr>
                    ) : (
                      filteredTransactions.map((trx) => (
                        <tr key={trx.id} className="hover:bg-zinc-50/50">
                          <td className="px-6 py-3 print:py-5">
                            <div className="flex items-center gap-2 text-sm font-medium text-zinc-700">
                              <CalendarDays className="w-4 h-4 text-zinc-400 print:hidden" />
                              {formatDate(trx.createdAt)}
                            </div>
                          </td>
                          <td className="px-6 py-3 print:py-5">
                            <div className="text-sm font-semibold text-zinc-800">{trx.customerInfo}</div>
                          </td>
                          <td className="px-6 py-3 print:py-5">
                            <span className="text-sm text-zinc-600">{trx.orderType || "Dine In"}</span>
                          </td>
                          <td className="px-6 py-3 print:py-5 text-right">
                            <div className="text-sm font-bold text-zinc-800">{formatIDR(trx.total)}</div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
