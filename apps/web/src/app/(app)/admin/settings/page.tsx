import { PageHeader } from "@/components/ui/page-header";
import { prisma } from "@/lib/prisma/client";
import { updateSystemSettingsAction } from "@/server/actions/admin";

export default async function SettingsPage() {
  const settings = await prisma.systemSetting.findMany();
  const values = Object.fromEntries(settings.map((setting) => [setting.key, setting.value]));

  return (
    <>
      <PageHeader title="Configuracoes" description="Parametros gerais usados como padrao para novos cadastros e operacao administrativa." />
      <form action={updateSystemSettingsAction} className="rounded-lg border border-line bg-white p-6 shadow-soft dark:border-slate-700 dark:bg-[#111c31]">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Parâmetros gerais</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <label className="grid gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
            Nome da empresa
            <input
              name="companyName"
              defaultValue={String(values.companyName ?? "Projete-se")}
              className="h-10 w-full rounded-md border border-line bg-white px-3 text-sm text-ink outline-none transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-[#0f172a] dark:text-white"
            />
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
            Capacidade semanal padrão
            <input
              name="defaultWeeklyCapacityHours"
              type="number"
              min="1"
              max="168"
              defaultValue={String(values.defaultWeeklyCapacityHours ?? 40)}
              className="h-10 w-full rounded-md border border-line bg-white px-3 text-sm text-ink outline-none transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-[#0f172a] dark:text-white"
            />
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
            Capacidade diária padrão
            <input
              name="defaultDailyCapacityHours"
              type="number"
              min="1"
              max="24"
              defaultValue={String(values.defaultDailyCapacityHours ?? 8)}
              className="h-10 w-full rounded-md border border-line bg-white px-3 text-sm text-ink outline-none transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-[#0f172a] dark:text-white"
            />
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
            Moeda padrão
            <input
              name="defaultCurrency"
              maxLength={3}
              defaultValue={String(values.defaultCurrency ?? "BRL")}
              className="h-10 w-full rounded-md border border-line bg-white px-3 text-sm text-ink uppercase outline-none transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-[#0f172a] dark:text-white"
            />
          </label>
          <label className="flex items-center gap-3 rounded-md border border-line px-4 py-3 text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-300">
            <input
              name="allowClientReports"
              type="checkbox"
              defaultChecked={Boolean(values.allowClientReports ?? true)}
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            Permitir relatórios compartilháveis para clientes
          </label>
          <label className="flex items-center gap-3 rounded-md border border-line px-4 py-3 text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-300">
            <input
              name="requirePasswordChange"
              type="checkbox"
              defaultChecked={Boolean(values.requirePasswordChange ?? true)}
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            Exigir troca de senha inicial
          </label>
        </div>
        <div className="mt-6 flex justify-end border-t border-line pt-4 dark:border-slate-700">
          <button className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-brand-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-700">
            Salvar configurações
          </button>
        </div>
      </form>
    </>
  );
}
