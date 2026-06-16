"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createUserAction } from "@/server/actions/admin";

export function CreateUserForm({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    const password = String(formData.get("password") || "");
    if (password.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres.");
      return;
    }

    startTransition(async () => {
      try {
        await createUserAction(formData);
        router.refresh();
        (e.target as HTMLFormElement).closest("dialog")?.close();
      } catch (err: any) {
        setError(err?.message || "Erro ao criar usuario.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
      {children}
      <button type="submit" disabled={isPending} className="w-fit rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
        {isPending ? "Criando..." : "Criar usuario"}
      </button>
    </form>
  );
}
