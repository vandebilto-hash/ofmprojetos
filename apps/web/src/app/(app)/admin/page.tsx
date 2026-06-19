import Link from "next/link";
import {
  Building2, ClipboardList, KeyRound, Settings,
  ShieldCheck, UsersRound, Activity, Clock
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { MetricCard } from "@/components/ui/metric-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { prisma } from "@/lib/prisma/client";

const adminLinks = [
  {
    href: "/admin/users",
    title: "Usuários e funcionários",
    description: "Cadastre funcionários, gestores, administradores e usuários cliente.",
    icon: UsersRound,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-500/10"
  },
  {
    href: "/admin/clients",
    title: "Clientes",
    description: "Gerencie clientes, contatos, usuários vinculados e status cadastral.",
    icon: Building2,
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-50 dark:bg-purple-500/10"
  },
  {
    href: "/admin/permissions",
    title: "Permissões",
    description: "Consulte a matriz de acesso por perfil aplicada no backend.",
    icon: KeyRound,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-500/10"
  },
  {
    href: "/admin/settings",
    title: "Configurações",
    description: "Ajuste parâmetros gerais, capacidades padrão e preferências do sistema.",
    icon: Settings,
    color: "text-slate-600 dark:text-slate-400",
    bg: "bg-slate-100 dark:bg-slate-500/10"
  },
  {
    href: "/admin/audit",
    title: "Auditoria",
    description: "Acompanhe alterações relevantes feitas por usuários no sistema.",
    icon: ClipboardList,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-500/10"
  }
];

const actionLabels: Record<string, string> = {
  CREATE: "Criou",
  UPDATE: "Atualizou",
  DELETE: "Excluiu",
  LOGIN: "Login em"
};

export default async function AdminPage() {
  const [users, clients, projects, auditLogs] = await Promise.all([
    prisma.user.findMany({ include: { role: true }, orderBy: { createdAt: "desc" } }),
    prisma.client.findMany({ include: { projects: true, users: true }, orderBy: { createdAt: "desc" } }),
    prisma.project.findMany({ select: { id: true, status: true } }),
    prisma.auditLog.findMany({ include: { actor: true }, orderBy: { createdAt: "desc" }, take: 8 })
  ]);

  const activeUsers = users.filter((u) => u.status === "ACTIVE");
  const inactiveUsers = users.filter((u) => u.status === "INACTIVE");
  const employees = users.filter((u) => u.role.name === "EMPLOYEE");
  const managers = users.filter((u) => u.role.name === "PROJECT_MANAGER");
  const activeClients = clients.filter((c) => c.status === "ACTIVE");
  const inactiveClients = clients.filter((c) => c.status === "INACTIVE");
  const activeProjects = projects.filter((p) => p.status === "IN_PROGRESS");

  return (
    <>
      <PageHeader
        title="Administração"
        description="Central administrativa para cadastros, acessos, clientes, configurações e auditoria."
      />

      {/* KPIs */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4" aria-label="Métricas administrativas">
        <MetricCard
          label="Usuários ativos"
          value={activeUsers.length}
          detail={`${inactiveUsers.length} inativo${inactiveUsers.length !== 1 ? "s" : ""}`}
          icon={UsersRound}
        />
        <MetricCard
          label="Funcionários"
          value={employees.length}
          detail={`${managers.length} gestor${managers.length !== 1 ? "es" : ""}`}
          icon={Activity}
        />
        <MetricCard
          label="Clientes ativos"
          value={activeClients.length}
          detail={`${inactiveClients.length} inativo${inactiveClients.length !== 1 ? "s" : ""}`}
          icon={Building2}
        />
        <MetricCard
          label="Projetos em andamento"
          value={activeProjects.length}
          detail={`${projects.length} no total`}
          icon={ClipboardList}
          tone={activeProjects.length > 0 ? "neutral" : "warning"}
        />
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        {/* Admin modules */}
        <div className="rounded-xl border border-line bg-white p-5 shadow-soft dark:bg-[#111c31]">
          <div className="mb-4 flex items-center gap-2.5">
            <ShieldCheck size={18} className="text-brand-600 dark:text-brand-300" aria-hidden="true" />
            <h2 className="text-base font-semibold text-ink dark:text-white">Módulos administrativos</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {adminLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex items-start gap-3 rounded-xl border border-line p-4 transition-all hover:border-brand-200 hover:bg-brand-50/60 hover:shadow-soft dark:border-slate-700 dark:hover:border-brand-500/30 dark:hover:bg-brand-500/5"
                >
                  <span className={`shrink-0 rounded-lg p-2 ${item.bg}`}>
                    <Icon size={18} className={item.color} aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-ink dark:text-white">{item.title}</h3>
                    <p className="mt-0.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{item.description}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Activity + health */}
        <div className="flex flex-col gap-4">
          {/* Recent audit */}
          <div className="flex-1 rounded-xl border border-line bg-white p-5 shadow-soft dark:bg-[#111c31]">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-slate-500" aria-hidden="true" />
                <h2 className="text-sm font-semibold text-ink dark:text-white">Atividade recente</h2>
              </div>
              <Link href="/admin/audit" className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-300">
                Ver tudo →
              </Link>
            </div>
            <div className="grid gap-2.5">
              {auditLogs.length > 0 ? (
                auditLogs.slice(0, 5).map((log) => (
                  <div key={log.id} className="flex items-start gap-2.5">
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-500/10">
                      <span className="text-[9px] font-bold text-brand-600 dark:text-brand-300">
                        {(log.actor?.name ?? "S")[0].toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-snug">
                        <span className="font-medium">{actionLabels[log.action] ?? log.action}</span>
                        {" "}{log.entityType.toLowerCase()}
                        <span className="text-slate-500"> — {log.actor?.name ?? "Sistema"}</span>
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400">Sem registros recentes.</p>
              )}
            </div>
          </div>

          {/* Health */}
          <div className="rounded-xl border border-line bg-white p-5 shadow-soft dark:bg-[#111c31]">
            <h2 className="mb-3 text-sm font-semibold text-ink dark:text-white">Saúde cadastral</h2>
            <div className="grid gap-2">
              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800/40">
                <span className="text-xs text-slate-600 dark:text-slate-400">Usuários inativos</span>
                <StatusBadge status={inactiveUsers.length ? "ON_HOLD" : "ACTIVE"} />
              </div>
              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800/40">
                <span className="text-xs text-slate-600 dark:text-slate-400">Clientes recentes</span>
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  {activeClients.slice(0, 2).map((c) => c.name).join(", ") || "—"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
