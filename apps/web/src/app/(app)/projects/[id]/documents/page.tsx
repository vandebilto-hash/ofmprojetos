import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma/client";
import { getProjectPeople } from "@/lib/project-people";
import { UnifiedDocumentsClient } from "@/features/documents/unified-documents-client";

export default async function ProjectDocumentsPage({ params }: { params: { id: string } }) {
  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      importantEmails: {
        where: { parentId: null },
        include: {
          attachments: { orderBy: { createdAt: "asc" } },
          replies: { include: { attachments: { orderBy: { createdAt: "asc" } } }, orderBy: { date: "asc" } }
        },
        orderBy: { date: "desc" }
      },
      meetingMinutes: { orderBy: { meetingDate: "desc" } },
      documents: { include: { uploadedBy: true }, orderBy: { createdAt: "desc" } },
      manager: true,
      stakeholders: { orderBy: { name: "asc" } },
      allocations: { include: { user: true } }
    }
  });
  if (!project) notFound();
  const people = getProjectPeople(project);

  return <UnifiedDocumentsClient project={project} people={people} />;
}
