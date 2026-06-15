import { PageHeader } from "@/components/ui/page-header";

const matrix = [
  ["Cliente", "Somente leitura de projetos vinculados ao seu cadastro"],
  ["Funcionario", "Tarefas atribuidas, comentarios, apontamento de horas e carga propria"],
  ["Gestor", "Projetos, tarefas, recursos, baselines e relatorios"],
  ["Administrador", "Sistema, usuarios, clientes, projetos, tarefas, baselines, relatorios, configuracoes e auditoria"]
];

export default function PermissionsPage() {
  return (
    <>
      <PageHeader title="Permissoes" description="Matriz RBAC aplicada no backend e refletida no frontend." />
      <div className="grid gap-3">
        {matrix.map(([role, permissions]) => (
          <div key={role} className="rounded-lg border border-line bg-white p-4 shadow-soft">
            <h2 className="font-bold">{role}</h2>
            <p className="mt-2 text-sm text-slate-600">{permissions}</p>
          </div>
        ))}
      </div>
    </>
  );
}
