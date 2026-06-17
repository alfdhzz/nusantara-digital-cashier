"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

type ShiftContextType = {
  shift: any | null;
  isShiftLoading: boolean;
};

const ShiftContext = createContext<ShiftContextType>({
  shift: null,
  isShiftLoading: true,
});

export function ShiftProvider({ children }: { children: React.ReactNode }) {
  const [shift, setShift] = useState<any>(null);
  const [isShiftLoading, setIsShiftLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: any = null;
    import("@/lib/session").then(({ getCollectionName }) => {
      const q = query(collection(db, getCollectionName("shifts")), where("status", "==", "open"));
      unsubscribe = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const docData = snapshot.docs[0];
          setShift({ id: docData.id, ...docData.data() });
        } else {
          setShift(null);
        }
        setIsShiftLoading(false);
      });
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return (
    <ShiftContext.Provider value={{ shift, isShiftLoading }}>
      {children}
    </ShiftContext.Provider>
  );
}

export const useShift = () => useContext(ShiftContext);
