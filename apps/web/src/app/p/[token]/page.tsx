import { notFound, redirect } from "next/navigation";
import { portalModuleByKey, portalModules } from "@/features/portal/modules";
import { prisma } from "@/lib/prisma/client";

export default async function PublicProjectIndexPage({ params }: { params: { token: string } }) {
  const shareLink = await prisma.projectShareLink.findUnique({
    where: { token: params.token },
    include: {
      project: {
        include: {
          moduleSettings: {
            orderBy: { sortOrder: "asc" }
          }
        }
      }
    }
  });

  if (!shareLink?.active) notFound();
  if (shareLink.expiresAt && shareLink.expiresAt < new Date()) notFound();

  const settingsByKey = new Map(shareLink.project.moduleSettings.map((module) => [module.key, module]));
  const hasSavedSettings = shareLink.project.moduleSettings.length > 0;
  const firstModule = portalModules.find((module) => {
    const setting = settingsByKey.get(module.key);
    if (!portalModuleByKey(module.key)) return false;
    if (hasSavedSettings && !setting) return false;
    return !setting || (setting.enabled && setting.visibleToClient);
  })?.key;
  if (!firstModule) notFound();
  redirect(`/p/${params.token}/${firstModule}`);
}
