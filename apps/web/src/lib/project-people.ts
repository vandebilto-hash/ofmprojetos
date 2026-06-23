type ProjectPersonSource = {
  manager?: { name: string } | null;
  stakeholders?: Array<{ name: string }>;
  allocations?: Array<{ user?: { name: string } | null }>;
};

export function getProjectPeople(project: ProjectPersonSource) {
  return Array.from(
    new Set([
      project.manager?.name,
      ...(project.stakeholders ?? []).map((item) => item.name),
      ...(project.allocations ?? []).map((item) => item.user?.name)
    ].filter((name): name is string => Boolean(name?.trim())))
  ).sort((a, b) => a.localeCompare(b));
}
