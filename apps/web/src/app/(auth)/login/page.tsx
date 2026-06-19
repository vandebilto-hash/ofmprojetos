import { LoginForm } from "@/features/auth/login-form";
import { Suspense } from "react";
import { BarChart3, GitBranch, Users, FileText } from "lucide-react";

const features = [
  { icon: BarChart3, label: "Dashboards", desc: "KPIs em tempo real por projeto e carteira" },
  { icon: GitBranch, label: "Gantt & Baselines", desc: "Cronograma com caminho crítico e replanejamento" },
  { icon: Users, label: "Recursos", desc: "Alocação, capacidade e controle de horas" },
  { icon: FileText, label: "Relatórios", desc: "PDF, Excel e exportação MSPDI/MS Project" }
];

export default function LoginPage() {
  return (
    <main className="grid min-h-screen lg:grid-cols-[1fr_1fr]">
      {/* Left — form */}
      <section className="flex items-center justify-center px-6 py-12 lg:px-16">
        <div className="w-full max-w-sm">
          {/* Brand */}
          <div className="mb-8">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-600 dark:text-brand-200">
              OFM Systems
            </p>
            <h1 className="mt-2 text-3xl font-bold text-ink dark:text-white">
              Gestão de Projetos
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              Acesse cronogramas, Gantt, recursos, horas e relatórios em uma plataforma corporativa.
            </p>
          </div>

          <Suspense fallback={<div className="h-64 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />}>
            <LoginForm />
          </Suspense>
        </div>
      </section>

      {/* Right — brand panel */}
      <section className="hidden items-center justify-center bg-ink px-12 py-12 lg:flex dark:bg-[#0d1829]">
        <div className="max-w-md">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span className="text-xs font-medium text-white/80">Plataforma interna — OFM Systems</span>
            </div>
            <h2 className="mt-5 text-3xl font-bold leading-tight text-white">
              Controle total sobre seus projetos
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/60">
              Self-hosted, sem licenças obrigatórias. Preparado para governança, auditoria e isolamento de clientes.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {features.map(({ icon: Icon, label, desc }) => (
              <div
                key={label}
                className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm transition-colors hover:bg-white/10"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500/20">
                  <Icon size={16} className="text-brand-300" aria-hidden="true" />
                </div>
                <p className="mt-3 text-sm font-semibold text-white">{label}</p>
                <p className="mt-1 text-xs leading-relaxed text-white/50">{desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex items-center gap-3 border-t border-white/10 pt-6">
            <div className="flex -space-x-2">
              {["A", "B", "C"].map((l) => (
                <div key={l} className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-ink bg-brand-600 text-[10px] font-bold text-white dark:border-[#0d1829]">
                  {l}
                </div>
              ))}
            </div>
            <p className="text-xs text-white/50">
              Equipe OFM utilizando a plataforma
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
