import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { KanbanBoard } from "@/features/kanban/kanban-board";
import { ProjectTabs } from "@/features/projects/project-tabs";
import { prisma } from "@/lib/prisma/client";

export default async function ProjectKanbanPage({ params }: { params: { id: string } }) {
  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: { tasks: { include: { owner: true }, orderBy: { updatedAt: "desc" } } }
  });
  if (!project) notFound();
  const users = await prisma.user.findMany({ where: { status: "ACTIVE" }, orderBy: { name: "asc" } });

  return (
    <>
      <PageHeader title={`Kanban | ${project.name}`} description="Colunas configuradas para o fluxo padrao do Projete-se." action={{ href: `/projects/${project.id}/dashboard`, label: "Painel" }} />
      <ProjectTabs projectId={project.id} />
      <KanbanBoard tasks={project.tasks} users={users} />
    </>
  );
}
