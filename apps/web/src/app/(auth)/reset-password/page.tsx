"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, useTransition, Suspense } from "react";
import { resetPasswordAction } from "@/server/actions/auth";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    formData.set("token", token);
    startTransition(async () => {
      try {
        await resetPasswordAction(formData);
      } catch (err: any) {
        if (err?.message?.includes("NEXT_REDIRECT")) throw err;
        setError(err?.message || "Erro ao redefinir senha.");
      }
    });
  }

  if (!token) {
    return (
      <div className="text-center">
        <p className="text-sm text-red-600">Token de recuperacao nao encontrado.</p>
        <Link href="/forgot-password" className="mt-4 inline-block text-sm font-medium text-brand-600 hover:underline">
          Solicitar nova recuperacao
        </Link>
      </div>
    );
  }

  return (
    <>
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <form action={handleSubmit} className="mt-6 grid gap-4">
        <input type="hidden" name="token" value={token} />
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Nova senha
          <input
            name="newPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            placeholder="Minimo 8 caracteres"
            className="h-11 rounded-md border border-line bg-white px-3 outline-none focus:border-brand-500"
          />
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Confirmar nova senha
          <input
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            placeholder="Repita a nova senha"
            className="h-11 rounded-md border border-line bg-white px-3 outline-none focus:border-brand-500"
          />
        </label>
        <button
          type="submit"
          disabled={isPending}
          className="h-11 rounded-md bg-brand-600 px-4 font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {isPending ? "Redefinindo..." : "Redefinir senha"}
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas">
      <div className="w-full max-w-md rounded-lg border border-line bg-white p-8 shadow-soft">
        <h1 className="text-2xl font-bold">Redefinir senha</h1>
        <p className="mt-2 text-sm text-slate-600">
          Informe sua nova senha abaixo.
        </p>
        <Suspense fallback={<div className="mt-6 text-center text-sm text-slate-500">Carregando...</div>}>
          <ResetPasswordForm />
        </Suspense>
        <div className="mt-6 text-center text-sm text-slate-600">
          <Link href="/login" className="font-medium text-brand-600 hover:underline">
            Voltar ao login
          </Link>
        </div>
      </div>
    </main>
  );
}
