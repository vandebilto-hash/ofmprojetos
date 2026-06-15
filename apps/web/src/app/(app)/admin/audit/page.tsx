import { PageHeader } from "@/components/ui/page-header";
import { formatDate } from "@/lib/format";
import { prisma } from "@/lib/prisma/client";

export default async function AuditPage() {
  const logs = await prisma.auditLog.findMany({ include: { actor: true }, orderBy: { createdAt: "desc" }, take: 100 });
  return (
    <>
      <PageHeader title="Auditoria" description="Historico das alteracoes relevantes do sistema." />
      <div className="grid gap-2">
        {logs.map((log) => (
          <div key={log.id} className="rounded-md border border-line bg-white p-3 text-sm shadow-sm">
            <strong>{log.action}</strong> em {log.entityType} por {log.actor?.name ?? "Sistema"} | {formatDate(log.createdAt)}
          </div>
        ))}
      </div>
    </>
  );
}
