"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { PasswordInput } from "@/components/ui/password-input";
import { registerAction } from "@/server/actions/auth";
import { Loader2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        const result = await registerAction(formData);
        if (result?.ok) router.push("/login?registered=success");
      } catch (err: unknown) {
        setError((err as Error)?.message || "Erro ao criar conta.");
      }
    });
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="mb-8 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-600 dark:text-brand-200">
            OFM Systems
          </p>
          <h1 className="mt-2 text-2xl font-bold text-ink dark:text-white">
            Criar conta
          </h1>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
            Preencha os dados abaixo para se cadastrar.
          </p>
        </div>

        <div className="rounded-xl border border-line bg-white p-6 shadow-soft dark:border-slate-700 dark:bg-[#111c31]">
          {error && (
            <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
              {error}
            </div>
          )}

          <form action={handleSubmit} className="grid gap-4">
            <div className="grid gap-1.5">
              <label htmlFor="name" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Nome completo <span className="text-danger" aria-hidden="true">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                minLength={2}
                placeholder="Seu nome"
                className="h-10 rounded-lg border border-line bg-white px-3 text-sm text-ink outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-[#0f172a] dark:text-white dark:placeholder-slate-500"
              />
            </div>

            <div className="grid gap-1.5">
              <label htmlFor="reg-email" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                E-mail <span className="text-danger" aria-hidden="true">*</span>
              </label>
              <input
                id="reg-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="seu@email.com"
                className="h-10 rounded-lg border border-line bg-white px-3 text-sm text-ink outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-[#0f172a] dark:text-white dark:placeholder-slate-500"
              />
            </div>

            <div className="grid gap-1.5">
              <label htmlFor="reg-password" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Senha <span className="text-danger" aria-hidden="true">*</span>
              </label>
              <PasswordInput
                id="reg-password"
                name="password"
                autoComplete="new-password"
                required
                minLength={8}
                placeholder="Mínimo 8 caracteres"
              />
            </div>

            <div className="grid gap-1.5">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Confirmar senha <span className="text-danger" aria-hidden="true">*</span>
              </label>
              <PasswordInput
                id="confirmPassword"
                name="confirmPassword"
                autoComplete="new-password"
                required
                minLength={8}
                placeholder="Repita a senha"
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
                  Criando conta...
                </>
              ) : "Criar conta"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          Já tem uma conta?{" "}
          <Link href="/login" className="font-medium text-brand-600 hover:text-brand-700 dark:text-brand-300">
            Entrar
          </Link>
        </p>
      </div>
    </main>
  );
}
