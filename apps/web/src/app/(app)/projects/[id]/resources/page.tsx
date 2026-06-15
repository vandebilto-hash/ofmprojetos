import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { ProjectTabs } from "@/features/projects/project-tabs";
import { ResourceAllocationEditor } from "@/features/resources/resource-allocation-editor";
import { ResourceMatrix } from "@/features/resources/resource-matrix";
import { prisma } from "@/lib/prisma/client";

export default async function ProjectResourcesPage({ params }: { params: { id: string } }) {
  const project = await prisma.project.findUnique({ where: { id: params.id } });
  if (!project) notFound();

  const [users, allUsers, tasks, allocations] = await Promise.all([
    prisma.user.findMany({
    where: {
      status: "ACTIVE",
      OR: [
        { allocations: { some: { projectId: params.id } } },
        { ownedTasks: { some: { projectId: params.id } } }
      ]
    },
    include: {
      allocations: { where: { projectId: params.id }, include: { project: true, task: true } },
      ownedTasks: { where: { projectId: params.id }, include: { project: true } }
    },
    orderBy: { name: "asc" }
    }),
    prisma.user.findMany({ where: { status: "ACTIVE" }, orderBy: { name: "asc" } }),
    prisma.task.findMany({ where: { projectId: params.id }, orderBy: { name: "asc" } }),
    prisma.resourceAllocation.findMany({
      where: { projectId: params.id },
      include: { user: true, task: true },
      orderBy: { startDate: "asc" }
    })
  ]);

  return (
    <>
      <PageHeader title={`Recursos | ${project.name}`} description="Capacidade, alocacao e sobrealocacao destacada em vermelho." />
      <ProjectTabs projectId={project.id} />
      <ResourceAllocationEditor projectId={project.id} allocations={allocations} users={allUsers} tasks={tasks} />
      <div className="mt-5" />
      <ResourceMatrix users={users} />
    </>
  );
}
