import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth/options";
import { statusLabel } from "@/lib/labels";
import { prisma } from "@/lib/prisma/client";

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "";
  return new Intl.DateTimeFormat("pt-BR").format(new Date(value));
}

function formatNumber(value: unknown) {
  return Number(value ?? 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function csvCell(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });

  const q = request.nextUrl.searchParams.get("q")?.trim();
  const status = request.nextUrl.searchParams.get("status")?.trim();

  const projects = await prisma.project.findMany({
    where: {
      ...(session.user.role === "CLIENT" ? { clientId: session.user.clientId ?? "__none__" } : {}),
      ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
      ...(status ? { status: status as never } : {}),
    },
    include: {
      client: true,
      manager: true,
      _count: { select: { tasks: true, blockers: true, risks: true, pendingIssues: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const headers = [
    "ID",
    "Projeto",
    "Cliente",
    "Gestor",
    "Status",
    "Inicio planejado",
    "Fim planejado",
    "Fim atual",
    "Progresso (%)",
    "Horas planejadas",
    "Horas trabalhadas",
    "Horas restantes",
    "Custo financeiro",
    "Tarefas",
    "Bloqueios",
    "Riscos",
    "Pendencias",
    "Criado em",
    "Atualizado em",
    "Observacoes",
  ];

  const rows = projects.map((project) => [
    project.id,
    project.name,
    project.client.name,
    project.manager.name,
    statusLabel(project.status),
    formatDate(project.plannedStart),
    formatDate(project.plannedEnd),
    formatDate(project.currentEnd),
    formatNumber(project.progressPercent),
    formatNumber(project.plannedHours),
    formatNumber(project.actualHours),
    formatNumber(project.remainingHours),
    formatNumber(project.financialCost),
    project._count.tasks,
    project._count.blockers,
    project._count.risks,
    project._count.pendingIssues,
    formatDate(project.createdAt),
    formatDate(project.updatedAt),
    project.notes ?? "",
  ]);

  const csv = [headers, ...rows].map((row) => row.map(csvCell).join(";")).join("\r\n");
  const filename = `projetos-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(`\uFEFF${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
