type TaskNode = {
  id: string;
  plannedDuration: number;
};

type Dependency = {
  predecessorId: string;
  successorId: string;
};

export function criticalPath(taskNodes: TaskNode[], dependencies: Dependency[]) {
  const byId = new Map(taskNodes.map((task) => [task.id, task]));
  const successors = new Map<string, string[]>();
  const indegree = new Map<string, number>();

  for (const task of taskNodes) {
    successors.set(task.id, []);
    indegree.set(task.id, 0);
  }

  for (const dependency of dependencies) {
    if (!byId.has(dependency.predecessorId) || !byId.has(dependency.successorId)) continue;
    successors.get(dependency.predecessorId)?.push(dependency.successorId);
    indegree.set(dependency.successorId, (indegree.get(dependency.successorId) ?? 0) + 1);
  }

  const queue = taskNodes.filter((task) => (indegree.get(task.id) ?? 0) === 0).map((task) => task.id);
  const earliestFinish = new Map<string, number>();
  const predecessorOnPath = new Map<string, string | null>();

  for (const task of taskNodes) {
    earliestFinish.set(task.id, task.plannedDuration);
    predecessorOnPath.set(task.id, null);
  }

  while (queue.length) {
    const current = queue.shift()!;
    for (const next of successors.get(current) ?? []) {
      const currentFinish = earliestFinish.get(current) ?? 0;
      const nextTask = byId.get(next)!;
      const candidate = currentFinish + nextTask.plannedDuration;
      if (candidate > (earliestFinish.get(next) ?? 0)) {
        earliestFinish.set(next, candidate);
        predecessorOnPath.set(next, current);
      }
      indegree.set(next, (indegree.get(next) ?? 1) - 1);
      if ((indegree.get(next) ?? 0) === 0) queue.push(next);
    }
  }

  let endId: string | null = null;
  let maxFinish = -1;
  for (const [id, finish] of earliestFinish) {
    if (finish > maxFinish) {
      maxFinish = finish;
      endId = id;
    }
  }

  const path = new Set<string>();
  while (endId) {
    path.add(endId);
    endId = predecessorOnPath.get(endId) ?? null;
  }

  return path;
}
