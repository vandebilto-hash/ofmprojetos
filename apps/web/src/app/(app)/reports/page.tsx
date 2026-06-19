import { FileBarChart, FileSpreadsheet, FileText, FileCode2, FolderOpen } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { prisma } from "@/lib/prisma/client";

const exportFormats = [
  {
    format: "excel",
    icon: FileSpreadsheet,
    label: "Excel Executivo",
    desc: "Resumo executivo com métricas, tarefas e cronograma",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-500/10"
  },
  {
    format: "pdf",
    icon: FileText,
    label: "PDF Executivo",
    desc: "Relatório para impressão e apresentação",
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-500/10"
  },
  {
    format: "mspdi",
    icon: FileCode2,
    label: "MSPDI XML",
    desc: "Exportação compatível com Microsoft Project",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-500/10"
  }
] as const;

export default async function ReportsPage() {
  const projects = await prisma.project.findMany({
    include: { client: true },
    orderBy: { name: "asc" }
  });

  return (
    <>
      <PageHeader
        title="Relatórios"
        description="Geração de PDF, Excel e exportações compatíveis com Microsoft Project."
      />

      {projects.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="Nenhum projeto disponível"
          description="Crie um projeto para gerar relatórios e exportações."
          action={{ label: "Novo projeto", href: "/projects/new" }}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <div
              key={project.id}
              className="rounded-xl border border-line bg-white shadow-soft transition-shadow hover:shadow-card dark:bg-[#111c31]"
            >
              {/* Card header */}
              <div className="border-b border-line p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink dark:text-white">{project.name}</p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{project.client.name}</p>
                  </div>
                  <StatusBadge status={project.status} />
                </div>
              </div>

              {/* Export links */}
              <div className="divide-y divide-line">
                {exportFormats.map(({ format, icon: Icon, label, desc, color, bg }) => (
                  <a
                    key={format}
                    href={`/api/export?projectId=${project.id}&format=${format}`}
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    download
                  >
                    <span className={`rounded-lg p-2 ${bg}`}>
                      <Icon size={16} className={color} aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-ink dark:text-white">{label}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{desc}</p>
                    </div>
                    <FileBarChart size={14} className="shrink-0 text-slate-400" aria-hidden="true" />
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
