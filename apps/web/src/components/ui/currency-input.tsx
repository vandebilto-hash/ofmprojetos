"use client";

import { useCallback } from "react";

export function CurrencyInput({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  const handleInput = useCallback((e: React.FormEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    let value = input.value.replace(/\D/g, "");
    if (value) {
      value = (parseInt(value) / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    input.value = value ? `R$ ${value}` : "";
  }, []);

  return <input className={className} onInput={handleInput} {...props} />;
}
