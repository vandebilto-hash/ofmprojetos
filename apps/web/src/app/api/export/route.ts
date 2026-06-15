import ExcelJS from "exceljs";
import { jsPDF } from "jspdf";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { priorityLabel, statusLabel } from "@/lib/labels";

type ReportRow = Record<string, string | number | Date | null>;

export async function GET(request: NextRequest) {
  const projectId = request.nextUrl.searchParams.get("projectId");
  const format = request.nextUrl.searchParams.get("format") ?? "excel";
  const reportType = request.nextUrl.searchParams.get("reportType") ?? "project-general";
  if (!projectId) return NextResponse.json({ error: "projectId obrigatorio" }, { status: 400 });

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      client: true,
      manager: true,
      tasks: {
        include: { owner: true, allocations: { include: { user: true } } },
        orderBy: [{ plannedStart: "asc" }]
      },
      blockers: true,
      baselines: { include: { tasks: true } },
      allocations: { include: { user: true, task: true } },
      replannings: { include: { task: true } },
      delays: { include: { task: true } }
    }
  });
  if (!project) return NextResponse.json({ error: "Projeto nao encontrado" }, { status: 404 });

  if (format === "pdf") {
    const doc = buildPdfReport(project, reportType);
    const bytes = doc.output("arraybuffer");
    return new NextResponse(bytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${project.name}.pdf"`
      }
    });
  }

  if (format === "mspdi") {
    const xml = buildMspdiXml(project);
    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/xml",
        "Content-Disposition": `attachment; filename="${project.name}.xml"`
      }
    });
  }

  if (format === "legacy-csv") {
    const csv = buildLegacyCsv(project);
    return new NextResponse(Buffer.from(csv, "latin1"), {
      headers: {
        "Content-Type": "text/csv; charset=windows-1252",
        "Content-Disposition": `attachment; filename="${project.name}-legado.csv"`
      }
    });
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Projete-se";
  const summarySheet = workbook.addWorksheet("Resumo");
  summarySheet.columns = [
    { header: "Indicador", key: "indicador", width: 32 },
    { header: "Valor", key: "valor", width: 42 }
  ];
  summaryRows(project).forEach((row) => summarySheet.addRow(row));
  summarySheet.getRow(1).font = { bold: true };

  const sheet = workbook.addWorksheet(reportTitle(reportType).slice(0, 31));
  const rows = rowsForReport(project, reportType);
  const keys = Object.keys(rows[0] ?? { mensagem: "Sem dados" });
  sheet.columns = keys.map((key) => ({ header: key, key, width: Math.max(18, key.length + 4) }));
  if (rows.length) {
    rows.forEach((row) => sheet.addRow(row));
  } else {
    sheet.addRow({ mensagem: "Sem dados para os filtros selecionados" });
  }
  sheet.getRow(1).font = { bold: true };
  addSupportSheets(workbook, project, reportType);
  const buffer = await workbook.xlsx.writeBuffer();
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${project.name}.xlsx"`
    }
  });
}

function reportTitle(type: string) {
  const titles: Record<string, string> = {
    "project-general": "Relatorio geral do projeto",
    "project-status": "Status do projeto",
    "tasks-by-status": "Tarefas por status",
    "delayed-tasks": "Tarefas atrasadas",
    blockers: "Bloqueios",
    "delays-replannings": "Atrasos e replanejamentos",
    "baseline-comparison": "Baseline x atual",
    "planned-vs-actual-hours": "Horas planejadas x realizadas",
    "resource-allocation": "Alocacao de recursos",
    overallocation: "Sobrealocacao",
    financial: "Financeiro do projeto",
    "client-executive": "Executivo para cliente"
  };
  return titles[type] ?? titles["project-general"];
}

function buildLegacyCsv(project: any) {
  const taskById = new Map<string, any>(project.tasks.map((task: any) => [task.id, task]));
  const directChildren = new Map<string, string[]>();
  for (const task of project.tasks) {
    if (task.parentTaskId) directChildren.set(task.parentTaskId, [...(directChildren.get(task.parentTaskId) ?? []), task.id]);
  }

  const headers = [
    "Ocorrência",
    "Item",
    "Descrição",
    "Data Início",
    "Horas Planejadas",
    "Horas Trabalhadas",
    "Progresso",
    "Data Fim Planejada",
    "Responsável",
    "Tipo Ocorrência",
    "Situação Ocorrência",
    "Data Fim Real"
  ];

  const rows = [...project.tasks].sort((left: any, right: any) => compareWbsCodes(left.wbsCode, right.wbsCode)).map((task: any) => {
    const rollup = legacyTaskRollup(task, taskById, directChildren);
    return [
      task.legacyOccurrenceId ?? "",
      task.legacyItemCode ?? task.wbsCode ?? "",
      task.name,
      formatLegacyDateTime(task.plannedStart),
      formatLegacyNumber(rollup.estimatedHours),
      rollup.actualHours > 0 ? formatLegacyNumber(rollup.actualHours) : "",
      formatLegacyNumber(rollup.progressPercent),
      formatLegacyDateTime(task.plannedEnd),
      task.owner?.name ?? "",
      task.owner ? "IMPLANTAÇÃO" : "",
      legacySituation(task.status),
      task.actualEnd ? formatLegacyDate(task.actualEnd) : ""
    ];
  });

  return [headers, ...rows].map((row) => row.map(escapeLegacyCsvCell).join(";")).join("\r\n");
}

