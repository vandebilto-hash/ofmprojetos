import { redirect } from "next/navigation";

export default function ProjectTasksPage({ params }: { params: { id: string } }) {
  redirect(`/projects/${params.id}/gantt`);
}
