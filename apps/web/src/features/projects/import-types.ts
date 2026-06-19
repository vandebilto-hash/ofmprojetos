export type ImportOptions = {
  activities: boolean;
  deadlines: boolean;
  hours: boolean;
  progress: boolean;
  resources: boolean;
};

export const DEFAULT_IMPORT_OPTIONS: ImportOptions = {
  activities: true,
  deadlines: true,
  hours: true,
  progress: true,
  resources: true
};

export const FIELD_CATEGORY_MAP: Record<string, keyof ImportOptions> = {
  "EDT": "activities",
  "Ocorrencia": "activities",
  "Nome": "activities",
  "Tipo Ocorrencia": "activities",
  "Situacao Ocorrencia": "progress",
  "Inicio": "deadlines",
  "Fim planejado": "deadlines",
  "Fim real": "deadlines",
  "Duracao": "deadlines",
  "Avanco": "progress",
  "Horas planejadas": "hours",
  "Horas executadas": "hours",
  "Status": "progress",
  "Responsavel": "resources"
};

export const CATEGORIES: Array<{ key: keyof ImportOptions; label: string; description: string }> = [
  { key: "activities", label: "Atividades", description: "Nomes, EDT/WBS, ocorrencia, tipo, novas tarefas" },
  { key: "deadlines", label: "Prazos", description: "Inicio, fim, duracao" },
  { key: "hours", label: "Horas", description: "Estimadas e executadas" },
  { key: "progress", label: "Progresso", description: "Avanco, situacao e status" },
  { key: "resources", label: "Responsaveis", description: "Alocacao de recursos" }
];
