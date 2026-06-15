import { PageHeader } from "@/components/ui/page-header";
import { prisma } from "@/lib/prisma/client";
import { updateSystemSettingsAction } from "@/server/actions/admin";

export default async function SettingsPage() {
  const settings = await prisma.systemSetting.findMany();
  const values = Object.fromEntries(settings.map((setting) => [setting.key, setting.value]));

  return (
    <>
      <PageHeader title="Configuracoes" description="Parametros gerais usados como padrao para novos cadastros e operacao administrativa." />
      <form action={updateSystemSettingsAction} className="rounded-lg border border-line bg-white p-5 shadow-soft dark:bg-slate-900">
        <div className="grid gap-4 lg:grid-cols-3">
          <label className="grid gap-1 text-sm font-medium">
            Nome da empresa
            <input
              name="companyName"
              defaultValue={String(values.companyName ?? "Projete-se")}
              className="h-10 rounded-md border border-line px-3"
            />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Capacidade semanal padrao
            <input
              name="defaultWeeklyCapacityHours"
              type="number"
              min="1"
              max="168"
              defaultValue={String(values.defaultWeeklyCapacityHours ?? 40)}
              className="h-10 rounded-md border border-line px-3"
            />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Capacidade diaria padrao
            <input
              name="defaultDailyCapacityHours"
              type="number"
              min="1"
              max="24"
              defaultValue={String(values.defaultDailyCapacityHours ?? 8)}
              className="h-10 rounded-md border border-line px-3"
            />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Moeda padrao
            <input
              name="defaultCurrency"
              maxLength={3}
              defaultValue={String(values.defaultCurrency ?? "BRL")}
              className="h-10 rounded-md border border-line px-3 uppercase"
            />
          </label>
          <label className="flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm font-medium">
            <input
              name="allowClientReports"
              type="checkbox"
              defaultChecked={Boolean(values.allowClientReports ?? true)}
              className="h-4 w-4"
            />
            Permitir relatorios compartilhaveis para clientes
          </label>
          <label className="flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm font-medium">
            <input
              name="requirePasswordChange"
              type="checkbox"
              defaultChecked={Boolean(values.requirePasswordChange ?? true)}
              className="h-4 w-4"
            />
            Exigir troca de senha inicial
          </label>
        </div>
        <div className="mt-5 flex justify-end">
          <button className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
            Salvar configuracoes
          </button>
        </div>
      </form>
    </>
  );
}
