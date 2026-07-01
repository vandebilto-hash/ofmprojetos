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

function escapeXml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function msProjectDate(value: Date | string | null | undefined) {
  return value ? new Date(value).toISOString() : new Date().toISOString();
}

function buildProjectsMspdiXml(projects: Awaited<ReturnType<typeof getProjectsForExport>>) {
  const tasks = projects
    .map((project, index) => {
      const uid = index + 1;
      return `
    <Task>
      <UID>${uid}</UID>
      <ID>${uid}</ID>
      <Name>${escapeXml(project.name)}</Name>
      <Type>1</Type>
      <IsNull>0</IsNull>
      <CreateDate>${msProjectDate(project.createdAt)}</CreateDate>
      <Start>${msProjectDate(project.plannedStart)}</Start>
      <Finish>${msProjectDate(project.currentEnd ?? project.plannedEnd)}</Finish>
      <PercentComplete>${Math.round(Number(project.progressPercent ?? 0))}</PercentComplete>
      <Notes>${escapeXml([
        `Cliente: ${project.client.name}`,
        `Gestor: ${project.manager.name}`,
        `Status: ${statusLabel(project.status)}`,
        `Horas planejadas: ${formatNumber(project.plannedHours)}`,
        `Horas trabalhadas: ${formatNumber(project.actualHours)}`,
        `Tarefas: ${project._count.tasks}`,
        project.notes ? `Observacoes: ${project.notes}` : "",
      ].filter(Boolean).join(" | "))}</Notes>
    </Task>`;
    })
    .join("");

  const firstStart = projects.reduce<Date | null>((earliest, project) => {
    const start = new Date(project.plannedStart);
    return !earliest || start < earliest ? start : earliest;
  }, null);
  const lastFinish = projects.reduce<Date | null>((latest, project) => {
    const finish = new Date(project.currentEnd ?? project.plannedEnd);
    return !latest || finish > latest ? finish : latest;
  }, null);

  return `<?xml version="1.0" encoding="UTF-8"?>
<Project xmlns="http://schemas.microsoft.com/project">
  <Name>Projetos OFM</Name>
  <Title>Projetos OFM</Title>
  <Company>OFM</Company>
  <ScheduleFromStart>1</ScheduleFromStart>
  <StartDate>${msProjectDate(firstStart)}</StartDate>
  <FinishDate>${msProjectDate(lastFinish)}</FinishDate>
  <Tasks>${tasks}
  </Tasks>
</Project>`;
}

async function getProjectsForExport({
  q,
  status,
  session,
}: {
  q?: string;
  status?: string;
  session: { user: { role?: string | null; clientId?: string | null } };
}) {
  return prisma.project.findMany({
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
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });

  const q = request.nextUrl.searchParams.get("q")?.trim();
  const status = request.nextUrl.searchParams.get("status")?.trim();
  const format = request.nextUrl.searchParams.get("format")?.trim() ?? "csv";

  const projects = await getProjectsForExport({ q, status, session });

  if (format === "mspdi" || format === "mpp") {
    const xml = buildProjectsMspdiXml(projects);
    const filename = `projetos-ms-project-${new Date().toISOString().slice(0, 10)}.xml`;

    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  }

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
