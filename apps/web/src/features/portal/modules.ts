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
    key: "documents",
    label: "Documentos",
    description: "E-mails, atas, planos e documentos importantes do projeto.",
    href: "documents"
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