function buildPdfReport(project: any, reportType: string) {
  const doc = new jsPDF({ orientation: "landscape" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
  const tasks = [...project.tasks].sort((left: any, right: any) => compareWbsCodes(left.wbsCode, right.wbsCode));
  const leafTasks = reportLeafTasks(tasks);
  const progress = Number(project.progressPercent);
  const plannedProgress = pdfPlannedProgress(project.plannedStart, project.plannedEnd);
  const delayedTasks = leafTasks.filter((task: any) => task.status !== "DONE" && new Date(task.plannedEnd) < new Date());
  const dueSoonTasks = leafTasks.filter((task: any) => pdfIsDueWithinOneDay(task));
  const scheduleHealth = pdfScheduleHealth(delayedTasks.length, dueSoonTasks.length);
  const activeBlockers = project.blockers.filter((blocker: any) => blocker.status !== "RESOLVED" && blocker.status !== "CANCELED");
  const completedTasks = leafTasks.filter((task: any) => task.status === "DONE");

  doc.setFillColor(23, 36, 73);
  doc.roundedRect(margin, 8, pageWidth - margin * 2, 22, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("OFM", margin + 8, 22);
  doc.setFontSize(14);
  doc.text("Status Report", margin + 36, 22);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.text(`Relatorio gerado em ${new Date().toLocaleString("pt-BR")}`, pageWidth - margin - 8, 21, { align: "right" });

  doc.setTextColor(8, 22, 48);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, 46, 170, 42, 3, 3);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(project.name, margin + 5, 58);
  doc.setFontSize(9);
  doc.text(`Cliente: ${project.client.name}`, margin + 5, 68);
  doc.text(`Gerente: ${project.manager.name}`, margin + 5, 78);
  doc.text(`Periodo: ${formatPdfDate(project.plannedStart)} - ${formatPdfDate(project.currentEnd)}`, margin + 65, 78);

  doc.roundedRect(pageWidth - margin - 95, 56, 95, 28, 3, 3);
  doc.setFontSize(8);
  doc.text("PROGRESSO GERAL", pageWidth - margin - 90, 66);
  doc.setFillColor(226, 232, 240);
  doc.roundedRect(pageWidth - margin - 90, 74, 65, 2.5, 1, 1, "F");
  doc.setFillColor(21, 173, 211);
  doc.roundedRect(pageWidth - margin - 90, 74, Math.min(65, progress * 0.65), 2.5, 1, 1, "F");
  doc.setFontSize(16);
  doc.text(`${progress}%`, pageWidth - margin - 16, 78, { align: "right" });

  const cardY = 104;
  const cardW = (pageWidth - margin * 2 - 8) / 3;
  [
    ["PROGRESSO REALIZADO", `${progress}%`, `${completedTasks.length} de ${leafTasks.length} tarefas`, `Planejado: ${plannedProgress}%`],
    ["SAUDE DO CRONOGRAMA", scheduleHealth.label, `${delayedTasks.length} atrasadas | ${dueSoonTasks.length} vencem em 1 dia`, scheduleHealth.description],
    ["RISCOS CRITICOS", String(delayedTasks.length + activeBlockers.length), "Atrasadas + impeditivos", ""]
  ].forEach(([title, value, detail, footer], index) => {
    const x = margin + index * (cardW + 4);
    doc.roundedRect(x, cardY, cardW, 32, 3, 3);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text(title, x + 4, cardY + 8);
    doc.setFontSize(value.length > 16 ? 11 : 15);
    doc.text(doc.splitTextToSize(value, cardW - 8).slice(0, 2), x + 4, cardY + 18);
    doc.setFontSize(8);
    doc.text(detail, x + 4, cardY + 27);
    if (footer) doc.text(doc.splitTextToSize(footer, cardW - 50).slice(0, 1), x + 48, cardY + 27);
  });

  doc.setFontSize(11);
  doc.text("Resumo Executivo", margin, 154);
  doc.roundedRect(margin, 160, 132, 46, 3, 3);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(
    doc.splitTextToSize(
      `O projeto apresenta ${progress >= plannedProgress ? "evolucao aderente" : "atraso"} em relacao ao cronograma. Foram executadas ${formatPdfHours(project.actualHours)} de ${formatPdfHours(project.plannedHours)}, restando ${formatPdfHours(project.remainingHours)}. Existem ${delayedTasks.length} tarefa(s) atrasada(s) e ${activeBlockers.length} bloqueio(s) ativo(s).`,
      122
    ),
    margin + 5,
    170
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Panorama Agil", margin + 145, 154);
  doc.roundedRect(margin + 145, 160, 128, 46, 3, 3);
  doc.setFontSize(8);
  let y = 170;
  let hiddenPanoramaItems = 0;
  completedTasks.slice(0, 3).forEach((task: any, index: number) => {
    const lines = doc.splitTextToSize(`${index + 1}. ${task.name}`, 108).slice(0, 2);
    if (y + lines.length * 4 > 190) {
      hiddenPanoramaItems += 1;
      return;
    }
    doc.text(lines, margin + 150, y);
    y += lines.length * 4 + 3;
  });
  delayedTasks.slice(0, 2).forEach((task: any) => {
    doc.setTextColor(185, 28, 28);
    const lines = doc.splitTextToSize(`Atraso: ${task.name}`, 108).slice(0, 2);
    if (y + lines.length * 4 > 196) {
      hiddenPanoramaItems += 1;
      return;
    }
    doc.text(lines, margin + 150, y);
    y += lines.length * 4 + 3;
  });
  doc.setTextColor(8, 22, 48);
  if (hiddenPanoramaItems > 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text(`+ ${hiddenPanoramaItems} item(ns) no detalhamento`, margin + 150, 202);
  }

  doc.addPage();
  doc.setTextColor(8, 22, 48);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Evolucao Macro do Projeto (Curva S)", margin, 18);
  doc.roundedRect(margin, 24, pageWidth - margin * 2, 62, 3, 3);
  doc.setDrawColor(219, 228, 239);
  [0, 25, 50, 75, 100].forEach((value) => {
    const lineY = 78 - value * 0.45;
    doc.line(margin + 22, lineY, pageWidth - margin - 12, lineY);
    doc.setFontSize(7);
    doc.text(`${value}%`, margin + 8, lineY + 1);
  });
  doc.setDrawColor(21, 173, 211);
  doc.setLineWidth(1.2);
  doc.line(margin + 22, 78, pageWidth - margin - 12, 33);
  doc.setDrawColor(100, 116, 139);
  doc.setLineDashPattern([3, 2], 0);
  doc.line(margin + 22, 78, margin + 95, 78 - plannedProgress * 0.45);
  doc.line(margin + 95, 78 - plannedProgress * 0.45, margin + 145, 78 - progress * 0.45);
  doc.setLineDashPattern([], 0);

  doc.setFontSize(13);
  doc.text("Esforco e Alocacao por Recurso (Horas)", margin, 108);
  const resourceRows = pdfResourceRows(leafTasks);
  let tableY = 118;
  doc.setFontSize(8);
  doc.text("Recurso", margin, tableY);
  doc.text("Planejado", margin + 105, tableY);
  doc.text("Realizado", margin + 145, tableY);
  doc.text("Saude", margin + 190, tableY);
  tableY += 6;
  resourceRows.slice(0, 8).forEach((row) => {
    doc.setFont("helvetica", "bold");
    doc.text(row.name.slice(0, 44), margin, tableY);
    doc.text(formatPdfHours(row.planned), margin + 105, tableY);
    doc.text(formatPdfHours(row.actual), margin + 145, tableY);
    doc.setTextColor(row.actual > row.planned ? 185 : 22, row.actual > row.planned ? 28 : 101, row.actual > row.planned ? 28 : 52);
    doc.text(row.actual > row.planned ? "Estourado" : "Dentro da meta", margin + 190, tableY);
    doc.setTextColor(8, 22, 48);
    doc.setFont("helvetica", "normal");
    tableY += 9;
  });

  drawPdfFooter(doc, margin, pageWidth, pageHeight);
  return doc;
}

function drawPdfHeader(
  doc: jsPDF,
  data: {
    title: string;
    projectName: string;
    clientName: string;
    pageWidth: number;
    margin: number;
    generatedAt: string;
  }
) {
  doc.setFillColor(18, 31, 54);
  doc.rect(0, 0, data.pageWidth, 34, "F");
  doc.setFillColor(28, 126, 214);
  doc.rect(0, 0, 6, 34, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(data.title, data.margin, 14);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Projeto: ${data.projectName}`, data.margin, 22);
  doc.text(`Cliente: ${data.clientName}`, data.margin, 28);

  doc.setFontSize(8);
  doc.text("Projete-se", data.pageWidth - data.margin, 12, { align: "right" });
  doc.text(`Gerado em ${data.generatedAt}`, data.pageWidth - data.margin, 20, { align: "right" });
}

function drawSummaryCards(doc: jsPDF, summary: ReportRow[], x: number, y: number, width: number) {
  const important = summary.filter((row) =>
    [
      "Status",
      "Percentual de conclusao",
      "Total de tarefas",
      "Tarefas atrasadas",
      "Bloqueios abertos",
      "Horas planejadas",
      "Horas realizadas",
      "Horas restantes",
      "Funcionarios sobrealocados",
      "Custo financeiro"
    ].includes(String(row.indicador))
  );
  const cardGap = 4;
  const columns = 5;
  const cardWidth = (width - cardGap * (columns - 1)) / columns;
  const cardHeight = 20;

  important.slice(0, 10).forEach((row, index) => {
    const col = index % columns;
    const line = Math.floor(index / columns);
    const cardX = x + col * (cardWidth + cardGap);
    const cardY = y + line * (cardHeight + cardGap);
    const isWarning = ["Tarefas atrasadas", "Bloqueios abertos", "Funcionarios sobrealocados"].includes(String(row.indicador)) && Number(row.valor) > 0;

    doc.setFillColor(isWarning ? 255 : 247, isWarning ? 245 : 249, isWarning ? 245 : 252);
    doc.setDrawColor(isWarning ? 214 : 221, isWarning ? 69 : 228, isWarning ? 69 : 236);
    doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 2, 2, "FD");
    doc.setTextColor(92, 105, 125);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text(String(row.indicador).toUpperCase(), cardX + 3, cardY + 6);
    doc.setTextColor(isWarning ? 190 : 23, isWarning ? 45 : 32, isWarning ? 45 : 51);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(formatReportValue(row.valor), cardX + 3, cardY + 15);
  });

  return y + Math.ceil(Math.min(important.length, 10) / columns) * (cardHeight + cardGap);
}

function drawPdfSectionTitle(doc: jsPDF, title: string, x: number, y: number, width: number) {
  doc.setTextColor(23, 32, 51);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(title, x, y);
  doc.setDrawColor(28, 126, 214);
  doc.line(x, y + 3, x + width, y + 3);
  return y + 9;
}

function drawPdfTable(
  doc: jsPDF,
  rows: ReportRow[],
  x: number,
  y: number,
  width: number,
  pageHeight: number,
  reportType: string,
  headerData: { title: string; projectName: string; clientName: string; generatedAt: string }
) {
  const columns = pdfColumns(rows, reportType);
  const rowData = rows.length ? rows : [{ mensagem: "Sem dados para os filtros selecionados" }];
  const usableBottom = pageHeight - 18;
  const headerHeight = 9;
  const minRowHeight = 8;
  const cellPadding = 2.5;

  drawTableHeader(doc, columns, x, y, width, headerHeight);
  y += headerHeight;

  rowData.forEach((row, rowIndex) => {
    const linesByColumn = columns.map((column) => {
      const rawValue = formatReportValue(row[column.key] ?? "");
      return doc.splitTextToSize(rawValue, column.width - cellPadding * 2);
    });
    const rowHeight = Math.max(minRowHeight, Math.max(...linesByColumn.map((lines) => lines.length)) * 4.2 + cellPadding * 2);

    if (y + rowHeight > usableBottom) {
      doc.addPage();
      drawPdfHeader(doc, {
        title: headerData.title,
        projectName: headerData.projectName,
        clientName: headerData.clientName,
        pageWidth: doc.internal.pageSize.getWidth(),
        margin: x,
        generatedAt: headerData.generatedAt
      });
      y = 44;
      drawTableHeader(doc, columns, x, y, width, headerHeight);
      y += headerHeight;
    }

    doc.setFillColor(rowIndex % 2 === 0 ? 255 : 248, rowIndex % 2 === 0 ? 255 : 250, rowIndex % 2 === 0 ? 255 : 253);
    doc.rect(x, y, width, rowHeight, "F");
    doc.setDrawColor(226, 232, 240);
    doc.line(x, y + rowHeight, x + width, y + rowHeight);

    let cellX = x;
    linesByColumn.forEach((lines, columnIndex) => {
      doc.setTextColor(23, 32, 51);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.text(lines, cellX + cellPadding, y + 5.5, { maxWidth: columns[columnIndex].width - cellPadding * 2 });
      cellX += columns[columnIndex].width;
    });

    y += rowHeight;
  });

  return y;
}

function drawTableHeader(doc: jsPDF, columns: PdfColumn[], x: number, y: number, width: number, height: number) {
  doc.setFillColor(238, 247, 255);
  doc.setDrawColor(210, 226, 246);
  doc.rect(x, y, width, height, "FD");
  doc.setTextColor(13, 85, 149);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);

  let cellX = x;
  columns.forEach((column) => {
    doc.text(column.label, cellX + 2.5, y + 6);
    cellX += column.width;
  });
}

function drawPdfFooter(doc: jsPDF, margin: number, pageWidth: number, pageHeight: number) {
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
    doc.setTextColor(92, 105, 125);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("Projete-se | Relatorio gerado automaticamente", margin, pageHeight - 6);
    doc.text(`Pagina ${page} de ${pages}`, pageWidth - margin, pageHeight - 6, { align: "right" });
  }
}

type PdfColumn = { key: string; label: string; width: number };

function pdfColumns(rows: ReportRow[], reportType: string): PdfColumn[] {
  const keySets: Record<string, Array<[string, string, number]>> = {
    "project-general": [
      ["tarefa", "Tarefa", 52],
      ["responsavel", "Responsavel", 30],
      ["status", "Status", 27],
      ["prioridade", "Prioridade", 24],
      ["fim", "Prazo", 25],
      ["horasEstimadas", "H. plan.", 20],
      ["horasRealizadas", "H. real.", 20],
      ["progresso", "%", 14],
      ["atraso", "Atraso", 20]
    ],
    "tasks-by-status": [
      ["tarefa", "Tarefa", 52],
      ["responsavel", "Responsavel", 30],
      ["status", "Status", 27],
      ["prioridade", "Prioridade", 24],
      ["fimPlanejado", "Prazo", 25],
      ["horasEstimadas", "H. plan.", 20],
      ["horasRealizadas", "H. real.", 20],
      ["progresso", "%", 14],
      ["atraso", "Atraso", 20]
    ],
    "delayed-tasks": [
      ["tarefa", "Tarefa", 58],
      ["responsavel", "Responsavel", 34],
      ["prazoPlanejado", "Prazo", 26],
      ["diasAtraso", "Dias atraso", 24],
      ["status", "Status", 27],
      ["prioridade", "Prioridade", 24],
      ["horasEstimadas", "H. plan.", 20],
      ["horasRealizadas", "H. real.", 20],
      ["motivoAtraso", "Motivo", 42]
    ],
    blockers: [
      ["titulo", "Bloqueio", 42],
      ["descricao", "Descricao", 58],
      ["tarefaRelacionada", "Tarefa", 38],
      ["status", "Status", 26],
      ["responsavelResolucao", "Responsavel", 32],
      ["impactoDias", "Impacto dias", 22],
      ["impactoFinanceiro", "Impacto R$", 24],
      ["previstoResolucao", "Previsto", 25]
    ],
    "delays-replannings": [
      ["tipo", "Tipo", 28],
      ["tarefa", "Tarefa", 45],
      ["dataOriginal", "Data original", 27],
      ["novaData", "Nova data", 27],
      ["motivo", "Motivo", 45],
      ["responsavel", "Responsavel", 32],
      ["impactoDias", "Dias", 17],
      ["impactoHoras", "Horas", 18],
      ["impactoFinanceiro", "Impacto R$", 24]
    ],
    "baseline-comparison": [
      ["baseline", "Baseline", 34],
      ["ativa", "Ativa", 16],
      ["tarefa", "Tarefa", 46],
      ["fimBaseline", "Fim baseline", 27],
      ["fimAtual", "Fim atual", 27],
      ["variacaoDias", "Var. dias", 20],
      ["variacaoHoras", "Var. horas", 22],
      ["progressoAtual", "% atual", 18],
      ["motivoDescricao", "Motivo", 54]
    ],
    "planned-vs-actual-hours": [
      ["tarefa", "Tarefa", 64],
      ["responsavel", "Responsavel", 34],
      ["planejadas", "Planejadas", 24],
      ["realizadas", "Realizadas", 24],
      ["restantes", "Restantes", 24],
      ["variacao", "Variacao", 24],
      ["percentualConclusao", "% concluido", 26]
    ],
    "resource-allocation": [
      ["recurso", "Recurso", 34],
      ["tarefa", "Tarefa", 50],
      ["inicio", "Inicio", 25],
      ["fim", "Fim", 25],
      ["horasAlocadas", "H. aloc.", 20],
      ["capacidadeSemanal", "Cap. sem.", 22],
      ["horasLivresSemana", "Livres", 20],
      ["sobrealocado", "Sobrealocado", 28]
    ],
    overallocation: [
      ["recurso", "Recurso", 38],
      ["cargo", "Cargo", 34],
      ["capacidadeSemanal", "Cap. semanal", 28],
      ["horasAlocadasSemana", "H. alocadas", 28],
      ["horasExcedentes", "Excedente", 26],
      ["projeto", "Projeto", 46],
      ["tarefa", "Tarefa", 52]
    ],
    financial: [
      ["tarefa", "Tarefa", 58],
      ["responsavel", "Responsavel", 34],
      ["horasRealizadas", "H. real.", 22],
      ["valorHora", "Valor/h", 22],
      ["custoRealizado", "Custo real.", 28],
      ["custoPlanejado", "Custo plan.", 28],
      ["variacaoCusto", "Variacao", 28]
    ],
    "project-status": [
      ["projeto", "Projeto", 52],
      ["cliente", "Cliente", 40],
      ["status", "Status", 28],
      ["progresso", "%", 18],
      ["fimPlanejado", "Fim plan.", 28],
      ["fimAtualizado", "Fim atual", 28],
      ["bloqueiosAbertos", "Bloq. abertos", 26],
      ["tarefasAtrasadas", "Tarefas atraso", 28],
      ["horasRealizadas", "H. real.", 22]
    ],
    "client-executive": [
      ["projeto", "Projeto", 52],
      ["cliente", "Cliente", 40],
      ["status", "Status", 28],
      ["progresso", "%", 18],
      ["fimAtualizado", "Fim atualizado", 30],
      ["bloqueiosAbertos", "Bloq. abertos", 28],
      ["tarefasAtrasadas", "Tarefas atraso", 30],
      ["horasRestantes", "H. restantes", 26]
    ]
  };
  const selected = keySets[reportType] ?? keySets["project-general"];
  if (!rows.length) return [{ key: "mensagem", label: "Mensagem", width: 240 }];
  return selected.map(([key, label, width]) => ({ key, label, width }));
}

function rowsForReport(project: any, type: string): ReportRow[] {
  const now = new Date();
  const taskById = new Map<string, any>(project.tasks.map((task: any) => [task.id, task]));

  if (type === "tasks-by-status") {
    return project.tasks.map((task: any) => ({
      projeto: project.name,
      status: statusLabel(task.status),
      tarefa: task.name,
      responsavel: task.owner?.name ?? "",
      prioridade: priorityLabel(task.priority),
      inicioPlanejado: task.plannedStart,
      fimPlanejado: task.plannedEnd,
      progresso: Number(task.progressPercent),
      horasEstimadas: Number(task.estimatedHours),
      horasRealizadas: Number(task.actualHours),
      atraso: new Date(task.plannedEnd) < now && task.status !== "DONE" ? "Sim" : "Nao"
    }));
  }

  if (type === "delayed-tasks") {
    return project.tasks
      .filter((task: any) => new Date(task.plannedEnd) < now && task.status !== "DONE")
      .map((task: any) => ({
        tarefa: task.name,
        responsavel: task.owner?.name ?? "",
        inicioPlanejado: task.plannedStart,
        prazoPlanejado: task.plannedEnd,
        diasAtraso: Math.max(0, Math.ceil((now.getTime() - new Date(task.plannedEnd).getTime()) / 86400000)),
        status: statusLabel(task.status),
        prioridade: priorityLabel(task.priority),
        horasEstimadas: Number(task.estimatedHours),
        horasRealizadas: Number(task.actualHours),
        motivoAtraso: task.delayReason ?? ""
      }));
  }

  if (type === "blockers") {
    return project.blockers.map((blocker: any) => ({
      titulo: blocker.title,
      descricao: blocker.description ?? "",
      tarefaRelacionada: blocker.taskId ? taskById.get(blocker.taskId)?.name ?? "" : "Projeto geral",
      status: statusLabel(blocker.status),
      responsavelResolucao: userName(project, blocker.resolverId),
      impactoDias: blocker.scheduleImpactDays,
      impactoFinanceiro: formatCurrency(blocker.financialImpact),
      abertoEm: blocker.openedAt,
      previstoResolucao: blocker.expectedResolutionAt,
      resolvidoEm: blocker.resolvedAt
    }));
  }

  if (type === "delays-replannings") {
    return [
      ...project.delays.map((delay: any) => ({
        tipo: "Atraso",
        tarefa: delay.task?.name ?? "Projeto",
        dataOriginal: delay.originalDate,
        novaData: delay.newDate,
        motivo: delay.reason,
        justificativa: delay.technicalJustify ?? "",
        responsavel: userName(project, delay.responsibleId),
        impactoDias: delay.scheduleImpactDays,
        impactoHoras: Number(delay.hoursImpact),
        impactoFinanceiro: formatCurrency(delay.financialImpact)
      })),
      ...project.replannings.map((replanning: any) => ({
        tipo: "Replanejamento",
        tarefa: replanning.task?.name ?? "Projeto",
        dataOriginal: replanning.originalDate,
        novaData: replanning.newDate,
        motivo: replanning.reason,
        justificativa: replanning.technicalJustify ?? "",
        responsavel: userName(project, replanning.responsibleId),
        impactoDias: replanning.scheduleImpactDays,
        impactoHoras: Number(replanning.hoursImpact),
        impactoFinanceiro: formatCurrency(replanning.financialImpact)
      }))
    ];
  }

  if (type === "baseline-comparison") {
    return project.baselines.flatMap((baseline: any) =>
      baseline.tasks.map((baselineTask: any) => {
        const task = project.tasks.find((item: any) => item.id === baselineTask.taskId);
        return {
          baseline: baseline.name,
          ativa: baseline.isActive ? "Sim" : "Nao",
          motivoDescricao: baseline.description ?? "",
          tarefa: baselineTask.name,
          inicioBaseline: baselineTask.plannedStart,
          fimBaseline: baselineTask.plannedEnd,
          inicioAtual: task?.plannedStart ?? "",
          fimAtual: task?.plannedEnd ?? "",
          variacaoDias: task ? Math.ceil((new Date(task.plannedEnd).getTime() - new Date(baselineTask.plannedEnd).getTime()) / 86400000) : 0,
          variacaoHoras: task ? Number(task.estimatedHours) - Number(baselineTask.estimatedHours) : 0,
          progressoBaseline: Number(baselineTask.progressPercent),
          progressoAtual: task ? Number(task.progressPercent) : 0,
          custoBaseline: formatCurrency(baselineTask.financialCost),
          custoAtualEstimado: formatCurrency(task ? Number(task.estimatedHours) * Number(task.owner?.hourlyRate ?? 0) : 0)
        };
      })
    );
  }

  if (type === "planned-vs-actual-hours") {
    return project.tasks.map((task: any) => ({
      tarefa: task.name,
      responsavel: task.owner?.name ?? "",
      planejadas: Number(task.estimatedHours),
      realizadas: Number(task.actualHours),
      restantes: Math.max(0, Number(task.estimatedHours) - Number(task.actualHours)),
      variacao: Number(task.actualHours) - Number(task.estimatedHours),
      percentualConclusao: Number(task.progressPercent)
    }));
  }

  if (type === "resource-allocation") {
    return project.allocations.map((allocation: any) => ({
      recurso: allocation.user.name,
      tarefa: allocation.task?.name ?? "Tarefa nao vinculada",
      inicio: allocation.startDate,
      fim: allocation.endDate,
      horasAlocadas: Number(allocation.allocatedHours),
      capacidadeSemanal: Number(allocation.user.weeklyCapacityHours),
      capacidadeDiaria: Number(allocation.user.dailyCapacityHours),
      horasLivresSemana: Math.max(0, Number(allocation.user.weeklyCapacityHours) - allocatedHoursForUser(project, allocation.userId)),
      sobrealocado: allocatedHoursForUser(project, allocation.userId) > Number(allocation.user.weeklyCapacityHours) ? "Sim" : "Nao"
    }));
  }

  if (type === "overallocation") {
    return project.allocations
      .filter((allocation: any) => allocatedHoursForUser(project, allocation.userId) > Number(allocation.user.weeklyCapacityHours))
      .map((allocation: any) => ({
        recurso: allocation.user.name,
        cargo: allocation.user.jobTitle ?? "",
        capacidadeSemanal: Number(allocation.user.weeklyCapacityHours),
        horasAlocadasSemana: allocatedHoursForUser(project, allocation.userId),
        horasExcedentes: allocatedHoursForUser(project, allocation.userId) - Number(allocation.user.weeklyCapacityHours),
        projeto: project.name,
        tarefa: allocation.task?.name ?? "Tarefa nao vinculada"
      }));
  }

  if (type === "financial") {
    return project.tasks.map((task: any) => ({
      tarefa: task.name,
      responsavel: task.owner?.name ?? "",
      horasRealizadas: Number(task.actualHours),
      valorHora: formatCurrency(task.owner?.hourlyRate ?? 0),
      custoRealizado: formatCurrency(Number(task.actualHours) * Number(task.owner?.hourlyRate ?? 0)),
      custoPlanejado: formatCurrency(Number(task.estimatedHours) * Number(task.owner?.hourlyRate ?? 0)),
      variacaoCusto: formatCurrency((Number(task.actualHours) - Number(task.estimatedHours)) * Number(task.owner?.hourlyRate ?? 0))
    }));
  }

  if (type === "client-executive" || type === "project-status") {
    return [
      {
        projeto: project.name,
        cliente: project.client.name,
        status: statusLabel(project.status),
        progresso: Number(project.progressPercent),
        fimPlanejado: project.plannedEnd,
        fimAtualizado: project.currentEnd,
        bloqueios: project.blockers.length,
        bloqueiosAbertos: project.blockers.filter((blocker: any) => blocker.status !== "RESOLVED").length,
        tarefasAtrasadas: project.tasks.filter((task: any) => new Date(task.plannedEnd) < now && task.status !== "DONE").length,
        horasPlanejadas: Number(project.plannedHours),
        horasRealizadas: Number(project.actualHours),
        horasRestantes: Number(project.remainingHours),
        custoFinanceiro: formatCurrency(project.financialCost)
      }
    ];
  }

  return project.tasks.map((task: any) => ({
    projeto: project.name,
    cliente: project.client.name,
    tarefa: task.name,
    responsavel: task.owner?.name ?? "",
    status: statusLabel(task.status),
    prioridade: priorityLabel(task.priority),
    inicio: task.plannedStart,
    fim: task.plannedEnd,
    inicioReal: task.actualStart,
    fimReal: task.actualEnd,
    horasEstimadas: Number(task.estimatedHours),
    horasRealizadas: Number(task.actualHours),
    horasRestantes: Math.max(0, Number(task.estimatedHours) - Number(task.actualHours)),
    progresso: Number(task.progressPercent),
    atraso: new Date(task.plannedEnd) < now && task.status !== "DONE" ? "Sim" : "Nao"
  }));
}

function summaryRows(project: any): ReportRow[] {
  const now = new Date();
  const delayedTasks = project.tasks.filter((task: any) => new Date(task.plannedEnd) < now && task.status !== "DONE");
  const openBlockers = project.blockers.filter((blocker: any) => blocker.status !== "RESOLVED");
  const overAllocatedUsers = new Set(
    project.allocations
      .filter((allocation: any) => allocatedHoursForUser(project, allocation.userId) > Number(allocation.user.weeklyCapacityHours))
      .map((allocation: any) => allocation.userId)
  );

  return [
    { indicador: "Projeto", valor: project.name },
    { indicador: "Cliente", valor: project.client.name },
    { indicador: "Gestor", valor: project.manager.name },
    { indicador: "Status", valor: statusLabel(project.status) },
    { indicador: "Percentual de conclusao", valor: `${Number(project.progressPercent)}%` },
    { indicador: "Data de inicio planejada", valor: project.plannedStart },
    { indicador: "Data final planejada", valor: project.plannedEnd },
    { indicador: "Data final atualizada", valor: project.currentEnd },
    { indicador: "Total de tarefas", valor: project.tasks.length },
    { indicador: "Tarefas atrasadas", valor: delayedTasks.length },
    { indicador: "Bloqueios abertos", valor: openBlockers.length },
    { indicador: "Baselines", valor: project.baselines.length },
    { indicador: "Horas planejadas", valor: Number(project.plannedHours) },
    { indicador: "Horas realizadas", valor: Number(project.actualHours) },
    { indicador: "Horas restantes", valor: Number(project.remainingHours) },
    { indicador: "Funcionarios sobrealocados", valor: overAllocatedUsers.size },
    { indicador: "Custo financeiro", valor: formatCurrency(project.financialCost) }
  ];
}

function addSupportSheets(workbook: ExcelJS.Workbook, project: any, reportType: string) {
  if (reportType === "project-general") {
    addRowsSheet(workbook, "Tarefas", rowsForReport(project, "tasks-by-status"));
    addRowsSheet(workbook, "Bloqueios", rowsForReport(project, "blockers"));
    addRowsSheet(workbook, "Recursos", rowsForReport(project, "resource-allocation"));
    addRowsSheet(workbook, "Baselines", rowsForReport(project, "baseline-comparison"));
  }

  if (reportType === "client-executive") {
    addRowsSheet(workbook, "Marcos e tarefas", rowsForReport(project, "tasks-by-status"));
    addRowsSheet(workbook, "Pendencias", rowsForReport(project, "blockers"));
  }
}

function addRowsSheet(workbook: ExcelJS.Workbook, name: string, rows: ReportRow[]) {
  const sheet = workbook.addWorksheet(name.slice(0, 31));
  const keys = Object.keys(rows[0] ?? { mensagem: "Sem dados" });
  sheet.columns = keys.map((key) => ({ header: key, key, width: Math.max(18, key.length + 4) }));
  if (rows.length) rows.forEach((row) => sheet.addRow(row));
  else sheet.addRow({ mensagem: "Sem dados" });
  sheet.getRow(1).font = { bold: true };
}

function allocatedHoursForUser(project: any, userId: string) {
  return project.allocations
    .filter((allocation: any) => allocation.userId === userId)
    .reduce((sum: number, allocation: any) => sum + Number(allocation.allocatedHours), 0);
}

function userName(project: any, userId: string | null | undefined) {
  if (!userId) return "";
  const allocationUser = project.allocations.find((allocation: any) => allocation.userId === userId)?.user;
  const owner = project.tasks.find((task: any) => task.ownerId === userId)?.owner;
  return allocationUser?.name ?? owner?.name ?? userId;
}

function formatPdfRow(row: ReportRow) {
  return Object.entries(row)
    .map(([key, value]) => `${key}: ${formatReportValue(value)}`)
    .join(" | ")
    .slice(0, 115);
}

function formatReportValue(value: string | number | Date | null) {
  if (value instanceof Date) return value.toLocaleDateString("pt-BR");
  if (value === null || value === undefined) return "";
  return String(value);
}

function formatCurrency(value: unknown) {
  return Number(value ?? 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function formatPdfDate(value: Date | string | null | undefined) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("pt-BR");
}

function formatPdfHours(value: unknown) {
  return `${Number(value ?? 0).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}h`;
}

function pdfPlannedProgress(start: Date | string, end: Date | string) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const total = Math.max(1, endDate.getTime() - startDate.getTime());
  const elapsed = Math.min(total, Math.max(0, new Date().getTime() - startDate.getTime()));
  return Math.round((elapsed / total) * 100);
}

function pdfIsDueWithinOneDay(task: any) {
  if (task.status === "DONE") return false;
  const plannedEnd = new Date(task.plannedEnd);
  const now = new Date();
  const inOneDay = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  return plannedEnd >= now && plannedEnd <= inOneDay;
}

function pdfScheduleHealth(delayedCount: number, dueSoonCount: number) {
  if (delayedCount > 10) return { label: "Replanejamento Urgente", description: "Acima de 10 atividades atrasadas" };
  if (delayedCount > 5) return { label: "Alto", description: "Entre 6 e 10 atividades atrasadas" };
  if (delayedCount > 3) return { label: "Medio", description: "Entre 4 e 5 atividades atrasadas" };
  if (delayedCount > 0) return { label: "Baixo risco", description: "Ate 3 atividades atrasadas" };
  if (dueSoonCount >= 3) return { label: "Atencao", description: "3+ vencem em ate 1 dia" };
  return { label: "Saudavel", description: "Todas dentro do prazo" };
}

function reportLeafTasks(tasks: any[]) {
  const parentIds = new Set(tasks.map((task) => task.parentTaskId).filter(Boolean));
  const leaves = tasks.filter((task) => !parentIds.has(task.id));
  return leaves.length ? leaves : tasks;
}

function pdfResourceRows(tasks: any[]) {
  const rows = new Map<string, { name: string; planned: number; actual: number }>();
  for (const task of tasks) {
    const name = task.owner?.name ?? "Sem responsavel";
    const row = rows.get(name) ?? { name, planned: 0, actual: 0 };
    row.planned += Number(task.estimatedHours ?? 0);
    row.actual += Number(task.actualHours ?? 0);
    rows.set(name, row);
  }

  return [...rows.values()].sort((left, right) => right.actual - left.actual);
}

function formatLegacyDateTime(value: Date | string | null | undefined) {
  if (!value) return "";
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });
}

function formatLegacyDate(value: Date | string | null | undefined) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

function formatLegacyNumber(value: unknown) {
  const number = Number(value ?? 0);
  return number.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
}

function legacySituation(status: string) {
  if (status === "DONE") return "FECHADO";
  if (status === "IN_PROGRESS" || status === "IN_REVIEW" || status === "BLOCKED") return "EXECUTAR";
  return "PENDENTE";
}

function escapeLegacyCsvCell(value: unknown) {
  const text = String(value ?? "");
  return /[;"\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function legacyTaskRollup(task: any, taskById: Map<string, any>, directChildren: Map<string, string[]>) {
  const descendants = collectDescendantTasks(task.id, taskById, directChildren);
  const rollupTasks = descendants.length ? descendants.filter((item) => !(directChildren.get(item.id)?.length)) : [task];
  const estimatedHours = rollupTasks.reduce((sum, item) => sum + Number(item.estimatedHours ?? 0), 0);
  const actualHours = rollupTasks.reduce((sum, item) => sum + Number(item.actualHours ?? 0), 0);
  const progressPercent = estimatedHours > 0
    ? Math.round((rollupTasks.reduce((sum, item) => sum + Number(item.progressPercent ?? 0) * Number(item.estimatedHours ?? 0), 0) / estimatedHours) * 100) / 100
    : Number(task.progressPercent ?? 0);

  return { estimatedHours, actualHours, progressPercent };
}

function collectDescendantTasks(taskId: string, taskById: Map<string, any>, directChildren: Map<string, string[]>): any[] {
  return (directChildren.get(taskId) ?? []).flatMap((id) => {
    const task = taskById.get(id);
    return task ? [task, ...collectDescendantTasks(id, taskById, directChildren)] : [];
  });
}

function compareWbsCodes(left?: string | null, right?: string | null) {
  if (!left && !right) return 0;
  if (!left) return 1;
  if (!right) return -1;

  const leftParts = left.split(".").map((part) => Number(part));
  const rightParts = right.split(".").map((part) => Number(part));
  const length = Math.max(leftParts.length, rightParts.length);

  for (let index = 0; index < length; index += 1) {
    const leftValue = leftParts[index] ?? -1;
    const rightValue = rightParts[index] ?? -1;
    if (leftValue !== rightValue) return leftValue - rightValue;
  }

  return left.localeCompare(right);
}

function buildMspdiXml(project: any) {
  const tasks = project.tasks
    .map(
      (task: any, index: number) => `
    <Task>
      <UID>${index + 1}</UID>
      <ID>${index + 1}</ID>
      <Name>${escapeXml(task.name)}</Name>
      <Type>1</Type>
      <IsNull>0</IsNull>
      <CreateDate>${new Date(task.createdAt).toISOString()}</CreateDate>
      <Start>${new Date(task.plannedStart).toISOString()}</Start>
      <Finish>${new Date(task.plannedEnd).toISOString()}</Finish>
      <PercentComplete>${Number(task.progressPercent)}</PercentComplete>
    </Task>`
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<Project xmlns="http://schemas.microsoft.com/project">
  <Name>${escapeXml(project.name)}</Name>
  <Title>${escapeXml(project.name)}</Title>
  <Company>Projete-se</Company>
  <ScheduleFromStart>1</ScheduleFromStart>
  <StartDate>${new Date(project.plannedStart).toISOString()}</StartDate>
  <FinishDate>${new Date(project.currentEnd).toISOString()}</FinishDate>
  <Tasks>${tasks}
  </Tasks>
</Project>`;
}

function escapeXml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}
