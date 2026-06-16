import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";

export async function POST(request: NextRequest) {
  const { token, email } = await request.json();

  if (!token || !email) {
    return NextResponse.json({ error: "Token e e-mail sao obrigatorios." }, { status: 400 });
  }

  const shareLink = await prisma.projectShareLink.findUnique({
    where: { token }
  });

  if (!shareLink?.active) {
    return NextResponse.json({ error: "Link invalido ou inativo." }, { status: 404 });
  }

  if (shareLink.expiresAt && shareLink.expiresAt < new Date()) {
    return NextResponse.json({ error: "Link expirado." }, { status: 404 });
  }

  if (shareLink.allowedEmails) {
    const allowedList = shareLink.allowedEmails
      .split(",")
      .map((e: string) => e.trim().toLowerCase())
      .filter(Boolean);

    if (allowedList.length > 0 && !allowedList.includes(email.trim().toLowerCase())) {
      return NextResponse.json({ error: "E-mail nao autorizado para acesso a este portal." }, { status: 403 });
    }
  }

  await prisma.clientAccessLog.create({
    data: {
      projectId: shareLink.projectId,
      shareLinkId: shareLink.id,
      userAgent: request.headers.get("user-agent") || null
    }
  });

  const response = NextResponse.json({ ok: true });
  response.cookies.set(`portal_access_${token}`, "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: `/p/${token}`
  });

  return response;
}
