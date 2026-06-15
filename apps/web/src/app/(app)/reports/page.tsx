import { PageHeader } from "@/components/ui/page-header";
import { prisma } from "@/lib/prisma/client";

export default async function ReportsPage() {
  const projects = await prisma.project.findMany({ orderBy: { name: "asc" } });
  return (
    <>
      <PageHeader title="Relatorios" description="Geracao de PDF, Excel e exportacoes compativeis com Microsoft Project." />
      <div className="grid grid-cols-3 gap-4">
        {projects.map((project) => (
          <div key={project.id} className="rounded-lg border border-line bg-white p-4 shadow-soft">
            <h2 className="font-bold">{project.name}</h2>
            <div className="mt-3 grid gap-2 text-sm">
              <a className="text-brand-700" href={`/api/export?projectId=${project.id}&format=excel`}>Excel executivo</a>
              <a className="text-brand-700" href={`/api/export?projectId=${project.id}&format=pdf`}>PDF executivo</a>
              <a className="text-brand-700" href={`/api/export?projectId=${project.id}&format=mspdi`}>MSPDI XML</a>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
