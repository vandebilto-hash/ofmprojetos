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

type PortalModuleSettingLike = {
  key: string;
  label?: string | null;
  description?: string | null;
  enabled?: boolean;
  visibleToClient?: boolean;
  sortOrder?: number | null;
};

const legacyDocumentModuleKeys = ["plans", "downloads", "emails", "minutes"];

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

export function portalModuleSettingFor(settingsByKey: Map<string, PortalModuleSettingLike>, key: string) {
  const setting = settingsByKey.get(key);
  if (setting || key !== "documents") return setting;

  const module = portalModuleByKey("documents");
  const legacySettings = legacyDocumentModuleKeys
    .map((legacyKey) => settingsByKey.get(legacyKey))
    .filter(Boolean) as PortalModuleSettingLike[];

  if (!legacySettings.length) {
    return {
      key: "documents",
      label: module?.label ?? "Documentos",
      description: module?.description ?? "Documentos do projeto.",
      enabled: true,
      visibleToClient: true,
      sortOrder: portalModules.findIndex((item) => item.key === "documents")
    };
  }

  const enabled = legacySettings.some((legacy) => legacy.enabled ?? true);
  const visibleToClient = legacySettings.some((legacy) => (legacy.enabled ?? true) && (legacy.visibleToClient ?? true));
  return {
    key: "documents",
    label: module?.label ?? "Documentos",
    description: module?.description ?? "Documentos do projeto.",
    enabled,
    visibleToClient,
    sortOrder: Math.min(...legacySettings.map((legacy) => Number(legacy.sortOrder ?? 0)))
  };
}
