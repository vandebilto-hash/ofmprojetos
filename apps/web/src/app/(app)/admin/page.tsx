import Link from "next/link";
import { Building2, ClipboardList, KeyRound, Settings, ShieldCheck, UsersRound } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { prisma } from "@/lib/prisma/client";

const adminLinks = [
  {
    href: "/admin/users",
    title: "Usuarios e funcionarios",
    description: "Cadastre funcionarios, gestores, administradores e usuarios cliente.",
    icon: UsersRound
  },
  {
    href: "/admin/clients",
    title: "Clientes",
    description: "Gerencie clientes, contatos, usuarios vinculados e status cadastral.",
    icon: Building2
  },
  {
    href: "/admin/permissions",
    title: "Permissoes",
    description: "Consulte a matriz de acesso por perfil aplicada no backend.",
    icon: KeyRound
  },
  {
    href: "/admin/settings",
    title: "Configuracoes",
    description: "Ajuste parametros gerais, capacidades padrao e preferencias do sistema.",
    icon: Settings
  },
  {
    href: "/admin/audit",
    title: "Auditoria",
    description: "Acompanhe alteracoes relevantes feitas por usuarios no sistema.",
    icon: ClipboardList
  }
];

export default async function AdminPage() {
  const [users, clients, projects, auditLogs] = await Promise.all([
    prisma.user.findMany({ include: { role: true }, orderBy: { createdAt: "desc" } }),
    prisma.client.findMany({ include: { projects: true, users: true }, orderBy: { createdAt: "desc" } }),
    prisma.project.findMany({ select: { id: true, status: true } }),
    prisma.auditLog.findMany({ include: { actor: true }, orderBy: { createdAt: "desc" }, take: 5 })
  ]);

  const employees = users.filter((user) => user.role.name === "EMPLOYEE");
  const managers = users.filter((user) => user.role.name === "PROJECT_MANAGER");
  const inactiveUsers = users.filter((user) => user.status === "INACTIVE");
  const inactiveClients = clients.filter((client) => client.status === "INACTIVE");

  return (
    <>
      <PageHeader
        title="Administracao"
        description="Central administrativa para cadastros, acessos, clientes, configuracoes e auditoria."
      />

      <section className="grid gap-4 lg:grid-cols-4">
        <AdminMetric title="Usuarios ativos" value={users.length - inactiveUsers.length} detail={`${inactiveUsers.length} inativo(s)`} />
        <AdminMetric title="Funcionarios" value={employees.length} detail={`${managers.length} gestor(es)`} />
        <AdminMetric title="Clientes ativos" value={clients.length - inactiveClients.length} detail={`${inactiveClients.length} inativo(s)`} />
        <AdminMetric title="Projetos cadastrados" value={projects.length} detail={`${projects.filter((project) => project.status === "IN_PROGRESS").length} em andamento`} />
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-lg border border-line bg-white p-5 shadow-soft dark:bg-slate-900">
          <div className="mb-4 flex items-center gap-2">
            <ShieldCheck size={18} className="text-brand-600" />
            <h2 className="text-lg font-bold text-ink">Modulos administrativos</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {adminLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-lg border border-line p-4 transition hover:border-brand-300 hover:bg-brand-50/60 dark:hover:bg-slate-800"
                >
                  <Icon size={20} className="text-brand-600" />
                  <h3 className="mt-3 font-bold text-ink">{item.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="rounded-lg border border-line bg-white p-5 shadow-soft dark:bg-slate-900">
          <h2 className="text-lg font-bold text-ink">Situacao recente</h2>
          <div className="mt-4 grid gap-3">
            <div className="rounded-md border border-line p-3">
              <p className="text-xs font-semibold uppercase text-slate-500">Clientes</p>
              <p className="mt-2 text-sm text-slate-700">
                {clients.slice(0, 3).map((client) => client.name).join(", ") || "Nenhum cliente cadastrado"}
              </p>
            </div>
            <div className="rounded-md border border-line p-3">
              <p className="text-xs font-semibold uppercase text-slate-500">Ultimas alteracoes</p>
              <div className="mt-2 grid gap-2">
                {auditLogs.length ? auditLogs.map((log) => (
                  <div key={log.id} className="text-sm text-slate-700">
                    <strong>{log.action}</strong> em {log.entityType} por {log.actor?.name ?? "Sistema"}
                  </div>
                )) : <p className="text-sm text-slate-500">Sem registros recentes.</p>}
              </div>
            </div>
            <div className="rounded-md border border-line p-3">
              <p className="text-xs font-semibold uppercase text-slate-500">Saude cadastral</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <StatusBadge status={inactiveUsers.length ? "ON_HOLD" : "ACTIVE"} />
                <span className="text-sm text-slate-600">{inactiveUsers.length} usuario(s) inativo(s)</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function AdminMetric({ title, value, detail }: { title: string; value: number; detail: string }) {
  return (
    <div className="rounded-lg border border-line bg-white p-4 shadow-soft dark:bg-slate-900">
      <p className="text-sm text-slate-600">{title}</p>
      <p className="mt-2 text-2xl font-bold text-ink">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{detail}</p>
    </div>
  );
}
