"use client";

import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const palette = ["#0f1b3d", "#2563eb", "#06b6d4", "#f59e0b", "#dc2626", "#16a34a", "#7c3aed"];

export function MiniPieChart({ data }: { data: Array<{ name: string; value: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={52} outerRadius={84} paddingAngle={4}>
          {data.map((_, index) => <Cell key={index} fill={palette[index % palette.length]} />)}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function ExecutiveBarChart({ data, bars }: { data: Array<Record<string, string | number>>; bars: Array<{ key: string; color: string }> }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 10, right: 12, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip />
        {bars.map((bar) => <Bar key={bar.key} dataKey={bar.key} fill={bar.color} radius={[8, 8, 0, 0]} />)}
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ProgressLineChart({ data }: { data: Array<{ name: string; planejado: number; real: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 10, right: 12, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
        <Tooltip />
        <Line type="monotone" dataKey="planejado" stroke="#2563eb" strokeWidth={3} dot={{ r: 3 }} />
        <Line type="monotone" dataKey="real" stroke="#16a34a" strokeWidth={3} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
