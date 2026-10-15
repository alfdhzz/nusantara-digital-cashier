"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

type ShiftContextType = {
  shift: any | null;
  isShiftLoading: boolean;
  shiftError: string | null;
  refreshShift: () => void;
};

const ShiftContext = createContext<ShiftContextType>({
  shift: null,
  isShiftLoading: true,
  shiftError: null,
  refreshShift: () => {},
});

export function ShiftProvider({ children }: { children: React.ReactNode }) {
  const [shift, setShift] = useState<any>(null);
  const [isShiftLoading, setIsShiftLoading] = useState(true);
  const [shiftError, setShiftError] = useState<string | null>(null);
  const [trigger, setTrigger] = useState(0);

  const refreshShift = useCallback(() => {
    setIsShiftLoading(true);
    setShiftError(null);
    setTrigger((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let unsubscribe: any = null;
    let isMounted = true;

    // Safety timeout: stop spinner after 6 seconds even if network is pending
    const timer = setTimeout(() => {
      if (isMounted) {
        setIsShiftLoading(false);
      }
    }, 6000);

    import("@/lib/session")
      .then(({ getCollectionName }) => {
        if (!isMounted) return;
        try {
          const q = query(collection(db, getCollectionName("shifts")), where("status", "==", "open"));
          unsubscribe = onSnapshot(
            q,
            (snapshot) => {
              clearTimeout(timer);
              if (!isMounted) return;
              if (!snapshot.empty) {
                const docData = snapshot.docs[0];
                setShift({ id: docData.id, ...docData.data() });
              } else {
                setShift(null);
              }
              setShiftError(null);
              setIsShiftLoading(false);
            },
            (error) => {
              clearTimeout(timer);
              console.error("Firestore shift listener error:", error);
              if (!isMounted) return;
              setShiftError(
                error.code === "permission-denied"
                  ? "Izin akses Firestore ditolak (Permission Denied). Mohon aktifkan aturan baca/tulis di Firebase Console."
                  : error.message
              );
              setIsShiftLoading(false);
            }
          );
        } catch (err: any) {
          clearTimeout(timer);
          console.error("Shift listener setup error:", err);
          if (isMounted) {
            setShiftError(err.message || "Gagal menghubungkan ke database");
            setIsShiftLoading(false);
          }
        }
      })
      .catch((err) => {
        clearTimeout(timer);
        console.error("Failed to load session:", err);
        if (isMounted) {
          setShiftError("Gagal memuat modul sesi");
          setIsShiftLoading(false);
        }
      });

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (unsubscribe) unsubscribe();
    };
  }, [trigger]);

  return (
    <ShiftContext.Provider value={{ shift, isShiftLoading, shiftError, refreshShift }}>
      {children}
    </ShiftContext.Provider>
  );
}

export const useShift = () => useContext(ShiftContext);

