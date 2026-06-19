export const portalModules = [
  {
    key: "home",
    label: "Home",
    description: "Missao, cliente, parceiros, proposta e escopo.",
    href: "home"
  },
  {
    key: "governance",
    label: "Governanca",
    description: "Stakeholders, mapa de influencia/interesse e dashboard analitico.",
    href: "governance"
  },
  {
    key: "plans",
    label: "Planos",
    description: "Documentos e links do Google Drive.",
    href: "plans"
  },
  {
    key: "downloads",
    label: "Downloads",
    description: "Central de documentos importantes para visualizacao e download.",
    href: "downloads"
  },
  {
    key: "emails",
    label: "E-mails importantes",
    description: "Registro de comunicacoes formais relevantes do projeto.",
    href: "emails"
  },
  {
    key: "minutes",
    label: "Central de atas",
    description: "Atas, reunioes, decisoes e encaminhamentos publicados.",
    href: "minutes"
  },
  {
    key: "milestones",
    label: "Marcos do projeto",
    description: "Timeline dos principais eventos e entregas.",
    href: "milestones"
  },
  {
    key: "planning",
    label: "Planejamento",
    description: "Cronograma, EDT, horas planejadas e executadas.",
    href: "planning"
  },
  {
    key: "risks",
    label: "Riscos e pendencias",
    description: "Matriz de riscos e bloqueios do projeto.",
    href: "risks"
  },
  {
    key: "blockers",
    label: "Bloqueios",
    description: "Bloqueios, impedimentos, impactos e proximas acoes.",
    href: "blockers"
  },
  {
    key: "dashboard",
    label: "Status Report",
    description: "Relatorio executivo com progresso, cronograma, riscos, bloqueios e alocacao.",
    href: "dashboard"
  }
] as const;

export type PortalModuleKey = (typeof portalModules)[number]["key"];

export function portalModuleByKey(key: string) {
  return portalModules.find((module) => module.key === key);
}

export function defaultModuleSettings(projectId: string) {
  return portalModules.map((module, index) => ({
    projectId,
    key: module.key,
    label: module.label,
    description: module.description,
    enabled: true,
    visibleToClient: true,
    sortOrder: index
  }));
}
