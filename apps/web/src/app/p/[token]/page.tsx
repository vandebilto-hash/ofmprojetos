import { unstable_noStore as noStore } from "next/cache";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { portalModuleByKey, portalModules, portalModuleSettingFor } from "@/features/portal/modules";
import { prisma } from "@/lib/prisma/client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PublicProjectIndexPage({ params }: { params: { token: string } }) {
  noStore();
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
  const firstModule = portalModules.find((module) => {
    const setting = portalModuleSettingFor(settingsByKey, module.key);
    if (!portalModuleByKey(module.key)) return false;
    if (hasSavedSettings && !setting) return false;
    return !setting || (setting.enabled && setting.visibleToClient);
  })?.key;
  if (!firstModule) notFound();
  redirect(`/p/${params.token}/${firstModule}`);
}
