"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setLoading(true);
    setError("");
    const result = await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false
    });
    setLoading(false);

    if (result?.error) {
      setError("Credenciais invalidas ou usuario inativo.");
      return;
    }

    const sessionResponse = await fetch("/api/auth/session");
    const session = await sessionResponse.json();
    const destination = session?.user?.mustChangePassword
      ? "/change-password"
      : searchParams.get("callbackUrl") || "/dashboard";

    router.push(destination);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <label className="grid gap-1 text-sm font-medium text-slate-700">
        E-mail
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue="admin@projete.local"
          className="h-11 rounded-md border border-line bg-white px-3 outline-none focus:border-brand-500"
        />
      </label>
      <label className="grid gap-1 text-sm font-medium text-slate-700">
        Senha
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          defaultValue="Projete@123"
          className="h-11 rounded-md border border-line bg-white px-3 outline-none focus:border-brand-500"
        />
      </label>
      {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-danger">{error}</p> : null}
      <button
        type="submit"
        disabled={loading}
        className="h-11 rounded-md bg-brand-600 px-4 font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {loading ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
