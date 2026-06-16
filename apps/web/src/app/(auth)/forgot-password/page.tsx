"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { forgotPasswordAction } from "@/server/actions/auth";

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [resetUrl, setResetUrl] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(null);
    setResetUrl(null);
    startTransition(async () => {
      try {
        const result = await forgotPasswordAction(formData);
        setSuccess(result.message);
        if (result.resetUrl) setResetUrl(result.resetUrl);
      } catch (err: any) {
        setError(err?.message || "Erro ao solicitar recuperacao de senha.");
      }
    });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas">
      <div className="w-full max-w-md rounded-lg border border-line bg-white p-8 shadow-soft">
        <h1 className="text-2xl font-bold">Recuperar senha</h1>
        <p className="mt-2 text-sm text-slate-600">
          Informe seu e-mail para receber um link de redefinicao de senha.
        </p>

        {error && (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {success}
          </div>
        )}

        {resetUrl && (
          <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            <p className="font-semibold">Link de recuperacao (ambiente de desenvolvimento):</p>
            <a href={resetUrl} className="mt-1 block break-all text-brand-600 underline">
              {resetUrl}
            </a>
          </div>
        )}

        {!success && (
          <form action={handleSubmit} className="mt-6 grid gap-4">
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
            <button
              type="submit"
              disabled={isPending}
              className="h-11 rounded-md bg-brand-600 px-4 font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {isPending ? "Enviando..." : "Enviar link de recuperacao"}
            </button>
          </form>
        )}

        <div className="mt-6 text-center text-sm text-slate-600">
          Lembrou a senha?{" "}
          <Link href="/login" className="font-medium text-brand-600 hover:underline">
            Voltar ao login
          </Link>
        </div>
      </div>
    </main>
  );
}
