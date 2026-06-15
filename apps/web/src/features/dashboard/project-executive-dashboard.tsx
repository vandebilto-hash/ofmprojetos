"use client";

import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type ProjectExecutiveDashboardProps = {
  statusData: Array<{ name: string; value: number }>;
  riskData: Array<{ name: string; value: number }>;
  hoursData: Array<{ name: string; planejadas: number; executadas: number }>;
};

const colors = ["#2563eb", "#16a34a", "#f59e0b", "#dc2626", "#7c3aed"];

export function ProjectExecutiveDashboard({ statusData, riskData, hoursData }: ProjectExecutiveDashboardProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <ChartCard title="Atividades por status" className="lg:col-span-1">
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie data={statusData} dataKey="value" nameKey="name" outerRadius={90} label>
              {statusData.map((_, index) => <Cell key={index} fill={colors[index % colors.length]} />)}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Riscos por criticidade" className="lg:col-span-1">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={riskData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="value" fill="#dc2626" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Horas planejadas x executadas" className="lg:col-span-1">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={hoursData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="planejadas" fill="#2563eb" radius={[8, 8, 0, 0]} />
            <Bar dataKey="executadas" fill="#16a34a" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

function ChartCard({ title, className, children }: { title: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={`rounded-xl border border-line bg-white p-5 shadow-soft ${className ?? ""}`}>
      <h2 className="mb-4 text-lg font-bold text-ink">{title}</h2>
      {children}
    </div>
  );
}
