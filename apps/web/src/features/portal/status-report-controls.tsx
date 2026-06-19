"use client";

import { useEffect, useMemo, useState } from "react";

type ReportFilters = {
  query: string;
  status: string;
  owner: string;
  level: string;
};

const defaultFilters: ReportFilters = { query: "", status: "", owner: "", level: "" };

export function StatusReportFilters() {
  const [filters, setFilters] = useState(defaultFilters);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("status-report-filter", { detail: filters }));
  }, [filters]);

  function updateFilter(key: keyof ReportFilters, value: string) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  return (
    <section className="rounded-lg border border-slate-300 bg-slate-50 p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-black text-[#00143d]">Filtros dinâmicos do Status Report</h2>
          <p className="text-xs text-slate-500">Os filtros abaixo atualizam atividades, marcos, recursos, riscos e bloqueios.</p>
        </div>
        <button type="button" onClick={() => setFilters(defaultFilters)} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-black text-slate-700">
          Limpar filtros
        </button>
      </div>
      <div className="grid gap-3 md:grid-cols-4">
        <input
          value={filters.query}
          onChange={(event) => updateFilter("query", event.target.value)}
          placeholder="Buscar por atividade, risco, recurso ou responsável"
          className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none md:col-span-2"
        />
        <select value={filters.status} onChange={(event) => updateFilter("status", event.target.value)} className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm">
          <option value="">Todos os status</option>
          <option value="bloqueado">Bloqueado</option>
          <option value="atrasado">Atrasado</option>
          <option value="planejado">Planejado</option>
          <option value="no prazo">No Prazo</option>
          <option value="concluido">Concluído</option>
          <option value="estourado">Estourado</option>
          <option value="dentro da meta">Dentro da Meta</option>
        </select>
        <select value={filters.level} onChange={(event) => updateFilter("level", event.target.value)} className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm">
          <option value="">Todos os níveis</option>
          <option value="critico">Crítico</option>
          <option value="alto">Alto</option>
          <option value="medio">Médio</option>
          <option value="baixo">Baixo</option>
        </select>
        <input
          value={filters.owner}
          onChange={(event) => updateFilter("owner", event.target.value)}
          placeholder="Filtrar responsável"
          className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none md:col-span-4"
        />
      </div>
    </section>
  );
}

export function StatusReportTablePager({ tableId, pageSize = 8 }: { tableId: string; pageSize?: number }) {
  const [filters, setFilters] = useState<ReportFilters>(defaultFilters);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    function handleFilter(event: Event) {
      setFilters((event as CustomEvent<ReportFilters>).detail ?? defaultFilters);
      setPage(1);
    }

    window.addEventListener("status-report-filter", handleFilter);
    return () => window.removeEventListener("status-report-filter", handleFilter);
  }, []);

  useEffect(() => {
    const table = document.getElementById(tableId);
    if (!table) return;

    const rows = Array.from(table.querySelectorAll<HTMLElement>("[data-status-report-row]"));
    const matchingRows = rows.filter((row) => rowMatchesFilters(row, filters));
    const pages = Math.max(1, Math.ceil(matchingRows.length / pageSize));
    const safePage = Math.min(page, pages);
    const start = (safePage - 1) * pageSize;
    const end = start + pageSize;

    rows.forEach((row) => {
      row.hidden = true;
    });
    matchingRows.forEach((row, index) => {
      row.hidden = index < start || index >= end;
    });

    setTotal(matchingRows.length);
    if (safePage !== page) setPage(safePage);
  }, [filters, page, pageSize, tableId]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [pageSize, total]);

  if (total <= pageSize) {
    return <p className="mt-2 text-[11px] text-slate-500">{total} registro(s) exibido(s).</p>;
  }

  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500">
      <span>{total} registro(s) filtrado(s) · página {page} de {totalPages}</span>
      <div className="flex gap-2">
        <button type="button" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))} className="rounded border border-slate-300 px-3 py-1 font-bold disabled:opacity-40">
          Anterior
        </button>
        <button type="button" disabled={page >= totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))} className="rounded border border-slate-300 px-3 py-1 font-bold disabled:opacity-40">
          Próxima
        </button>
      </div>
    </div>
  );
}

function rowMatchesFilters(row: HTMLElement, filters: ReportFilters) {
  const text = normalize(row.dataset.reportText ?? row.textContent ?? "");
  const status = normalize(row.dataset.reportStatus ?? "");
  const owner = normalize(row.dataset.reportOwner ?? "");
  const level = normalize(row.dataset.reportLevel ?? "");

  if (filters.query && !text.includes(normalize(filters.query))) return false;
  if (filters.status && !status.includes(normalize(filters.status))) return false;
  if (filters.owner && !owner.includes(normalize(filters.owner))) return false;
  if (filters.level && !level.includes(normalize(filters.level))) return false;
  return true;
}

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}
