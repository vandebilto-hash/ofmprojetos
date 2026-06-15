"use client";

import { useEffect, useState } from "react";

type Toast = {
  id: number;
  message: string;
};

export function ToastProvider() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    function onToast(event: Event) {
      const custom = event as CustomEvent<{ message?: string }>;
      const toast = {
        id: Date.now(),
        message: custom.detail?.message ?? "Operacao realizada com sucesso."
      };
      setToasts((current) => [...current, toast]);
      window.setTimeout(() => {
        setToasts((current) => current.filter((item) => item.id !== toast.id));
      }, 3200);
    }

    window.addEventListener("projete:toast", onToast);
    return () => window.removeEventListener("projete:toast", onToast);
  }, []);

  return (
    <div className="fixed right-5 top-5 z-50 grid w-80 gap-2">
      {toasts.map((toast) => (
        <div key={toast.id} className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 shadow-soft">
          {toast.message}
        </div>
      ))}
    </div>
  );
}
