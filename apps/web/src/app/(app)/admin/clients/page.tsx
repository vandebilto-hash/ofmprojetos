import { DialogAction } from "@/components/ui/dialog-action";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { prisma } from "@/lib/prisma/client";
import { createClientAction, deleteClientAction, updateClientStatusAction } from "@/server/actions/admin";

export default async function AdminClientsPage() {
  const clients = await prisma.client.findMany({ include: { projects: true, users: true }, orderBy: { name: "asc" } });
  return (
    <>
      <PageHeader title="Clientes" description="Cadastro de clientes e vinculos com projetos e usuarios." />
      <div className="mb-4 flex justify-end">
        <DialogAction title="Criar cliente" description="Cadastre dados comerciais e contato principal." trigger="create" triggerLabel="Novo cliente">
          <form action={createClientAction} className="grid gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Dados do cliente</p>
              <div className="mt-2 grid gap-3">
                <label className="grid gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
                  Nome do cliente <span className="text-red-500">*</span>
                  <input name="name" required className="h-10 rounded-md border border-line bg-white px-3 text-sm text-ink outline-none transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-[#0f172a] dark:text-white" placeholder="Nome do cliente" />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="grid gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
                    CNPJ/Identificador
                    <input name="identifier" className="h-10 rounded-md border border-line bg-white px-3 text-sm text-ink outline-none transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-[#0f172a] dark:text-white" placeholder="00.000.000/0001-00" />
                  </label>
                  <label className="grid gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
                    Responsável principal
                    <input name="mainContact" className="h-10 rounded-md border border-line bg-white px-3 text-sm text-ink outline-none transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-[#0f172a] dark:text-white" placeholder="Nome do responsável" />
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label className="grid gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
                    E-mail
                    <input name="email" type="email" className="h-10 rounded-md border border-line bg-white px-3 text-sm text-ink outline-none transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-[#0f172a] dark:text-white" placeholder="email@exemplo.com" />
                  </label>
                  <label className="grid gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
                    Telefone
                    <input name="phone" className="h-10 rounded-md border border-line bg-white px-3 text-sm text-ink outline-none transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-[#0f172a] dark:text-white" placeholder="(00) 00000-0000" />
                  </label>
                </div>
                <label className="grid gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
                  Observações
                  <textarea name="notes" rows={3} className="min-h-[80px] rounded-md border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-[#0f172a] dark:text-white" placeholder="Notas adicionais" />
                </label>
              </div>
            </div>
            <div className="flex justify-end border-t border-line pt-3 dark:border-slate-700">
              <button type="submit" className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-brand-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-700">
                Criar cliente
              </button>
            </div>
          </form>
        </DialogAction>
      </div>
      <div className="grid gap-3">
        {clients.map((client) => (
          <div key={client.id} className="rounded-lg border border-line bg-white p-4 shadow-soft">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-bold">{client.name}</h2>
                <p className="mt-1 text-sm text-slate-600">{client.identifier ?? "Sem identificador"} | {client.mainContact ?? "Sem responsavel"}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={client.status} />
                <form action={updateClientStatusAction}>
                  <input type="hidden" name="clientId" value={client.id} />
                  <input type="hidden" name="status" value={client.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"} />
                  <button className="rounded-md border border-line px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                    {client.status === "ACTIVE" ? "Inativar" : "Ativar"}
                  </button>
                </form>
                <DeleteConfirmationDialog
                  title="Excluir cliente"
                  description={`Deseja realmente excluir ${client.name}?`}
                  entityIdName="clientId"
                  entityId={client.id}
                  confirmLabel="Excluir cliente"
                  action={deleteClientAction}
                />
              </div>
            </div>
            <p className="mt-2 text-sm text-slate-600">{client.email ?? "-"} | {client.phone ?? "-"}</p>
            <p className="mt-2 text-xs text-slate-500">{client.projects.length} projetos | {client.users.length} usuarios cliente</p>
            {client.notes ? <p className="mt-2 text-sm text-slate-500">{client.notes}</p> : null}
          </div>
        ))}
      </div>
    </>
  );
}
