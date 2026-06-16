"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { registerAction } from "@/server/actions/auth";

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await registerAction(formData);
      } catch (err: any) {
        if (err?.message?.includes("NEXT_REDIRECT")) throw err;
        setError(err?.message || "Erro ao criar conta.");
      }
    });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas">
      <div className="w-full max-w-md rounded-lg border border-line bg-white p-8 shadow-soft">
        <h1 className="text-2xl font-bold">Criar conta</h1>
        <p className="mt-2 text-sm text-slate-600">
          Preencha os dados abaixo para se cadastrar.
        </p>

        {error && (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <form action={handleSubmit} className="mt-6 grid gap-4">
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            Nome completo
            <input
              name="name"
              type="text"
              autoComplete="name"
              required
              minLength={2}
              placeholder="Seu nome"
              className="h-11 rounded-md border border-line bg-white px-3 outline-none focus:border-brand-500"
            />
          </label>
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            E-mail
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="seu@email.com"
              className="h-11 rounded-md border border-line bg-white px-3 outline-none focus:border-brand-500"
            />
          </label>
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            Senha
            <input
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              placeholder="Minimo 8 caracteres"
              className="h-11 rounded-md border border-line bg-white px-3 outline-none focus:border-brand-500"
            />
          </label>
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            Confirmar senha
            <input
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              placeholder="Repita a senha"
              className="h-11 rounded-md border border-line bg-white px-3 outline-none focus:border-brand-500"
            />
          </label>
          <button
            type="submit"
            disabled={isPending}
            className="h-11 rounded-md bg-brand-600 px-4 font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {isPending ? "Criando conta..." : "Criar conta"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-600">
          Ja tem uma conta?{" "}
          <Link href="/login" className="font-medium text-brand-600 hover:underline">
            Entrar
          </Link>
        </div>
      </div>
    </main>
  );
}
