import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { PasswordInput } from "@/components/ui/password-input";
import { authOptions } from "@/lib/auth/options";
import { changeRequiredPasswordAction } from "@/server/actions/auth";

export default async function ChangePasswordPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  if (!session.user.mustChangePassword) redirect("/dashboard");

  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-6">
      <section className="w-full max-w-md rounded-lg border border-line bg-white p-6 shadow-soft">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-600">Projete-se</p>
        <h1 className="mt-3 text-2xl font-bold text-ink">Troque sua senha</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Sua conta está usando uma senha temporária. Para continuar, defina uma senha definitiva.
        </p>

        <form action={changeRequiredPasswordAction} className="mt-6 grid gap-4">
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            Senha atual
            <PasswordInput
              name="currentPassword"
              autoComplete="current-password"
              required
            />
          </label>
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            Nova senha
            <PasswordInput
              name="newPassword"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </label>
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            Confirmar nova senha
            <PasswordInput
              name="confirmPassword"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </label>
          <button className="h-11 rounded-md bg-brand-600 px-4 font-semibold text-white hover:bg-brand-700">
            Salvar nova senha
          </button>
        </form>
      </section>
    </main>
  );
}
