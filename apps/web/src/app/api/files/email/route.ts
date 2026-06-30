import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
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
  const emailId = request.nextUrl.searchParams.get("emailId");
  const attachmentId = request.nextUrl.searchParams.get("attachmentId");
  const session = await getServerSession(authOptions);
  const canAccessInternal = canManageProject(session?.user.role);

  if (attachmentId) {
    const attachment = await prisma.importantEmailAttachment.findUnique({ where: { id: attachmentId }, include: { email: true } });
    if (!attachment) return new NextResponse("Arquivo nao encontrado.", { status: 404 });
    if (!canAccessInternal && attachment.email.visibility !== "CLIENT_VISIBLE") return new NextResponse("Sem permissao para acessar este arquivo.", { status: 403 });
    if (!attachment.fileUrl.startsWith("data:")) return NextResponse.redirect(attachment.fileUrl);
    return responseFromDataUrl(attachment.fileUrl, attachment.name);
  }

  if (emailId) {
    const email = await prisma.importantEmail.findUnique({ where: { id: emailId } });
    if (!email?.attachmentUrl) return new NextResponse("Arquivo nao encontrado.", { status: 404 });
    if (!canAccessInternal && email.visibility !== "CLIENT_VISIBLE") return new NextResponse("Sem permissao para acessar este arquivo.", { status: 403 });
    if (!email.attachmentUrl.startsWith("data:")) return NextResponse.redirect(email.attachmentUrl);
    return responseFromDataUrl(email.attachmentUrl, `${email.subject}.pdf`);
  }

  return new NextResponse("Informe o arquivo solicitado.", { status: 400 });
}
