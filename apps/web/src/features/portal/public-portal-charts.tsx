"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const palette = ["#2563eb", "#06b6d4", "#7c3aed", "#f59e0b", "#ef4444", "#16a34a", "#0f172a"];

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-[0_8px_30px_rgba(0,0,0,.12)]">
      {label ? <p className="mb-1.5 text-[11px] font-bold text-slate-500">{label}</p> : null}
      {payload.map((entry) => (
        <p key={entry.name} className="flex items-center gap-2 text-xs font-semibold text-slate-800">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: entry.color }} />
          {entry.name}: <strong>{entry.value}</strong>
        </p>
      ))}
    </div>
  );
}

export function MiniPieChart({ data }: { data: Array<{ name: string; value: number }> }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  return (
    <div>
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={48} outerRadius={76} paddingAngle={3}>
            {data.map((_, index) => (
              <Cell key={index} fill={palette[index % palette.length]} />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      {total > 0 ? (
        <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1.5">
          {data.map((entry, index) => (
            <span key={entry.name} className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: palette[index % palette.length] }} />
              {entry.name}
              <span className="text-slate-400">({entry.value})</span>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function ExecutiveBarChart({
  data,
  bars,
}: {
  data: Array<Record<string, string | number>>;
  bars: Array<{ key: string; color: string }>;
}) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 10, right: 12, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: "#f8fafc" }} />
        {bars.map((bar) => (
          <Bar key={bar.key} dataKey={bar.key} fill={bar.color} radius={[6, 6, 0, 0]} maxBarSize={48} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ProgressLineChart({ data }: { data: Array<{ name: string; planejado: number; real: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 10, right: 12, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id="gradPlanejado" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradReal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#16a34a" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "#64748b" }} domain={[0, 100]} axisLine={false} tickLine={false} />
        <Tooltip content={<ChartTooltip />} />
        <Area type="monotone" dataKey="planejado" stroke="#2563eb" strokeWidth={2.5} fill="url(#gradPlanejado)" name="Planejado" dot={{ r: 3, fill: "#2563eb" }} />
        <Area type="monotone" dataKey="real" stroke="#16a34a" strokeWidth={2.5} fill="url(#gradReal)" name="Realizado" dot={{ r: 3, fill: "#16a34a" }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function StatusCurveChart({
  data,
}: {
  data: Array<{ name: string; planejado: number; realizado: number | null }>;
}) {
  if (!data.length) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-sm font-semibold text-slate-500">
        Sem dados suficientes para montar a Curva S.
      </div>
    );
  }

  const chart = { left: 52, right: 870, top: 24, bottom: 232 };
  const width = chart.right - chart.left;
  const height = chart.bottom - chart.top;
  const xFor = (index: number) => chart.left + (data.length <= 1 ? width / 2 : (index / (data.length - 1)) * width);
  const yFor = (value: number) => chart.bottom - (clampChartPercent(value) / 100) * height;
  const plannedPoints = data.map((point, index) => ({ x: xFor(index), y: yFor(point.planejado), value: point.planejado, label: point.name }));
  const realizedPoints = data
    .map((point, index) => point.realizado == null ? null : ({ x: xFor(index), y: yFor(point.realizado), value: point.realizado, label: point.name }))
    .filter(Boolean) as Array<{ x: number; y: number; value: number; label: string }>;
  const plannedPath = svgPath(plannedPoints);
  const realizedPath = svgPath(realizedPoints);
  const plannedAreaPath = plannedPoints.length
    ? `${plannedPath} L ${plannedPoints[plannedPoints.length - 1].x.toFixed(1)} ${chart.bottom} L ${plannedPoints[0].x.toFixed(1)} ${chart.bottom} Z`
    : "";
  const lastPlanned = plannedPoints[plannedPoints.length - 1];
  const lastRealized = realizedPoints[realizedPoints.length - 1];
  const labelStep = Math.max(1, Math.ceil(data.length / 7));

  return (
    <div>
      <svg viewBox="0 0 930 292" className="h-[300px] w-full" role="img" aria-label="Curva S com progresso planejado e progresso feito">
        <defs>
          <linearGradient id="statusCurvePlannedFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {[0, 25, 50, 75, 100].map((value) => {
          const y = yFor(value);
          return (
            <g key={value}>
              <line x1={chart.left} x2={chart.right} y1={y} y2={y} stroke="#edf2f7" />
              <text x={chart.left - 10} y={y + 4} textAnchor="end" fontSize="11" fontWeight="600" fill="#64748b">
                {value}%
              </text>
            </g>
          );
        })}

        <line x1={chart.left} x2={chart.right} y1={chart.bottom} y2={chart.bottom} stroke="#e2e8f0" />

        {data.map((point, index) => {
          if (index % labelStep !== 0 && index !== data.length - 1) return null;
          return (
            <text key={`${point.name}-${index}`} x={xFor(index)} y={chart.bottom + 22} textAnchor="middle" fontSize="11" fontWeight="600" fill="#64748b">
              {point.name}
            </text>
          );
        })}

        {plannedAreaPath ? <path d={plannedAreaPath} fill="url(#statusCurvePlannedFill)" /> : null}
        {plannedPath ? <path d={plannedPath} fill="none" stroke="#0ea5e9" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" /> : null}
        {realizedPath ? <path d={realizedPath} fill="none" stroke="#1e3a5f" strokeDasharray="8 6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" /> : null}

        {plannedPoints.map((point) => (
          <circle key={`planned-${point.label}`} cx={point.x} cy={point.y} r="3" fill="#0ea5e9">
            <title>{`${point.label} - Planejado: ${formatChartPercent(point.value)}`}</title>
          </circle>
        ))}

        {realizedPoints.map((point) => (
          <circle key={`realized-${point.label}`} cx={point.x} cy={point.y} r="4" fill="white" stroke="#1e3a5f" strokeWidth="2">
            <title>{`${point.label} - Feito: ${formatChartPercent(point.value)}`}</title>
          </circle>
        ))}

        {lastPlanned ? (
          <text x={Math.min(lastPlanned.x + 8, 900)} y={lastPlanned.y - 8} fontSize="11" fontWeight="800" fill="#0ea5e9">
            {formatChartPercent(lastPlanned.value)} planejado
          </text>
        ) : null}
        {lastRealized ? (
          <text x={Math.min(lastRealized.x + 8, 900)} y={Math.max(14, lastRealized.y + 16)} fontSize="11" fontWeight="800" fill="#1e3a5f">
            {formatChartPercent(lastRealized.value)} feito
          </text>
        ) : null}
      </svg>

      <div className="mt-3 flex justify-center gap-6">
        <span className="flex items-center gap-2 text-[11px] font-semibold text-slate-600">
          <span className="inline-block h-1 w-6 rounded-full bg-sky-400" />
          Progresso Planejado
        </span>
        <span className="flex items-center gap-2 text-[11px] font-semibold text-slate-600">
          <span className="inline-block h-0 w-6 border-b-2 border-dashed border-[#1e3a5f]" />
          Progresso Feito
        </span>
      </div>
    </div>
  );
}

function svgPath(points: Array<{ x: number; y: number }>) {
  return points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(" ");
}

function clampChartPercent(value: number) {
  return Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0));
}

function formatChartPercent(value: number) {
  return `${value.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
}
