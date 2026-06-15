import { PageHeader } from "@/components/ui/page-header";
import { DialogAction } from "@/components/ui/dialog-action";
import { ResourceMatrix } from "@/features/resources/resource-matrix";
import { prisma } from "@/lib/prisma/client";
import { createResourceAction } from "@/server/actions/projects";

export default async function ResourcesPage() {
  const users = await prisma.user.findMany({
    where: { status: "ACTIVE", role: { name: { in: ["EMPLOYEE", "PROJECT_MANAGER"] } } },
    include: {
      allocations: { include: { project: true, task: true } },
      ownedTasks: { include: { project: true } }
    },
    orderBy: { name: "asc" }
  });

  return (
    <>
      <PageHeader title="Recursos" description="Capacidade semanal, horas livres e sobrealocacao." />
      <div className="mb-4 flex justify-end">
        <DialogAction title="Novo recurso" description="Cadastre um recurso para alocacao em projetos e calculo de custo." trigger="create" triggerLabel="Novo recurso">
          <form action={createResourceAction} className="grid gap-3">
            <label className="grid gap-1 text-sm font-medium">Nome<input name="name" required className="h-10 rounded-md border border-line px-3" /></label>
            <label className="grid gap-1 text-sm font-medium">E-mail<input name="email" type="email" className="h-10 rounded-md border border-line px-3" /></label>
            <label className="grid gap-1 text-sm font-medium">Cargo<input name="jobTitle" className="h-10 rounded-md border border-line px-3" /></label>
            <div className="grid grid-cols-3 gap-3">
              <label className="grid gap-1 text-sm font-medium">Capacidade semanal<input name="weeklyCapacityHours" type="number" step="0.01" defaultValue="40" className="h-10 rounded-md border border-line px-3" /></label>
              <label className="grid gap-1 text-sm font-medium">Capacidade diaria<input name="dailyCapacityHours" type="number" step="0.01" defaultValue="8" className="h-10 rounded-md border border-line px-3" /></label>
              <label className="grid gap-1 text-sm font-medium">Taxa por hora<input name="hourlyRate" type="number" step="0.01" defaultValue="0" className="h-10 rounded-md border border-line px-3" /></label>
            </div>
            <button className="w-fit rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white">Cadastrar recurso</button>
          </form>
        </DialogAction>
      </div>
      <ResourceMatrix users={users} />
    </>
  );
}
