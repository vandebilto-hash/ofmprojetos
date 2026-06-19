"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
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

function CurveTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number | null; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-[0_8px_30px_rgba(0,0,0,.12)]">
      {label ? <p className="mb-1.5 text-[11px] font-bold text-slate-500">{label}</p> : null}
      {payload.map((entry) =>
        entry.value != null ? (
          <p key={entry.name} className="flex items-center gap-2 text-xs font-semibold text-slate-800">
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: entry.color }} />
            {entry.name}: <strong>{`${Number(entry.value).toFixed(1)}%`}</strong>
          </p>
        ) : null,
      )}
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
  return (
    <div>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ top: 18, right: 18, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id="gradCurvePlan" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.22} />
              <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
          <YAxis
            tick={{ fontSize: 11, fill: "#64748b" }}
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CurveTooltip />} />
          <Area
            type="monotone"
            dataKey="planejado"
            stroke="#0ea5e9"
            strokeWidth={2.5}
            fill="url(#gradCurvePlan)"
            name="Progresso Planejado"
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="realizado"
            stroke="#1e3a5f"
            strokeDasharray="8 5"
            strokeWidth={2.5}
            dot={{ r: 4, fill: "white", stroke: "#1e3a5f", strokeWidth: 2 }}
            connectNulls
            name="Progresso Realizado"
          />
        </AreaChart>
      </ResponsiveContainer>
      <div className="mt-3 flex justify-center gap-6">
        <span className="flex items-center gap-2 text-[11px] font-semibold text-slate-600">
          <span className="inline-block h-1 w-6 rounded-full bg-sky-400" />
          Progresso Planejado
        </span>
        <span className="flex items-center gap-2 text-[11px] font-semibold text-slate-600">
          <span className="inline-block h-0 w-6 border-b-2 border-dashed border-[#1e3a5f]" />
          Progresso Realizado
        </span>
      </div>
    </div>
  );
}
