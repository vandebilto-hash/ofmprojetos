"use client";

import { useEffect, useRef, useState } from "react";
import { MoreVertical } from "lucide-react";

export function ActionDropdown({ label = "Acoes", children }: { label?: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-line bg-white text-slate-700 hover:bg-brand-50 hover:text-brand-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
        aria-haspopup="menu"
        aria-expanded={open}
        title={label}
      >
        <MoreVertical size={17} />
      </button>
      <div
        role="menu"
        className={`absolute right-0 top-10 z-30 w-48 rounded-lg border border-line bg-white p-1 shadow-soft dark:bg-slate-950 ${
          open ? "block" : "hidden"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
