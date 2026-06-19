import { Skeleton, SkeletonTable } from "@/components/ui/skeleton";

export default function TasksLoading() {
  return (
    <div role="status" aria-label="Carregando tarefas...">
      <div className="mb-6">
        <Skeleton className="h-7 w-28" />
        <Skeleton className="mt-2 h-4 w-52" />
      </div>
      <div className="mb-4 flex gap-2">
        <Skeleton className="h-9 w-32 rounded-md" />
        <Skeleton className="h-9 w-32 rounded-md" />
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>
      <SkeletonTable rows={10} cols={6} />
    </div>
  );
}
