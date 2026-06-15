import { LoginForm } from "@/features/auth/login-form";
import { Suspense } from "react";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen grid-cols-[1.05fr_0.95fr] bg-canvas">
      <section className="flex items-center justify-center border-r border-line bg-white px-12">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-600">
              Projete-se
            </p>
            <h1 className="mt-3 text-4xl font-bold text-ink">Gestao completa de projetos</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Acesse dashboards, cronogramas, Gantt, recursos, horas, baselines e relatorios em
              uma experiencia corporativa desktop-first.
            </p>
          </div>
          <Suspense fallback={<div className="text-sm text-slate-500">Carregando login...</div>}>
            <LoginForm />
          </Suspense>
          <p className="mt-5 text-xs text-slate-500">
            Seed local: admin@projete.local / Projete@123
          </p>
        </div>
      </section>
      <section className="flex items-center bg-ink px-14 text-white">
        <div className="max-w-xl">
          <div className="grid grid-cols-2 gap-4">
            {["Gantt", "Baselines", "Recursos", "Relatorios"].map((item) => (
              <div key={item} className="rounded-lg border border-white/15 bg-white/8 p-5">
                <p className="text-sm text-white/70">{item}</p>
                <p className="mt-6 text-3xl font-bold">100%</p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-sm leading-6 text-white/70">
            Plataforma self-hosted, sem licencas obrigatorias pagas, preparada para governanca,
            auditoria e isolamento de clientes.
          </p>
        </div>
      </section>
    </main>
  );
}
