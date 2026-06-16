import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma/client";
import { canManageProject } from "@/lib/permissions/rbac";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!canManageProject(session?.user.role)) {
    return NextResponse.json({ error: "Sem permissao." }, { status: 403 });
  }

  const { shareLinkId, projectId, allowedEmails } = await request.json();

  if (!shareLinkId || !projectId) {
    return NextResponse.json({ error: "Dados invalidos." }, { status: 400 });
  }

  await prisma.projectShareLink.update({
    where: { id: shareLinkId },
    data: { allowedEmails: allowedEmails || null }
  });

  return NextResponse.json({ ok: true });
}
