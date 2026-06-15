import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { PublicPortalModule, PublicPortalShell } from "@/features/portal/public-portal";
import { portalModuleByKey, portalModules } from "@/features/portal/modules";
import { prisma } from "@/lib/prisma/client";

export default async function PublicProjectModulePage({ params }: { params: { token: string; module: string } }) {
  const requestedModule = portalModuleByKey(params.module);
  if (!requestedModule) notFound();

  const shareLink = await prisma.projectShareLink.findUnique({
    where: { token: params.token },
    include: {
      project: {
        include: {
          client: true,
          manager: true,
          moduleSettings: { orderBy: { sortOrder: "asc" } },
          home: true,
          partners: { orderBy: { name: "asc" } },
          stakeholders: { where: { active: true }, orderBy: { name: "asc" } },
          milestones: { orderBy: { plannedDate: "asc" } },
          documents: {
            where: { visibility: "CLIENT_VISIBLE", clientDownloadAllowed: true },
            orderBy: { createdAt: "desc" }
          },
          importantEmails: { orderBy: { date: "desc" } },
          meetingMinutes: { orderBy: { meetingDate: "desc" } },
          todos: { orderBy: [{ priority: "desc" }, { dueDate: "asc" }] },
          risks: { orderBy: [{ classification: "desc" }, { registeredAt: "desc" }] },
          tasks: {
            include: {
              owner: true,
              predecessors: { include: { predecessor: true } }
            },
            orderBy: [{ wbsCode: "asc" }, { plannedStart: "asc" }]
          },
          blockers: { orderBy: { openedAt: "desc" } }
        }
      }
    }
  });

  if (!shareLink?.active) notFound();
  if (shareLink.expiresAt && shareLink.expiresAt < new Date()) notFound();

  const settingsByKey = new Map(shareLink.project.moduleSettings.map((module) => [module.key, module]));
  const hasSavedSettings = shareLink.project.moduleSettings.length > 0;
  const visibleModules = portalModules
    .map((module) => {
      const setting = settingsByKey.get(module.key);
      if (hasSavedSettings && !setting) return null;
      if (setting && (!setting.enabled || !setting.visibleToClient)) return null;
      return { key: module.key, label: setting?.label ?? module.label };
    })
    .filter(Boolean) as Array<{ key: string; label: string }>;
  const activeModule = visibleModules.find((module) => module.key === params.module);
  if (!activeModule) notFound();

  const requestHeaders = headers();
  await prisma.clientAccessLog.create({
    data: {
      projectId: shareLink.projectId,
      shareLinkId: shareLink.id,
      ip: requestHeaders.get("x-forwarded-for"),
      userAgent: requestHeaders.get("user-agent")
    }
  });

  return (
    <PublicPortalShell token={params.token} project={shareLink.project} modules={visibleModules} activeModule={params.module}>
      <PublicPortalModule moduleKey={params.module} project={shareLink.project} />
    </PublicPortalShell>
  );
}
