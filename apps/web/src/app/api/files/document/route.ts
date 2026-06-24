import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth/options";
import { canManageProject } from "@/lib/permissions/rbac";
import { prisma } from "@/lib/prisma/client";

export const runtime = "nodejs";

function safeFileName(name: string) {
  return name.replace(/[\\/:*?"<>|]/g, "-").slice(0, 120) || "arquivo";
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
  const documentId = request.nextUrl.searchParams.get("documentId");
  if (!documentId) return new NextResponse("Informe o documento solicitado.", { status: 400 });

  const document = await prisma.document.findUnique({ where: { id: documentId } });
  if (!document?.downloadUrl && !document?.externalUrl) return new NextResponse("Documento nao encontrado.", { status: 404 });

  const session = await getServerSession(authOptions);
  const canAccessInternal = canManageProject(session?.user.role);
  const canAccessPublic = document.visibility === "CLIENT_VISIBLE" && document.clientDownloadAllowed;
  if (!canAccessInternal && !canAccessPublic) return new NextResponse("Sem permissao para acessar este documento.", { status: 403 });

  const fileUrl = document.downloadUrl ?? document.externalUrl!;
  if (!fileUrl.startsWith("data:")) return NextResponse.redirect(fileUrl);
  return responseFromDataUrl(fileUrl, document.name);
}
