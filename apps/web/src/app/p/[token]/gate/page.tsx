"use client";

import { useState, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";

export default function PortalGatePage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/portal/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, email })
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "E-mail nao autorizado.");
          return;
        }
        router.push(`/p/${token}`);
        router.refresh();
      } catch {
        setError("Erro ao verificar e-mail.");
      }
    });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas">
      <div className="w-full max-w-md rounded-lg border border-line bg-white p-8 shadow-soft">
        <div className="mb-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-600">Projete-se</p>
          <h1 className="mt-3 text-2xl font-bold text-ink">Acesso ao Portal do Cliente</h1>
          <p className="mt-2 text-sm text-slate-600">
            Informe o e-mail autorizado para acessar este projeto.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid gap-4">
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            E-mail autorizado
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="seu@email.com"
              className="h-11 rounded-md border border-line bg-white px-3 outline-none focus:border-brand-500"
            />
          </label>
          <button
            type="submit"
            disabled={isPending}
            className="h-11 rounded-md bg-brand-600 px-4 font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {isPending ? "Verificando..." : "Acessar portal"}
          </button>
        </form>
      </div>
    </main>
  );
}
