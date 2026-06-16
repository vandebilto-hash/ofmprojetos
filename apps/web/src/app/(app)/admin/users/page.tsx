import { DialogAction } from "@/components/ui/dialog-action";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { CreateUserForm } from "@/features/admin/create-user-form";
import { prisma } from "@/lib/prisma/client";
import { deleteUserAction, updateUserStatusAction } from "@/server/actions/admin";

export default async function AdminUsersPage() {
  const [users, clients] = await Promise.all([
    prisma.user.findMany({ include: { role: true, client: true }, orderBy: { name: "asc" } }),
    prisma.client.findMany({ orderBy: { name: "asc" } })
  ]);

  return (
    <>
      <PageHeader title="Usuarios e funcionarios" description="Cadastro de funcionarios, gestores, administradores e usuarios cliente." />
      <div className="mb-4 flex justify-end">
        <DialogAction title="Criar usuario" description="Cadastre acesso, perfil e capacidade do novo usuario. A senha inicial exigira troca no primeiro login." trigger="create" triggerLabel="Novo usuario">
          <CreateUserForm>
            <label className="grid gap-1 text-sm font-medium">
              Nome
              <input name="name" required minLength={2} className="h-10 rounded-md border border-line px-3" />
            </label>
            <label className="grid gap-1 text-sm font-medium">
              E-mail
              <input name="email" type="email" required className="h-10 rounded-md border border-line px-3" />
            </label>
            <label className="grid gap-1 text-sm font-medium">
              Senha inicial (minimo 8 caracteres)
              <input name="password" type="password" required minLength={8} className="h-10 rounded-md border border-line px-3" />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-1 text-sm font-medium">
                Perfil
                <select name="roleName" className="h-10 rounded-md border border-line px-3">
                  <option value="CLIENT">Cliente</option>
                  <option value="EMPLOYEE">Funcionario</option>
                  <option value="PROJECT_MANAGER">Gestor</option>
                  <option value="ADMIN">Administrador</option>
                </select>
              </label>
              <label className="grid gap-1 text-sm font-medium">
                Cliente
                <select name="clientId" className="h-10 rounded-md border border-line px-3">
                  <option value="">Sem cliente</option>
                  {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
                </select>
              </label>
            </div>
            <label className="grid gap-1 text-sm font-medium">
              Cargo
              <input name="jobTitle" className="h-10 rounded-md border border-line px-3" />
            </label>
            <div className="grid grid-cols-3 gap-3">
              <label className="grid gap-1 text-sm font-medium">
                Capacidade semanal
                <input name="weeklyCapacityHours" type="number" defaultValue="40" className="h-10 rounded-md border border-line px-3" />
              </label>
              <label className="grid gap-1 text-sm font-medium">
                Capacidade diaria
                <input name="dailyCapacityHours" type="number" defaultValue="8" className="h-10 rounded-md border border-line px-3" />
              </label>
              <label className="grid gap-1 text-sm font-medium">
                Valor/hora
                <input name="hourlyRate" type="number" step="0.01" className="h-10 rounded-md border border-line px-3" />
              </label>
            </div>
          </CreateUserForm>
        </DialogAction>
      </div>
      <div className="overflow-hidden rounded-lg border border-line bg-white shadow-soft">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-3 py-3">Nome</th>
              <th className="px-3 py-3">E-mail</th>
              <th className="px-3 py-3">Perfil</th>
              <th className="px-3 py-3">Cliente</th>
              <th className="px-3 py-3">Capacidade</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3 text-right">Acoes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-3 py-3 font-semibold">{user.name}</td>
                <td className="px-3 py-3">{user.email}</td>
                <td className="px-3 py-3">{user.role.name}</td>
                <td className="px-3 py-3">{user.client?.name ?? "-"}</td>
                <td className="px-3 py-3">{Number(user.weeklyCapacityHours)}h/sem | {Number(user.dailyCapacityHours)}h/dia</td>
                <td className="px-3 py-3"><StatusBadge status={user.status} /></td>
                <td className="px-3 py-3">
                  <div className="flex justify-end gap-2">
                    <form action={updateUserStatusAction}>
                      <input type="hidden" name="userId" value={user.id} />
                      <input type="hidden" name="status" value={user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"} />
                      <button className="rounded-md border border-line px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                        {user.status === "ACTIVE" ? "Inativar" : "Ativar"}
                      </button>
                    </form>
                    <DeleteConfirmationDialog
                      title="Excluir usuario"
                      description={`Deseja realmente excluir ${user.name}?`}
                      entityIdName="userId"
                      entityId={user.id}
                      confirmLabel="Excluir usuario"
                      action={deleteUserAction}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
