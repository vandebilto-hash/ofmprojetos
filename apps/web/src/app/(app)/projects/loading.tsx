import { Skeleton, SkeletonTable } from "@/components/ui/skeleton";

export default function ProjectsLoading() {
  return (
    <div role="status" aria-label="Carregando projetos...">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Skeleton className="h-7 w-32" />
          <Skeleton className="mt-2 h-4 w-48" />
        </div>
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>
      <SkeletonTable rows={8} cols={5} />
    </div>
  );
}
