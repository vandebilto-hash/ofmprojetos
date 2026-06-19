import { DialogAction } from "@/components/ui/dialog-action";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import { PageHeader } from "@/components/ui/page-header";
import { PasswordInput } from "@/components/ui/password-input";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { CreateUserForm } from "@/features/admin/create-user-form";
import { prisma } from "@/lib/prisma/client";
import { deleteUserAction, updateUserStatusAction } from "@/server/actions/admin";
import { UsersRound } from "lucide-react";

const roleLabels: Record<string, string> = {
  ADMIN: "Administrador",
  PROJECT_MANAGER: "Gestor",
  EMPLOYEE: "Funcionário",
  CLIENT: "Cliente"
};

function UserAvatar({ name, status }: { name: string; status: string }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
  return (
    <div className="flex items-center gap-2.5">
      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
        status === "ACTIVE"
          ? "bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-200"
          : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
      }`}>
        {initials}
      </span>
      <span className={`font-medium ${status === "ACTIVE" ? "text-ink dark:text-white" : "text-slate-400"}`}>
        {name}
      </span>
    </div>
  );
}

export default async function AdminUsersPage() {
  const [users, clients] = await Promise.all([
    prisma.user.findMany({ include: { role: true, client: true }, orderBy: { name: "asc" } }),
    prisma.client.findMany({ orderBy: { name: "asc" } })
  ]);

  return (
    <>
      <PageHeader
        title="Usuários e funcionários"
        description="Cadastro de funcionários, gestores, administradores e usuários cliente."
        breadcrumb={[{ label: "Administração", href: "/admin" }, { label: "Usuários" }]}
        actions={
          <DialogAction
            title="Criar usuário"
            description="Cadastre acesso, perfil e capacidade do novo usuário. A senha inicial exigirá troca no primeiro login."
            trigger="create"
            triggerLabel="Novo usuário"
          >
            <CreateUserForm>
              <div className="grid gap-1.5">
                <label htmlFor="u-name" className="text-sm font-medium text-slate-700 dark:text-slate-300">Nome</label>
                <input id="u-name" name="name" required minLength={2} className="h-10 rounded-md border border-line px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-[#111c31] dark:text-white" />
              </div>
              <div className="grid gap-1.5">
                <label htmlFor="u-email" className="text-sm font-medium text-slate-700 dark:text-slate-300">E-mail</label>
                <input id="u-email" name="email" type="email" required className="h-10 rounded-md border border-line px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-[#111c31] dark:text-white" />
              </div>
              <div className="grid gap-1.5">
                <label htmlFor="u-pass" className="text-sm font-medium text-slate-700 dark:text-slate-300">Senha inicial (mínimo 8 caracteres)</label>
                <PasswordInput id="u-pass" name="password" required minLength={8} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <label htmlFor="u-role" className="text-sm font-medium text-slate-700 dark:text-slate-300">Perfil</label>
                  <select id="u-role" name="roleName" className="h-10 rounded-md border border-line px-3 text-sm outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-[#111c31] dark:text-white">
                    <option value="CLIENT">Cliente</option>
                    <option value="EMPLOYEE">Funcionário</option>
                    <option value="PROJECT_MANAGER">Gestor</option>
                    <option value="ADMIN">Administrador</option>
                  </select>
                </div>
                <div className="grid gap-1.5">
                  <label htmlFor="u-client" className="text-sm font-medium text-slate-700 dark:text-slate-300">Cliente</label>
                  <select id="u-client" name="clientId" className="h-10 rounded-md border border-line px-3 text-sm outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-[#111c31] dark:text-white">
                    <option value="">Sem cliente</option>
                    {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid gap-1.5">
                <label htmlFor="u-job" className="text-sm font-medium text-slate-700 dark:text-slate-300">Cargo</label>
                <input id="u-job" name="jobTitle" className="h-10 rounded-md border border-line px-3 text-sm outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-[#111c31] dark:text-white" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="grid gap-1.5">
                  <label htmlFor="u-weekly" className="text-sm font-medium text-slate-700 dark:text-slate-300">Semanal (h)</label>
                  <input id="u-weekly" name="weeklyCapacityHours" type="number" defaultValue="40" className="h-10 rounded-md border border-line px-3 text-sm outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-[#111c31] dark:text-white" />
                </div>
                <div className="grid gap-1.5">
                  <label htmlFor="u-daily" className="text-sm font-medium text-slate-700 dark:text-slate-300">Diária (h)</label>
                  <input id="u-daily" name="dailyCapacityHours" type="number" defaultValue="8" className="h-10 rounded-md border border-line px-3 text-sm outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-[#111c31] dark:text-white" />
                </div>
                <div className="grid gap-1.5">
                  <label htmlFor="u-rate" className="text-sm font-medium text-slate-700 dark:text-slate-300">Valor/h</label>
                  <input id="u-rate" name="hourlyRate" type="number" step="0.01" className="h-10 rounded-md border border-line px-3 text-sm outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-[#111c31] dark:text-white" />
                </div>
              </div>
            </CreateUserForm>
          </DialogAction>
        }
      />

      {users.length === 0 ? (
        <EmptyState icon={UsersRound} title="Nenhum usuário cadastrado" description="Crie o primeiro usuário para começar." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-line bg-white shadow-soft dark:bg-[#111c31]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="border-b border-line bg-slate-50 dark:bg-slate-800/40">
                <tr>
                  <th scope="col" className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Usuário</th>
                  <th scope="col" className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">E-mail</th>
                  <th scope="col" className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Perfil</th>
                  <th scope="col" className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Cliente</th>
                  <th scope="col" className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Capacidade</th>
                  <th scope="col" className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                  <th scope="col" className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className={user.status === "INACTIVE" ? "opacity-60" : "hover:bg-slate-50/60 dark:hover:bg-slate-800/30"}
                  >
                    <td className="px-4 py-3">
                      <UserAvatar name={user.name} status={user.status} />
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                        {roleLabels[user.role.name] ?? user.role.name}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{user.client?.name ?? "—"}</td>
                    <td className="px-4 py-3 tabular-nums text-slate-600 dark:text-slate-400">
                      {Number(user.weeklyCapacityHours)}h/sem
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={user.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <form action={updateUserStatusAction}>
                          <input type="hidden" name="userId" value={user.id} />
                          <input type="hidden" name="status" value={user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"} />
                          <button
                            type="submit"
                            className="rounded-md border border-line px-2.5 py-1 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                          >
                            {user.status === "ACTIVE" ? "Inativar" : "Ativar"}
                          </button>
                        </form>
                        <DeleteConfirmationDialog
                          title="Excluir usuário"
                          description={`Deseja realmente excluir ${user.name}? Esta ação não pode ser desfeita.`}
                          entityIdName="userId"
                          entityId={user.id}
                          confirmLabel="Excluir usuário"
                          action={deleteUserAction}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-line px-4 py-2.5 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
            {users.length} usuário{users.length !== 1 ? "s" : ""} cadastrado{users.length !== 1 ? "s" : ""}
          </div>
        </div>
      )}
    </>
  );
}
