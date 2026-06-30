import { unstable_noStore as noStore } from "next/cache";
import { cookies, headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { PublicPortalModule, PublicPortalShell } from "@/features/portal/public-portal";
import { portalModuleByKey, portalModules, portalModuleSettingFor } from "@/features/portal/modules";
import { prisma } from "@/lib/prisma/client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PublicProjectModulePage({ params }: { params: { token: string; module: string } }) {
  noStore();
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
          importantEmails: {
            where: { parentId: null, visibility: "CLIENT_VISIBLE" },
            include: {
              attachments: { orderBy: { createdAt: "asc" } },
              replies: { where: { visibility: "CLIENT_VISIBLE" }, include: { attachments: { orderBy: { createdAt: "asc" } } }, orderBy: { date: "asc" } }
            },
            orderBy: { date: "desc" }
          },
          meetingMinutes: { where: { visibility: "CLIENT_VISIBLE" }, orderBy: { meetingDate: "desc" } },
          todos: {
            where: { visibleToClient: true },
            include: { task: true, risk: true, blocker: true, pendingIssue: true },
            orderBy: [{ priority: "desc" }, { dueDate: "asc" }]
          },
          risks: { orderBy: [{ classification: "desc" }, { registeredAt: "desc" }] },
          pendingIssues: { include: { risk: true }, orderBy: [{ priority: "desc" }, { dueDate: "asc" }] },
          tasks: {
            include: {
              owner: true,
              allocations: { include: { user: true } },
              predecessors: { include: { predecessor: true } }
            },
            orderBy: [{ wbsCode: "asc" }, { plannedStart: "asc" }]
          },
          blockers: { orderBy: { openedAt: "desc" } },
          baselines: { include: { tasks: true }, orderBy: [{ isActive: "desc" }, { createdAt: "desc" }] },
          allocations: { include: { user: true, task: true }, orderBy: { startDate: "asc" } },
          delays: { include: { task: true }, orderBy: { createdAt: "desc" } },
          replannings: { include: { task: true }, orderBy: { createdAt: "desc" } }
        }
      }
    }
  });

  if (!shareLink?.active) notFound();
  if (shareLink.expiresAt && shareLink.expiresAt < new Date()) notFound();

  if (shareLink.allowedEmails) {
    const allowedList = shareLink.allowedEmails
      .split(",")
      .map((e: string) => e.trim().toLowerCase())
      .filter(Boolean);

    if (allowedList.length > 0) {
      const cookieStore = await cookies();
      const hasAccess = cookieStore.get(`portal_access_${params.token}`)?.value;

      if (!hasAccess) {
        redirect(`/p/${params.token}/gate`);
      }
    }
  }

  const settingsByKey = new Map(shareLink.project.moduleSettings.map((module) => [module.key, module]));
  const hasSavedSettings = shareLink.project.moduleSettings.length > 0;
  const visibleModules = portalModules
    .map((module) => {
      const setting = portalModuleSettingFor(settingsByKey, module.key);
      if (hasSavedSettings && !setting) return null;
      if (setting && (!setting.enabled || !setting.visibleToClient)) return null;
      return { key: module.key, label: module.key === "dashboard" ? module.label : setting?.label ?? module.label };
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
