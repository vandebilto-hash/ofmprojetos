import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { ProjectForm } from "@/features/projects/project-form";
import { authOptions } from "@/lib/auth/options";
import { canManageProject } from "@/lib/permissions/rbac";
import { prisma } from "@/lib/prisma/client";

export default async function NewProjectPage() {
  const session = await getServerSession(authOptions);
  if (!canManageProject(session?.user.role)) redirect("/projects");

  const [clients, managers] = await Promise.all([
    prisma.client.findMany({ orderBy: { name: "asc" } }),
    prisma.user.findMany({
      where: { role: { name: { in: ["ADMIN", "PROJECT_MANAGER"] } }, status: "ACTIVE" },
      orderBy: { name: "asc" }
    })
  ]);

  return (
    <>
      <PageHeader title="Novo projeto" description="Cadastro completo com cliente, gestor e datas principais." />
      <ProjectForm clients={clients} managers={managers} />
    </>
  );
}
