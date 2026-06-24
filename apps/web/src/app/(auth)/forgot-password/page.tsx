"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { forgotPasswordAction } from "@/server/actions/auth";
import { Loader2, CheckCircle2, ArrowLeft } from "lucide-react";

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
      } catch (err: unknown) {
        setError((err as Error)?.message || "Erro ao solicitar recuperação de senha.");
      }
    });
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-600 dark:text-brand-200">
            OFM Systems
          </p>
          <h1 className="mt-2 text-2xl font-bold text-ink dark:text-white">
            Recuperar senha
          </h1>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
            Informe seu e-mail para receber o link de redefinição.
          </p>
        </div>

        <div className="rounded-xl border border-line bg-white p-6 shadow-soft dark:border-slate-700 dark:bg-[#111c31]">
          {error && (
            <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
              {error}
            </div>
          )}

          {success ? (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="rounded-full bg-emerald-50 p-4 dark:bg-emerald-500/10">
                <CheckCircle2 size={28} className="text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              </div>
              <div>
                <p className="font-semibold text-ink dark:text-white">{resetUrl ? "Link gerado" : "E-mail enviado"}</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{success}</p>
              </div>
              {resetUrl && (
                <div className="w-full rounded-lg border border-amber-200 bg-amber-50 p-3 text-left dark:border-amber-500/30 dark:bg-amber-500/10">
                  <p className="text-xs font-semibold text-amber-800 dark:text-amber-200">
                    Link (ambiente de desenvolvimento):
                  </p>
                  <a
                    href={resetUrl}
                    className="mt-1.5 block break-all text-xs text-brand-600 underline dark:text-brand-300"
                  >
                    {resetUrl}
                  </a>
                </div>
              )}
            </div>
          ) : (
            <form action={handleSubmit} className="grid gap-4">
              <div className="grid gap-1.5">
                <label htmlFor="fp-email" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  E-mail
                </label>
                <input
                  id="fp-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="seu@email.com"
                  className="h-10 rounded-lg border border-line bg-white px-3 text-sm text-ink outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-[#0f172a] dark:text-white dark:placeholder-slate-500"
                />
              </div>
              <button
                type="submit"
                disabled={isPending}
                className="flex h-10 items-center justify-center gap-2 rounded-lg bg-brand-500 text-sm font-semibold text-white transition-colors hover:bg-brand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending ? (
                  <>
                    <Loader2 size={15} className="animate-spin" aria-hidden="true" />
                    Enviando...
                  </>
                ) : "Enviar link de recuperação"}
              </button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          <Link href="/login" className="inline-flex items-center gap-1.5 font-medium text-brand-600 hover:text-brand-700 dark:text-brand-300">
            <ArrowLeft size={14} aria-hidden="true" />
            Voltar ao login
          </Link>
        </p>
      </div>
    </main>
  );
}
