import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth/options";
import { canManageProject } from "@/lib/permissions/rbac";
import { prisma } from "@/lib/prisma/client";

export const runtime = "nodejs";

function safeFileName(name: string) {
  return name.replace(/[\\/:*?"<>|]/g, "-").slice(0, 120) || "ata";
}

function responseFromDataUrl(dataUrl: string, fileName: string) {
  const commaIndex = dataUrl.indexOf(",");
  if (!dataUrl.startsWith("data:") || commaIndex < 0) return new NextResponse("Arquivo invalido.", { status: 400 });

  const metadata = dataUrl.slice(5, commaIndex);
  const contentType = metadata.split(";")[0] || "application/octet-stream";
  const isBase64 = metadata.includes(";base64");
  const payload = dataUrl.slice(commaIndex + 1);
  const body = isBase64 ? Buffer.from(payload, "base64") : Buffer.from(decodeURIComponent(payload));

  return new NextResponse(body, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `inline; filename="${safeFileName(fileName)}"`,
      "Cache-Control": "private, max-age=300"
    }
  });
}

export async function GET(request: NextRequest) {
  const minuteId = request.nextUrl.searchParams.get("minuteId");
  if (!minuteId) return new NextResponse("Informe a ata solicitada.", { status: 400 });

  const minute = await prisma.meetingMinute.findUnique({ where: { id: minuteId } });
  if (!minute?.fileUrl) return new NextResponse("Ata nao encontrada.", { status: 404 });

  const session = await getServerSession(authOptions);
  const canAccessInternal = canManageProject(session?.user.role);
  if (!canAccessInternal && minute.visibility !== "CLIENT_VISIBLE") return new NextResponse("Sem permissao para acessar esta ata.", { status: 403 });

  if (!minute.fileUrl.startsWith("data:")) return NextResponse.redirect(minute.fileUrl);
  return responseFromDataUrl(minute.fileUrl, minute.title);
}
