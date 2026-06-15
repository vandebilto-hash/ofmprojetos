export const statusLabels: Record<string, string> = {
  PLANNED: "Planejado",
  IN_PROGRESS: "Em andamento",
  BLOCKED: "Bloqueado",
  ON_HOLD: "Em espera",
  COMPLETED: "Concluido",
  CANCELED: "Cancelado",
  TODO: "A fazer",
  IN_REVIEW: "Em validacao",
  DONE: "Concluido",
  OPEN: "Aberto",
  RESOLVED: "Resolvido",
  ACTIVE: "Ativo",
  INACTIVE: "Inativo"
};

export const priorityLabels: Record<string, string> = {
  LOW: "Baixa",
  MEDIUM: "Media",
  HIGH: "Alta",
  CRITICAL: "Critica"
};

export function statusLabel(value: string | null | undefined) {
  if (!value) return "";
  return statusLabels[value] ?? value.replaceAll("_", " ");
}

export function priorityLabel(value: string | null | undefined) {
  if (!value) return "";
  return priorityLabels[value] ?? value.replaceAll("_", " ");
}
