"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma/client";

const schema = z.object({
  taskId: z.string(),
  userId: z.string().optional(),
  date: z.coerce.date(),
  hours: z.coerce.number().positive(),
  description: z.string().min(3),
  comment: z.string().optional()
});

export async function createTimeEntryAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Usuario nao autenticado.");

  const data = schema.parse(Object.fromEntries(formData));
  const task = await prisma.task.findUnique({
    where: { id: data.taskId },
    include: { participants: true, allocations: true }
  });
  if (!task) throw new Error("Tarefa nao encontrada.");

  const canPointForOthers = ["ADMIN", "PROJECT_MANAGER"].includes(String(session.user.role));
  const targetUserId = canPointForOthers && data.userId ? data.userId : session.user.id;
  const assigned =
    task.ownerId === session.user.id ||
    task.participants.some((item) => item.userId === session.user.id) ||
    task.allocations.some((allocation) => allocation.userId === session.user.id);

  if (!assigned && !canPointForOthers) {
    throw new Error("Funcionarios so apontam horas em tarefas de projetos em que estao alocados.");
  }

  await prisma.timeEntry.create({
    data: {
      taskId: data.taskId,
      date: data.date,
      hours: data.hours,
      description: data.description,
      projectId: task.projectId,
      userId: targetUserId,
      comment: data.comment || null
    }
  });

  const aggregate = await prisma.timeEntry.aggregate({
    where: { taskId: data.taskId },
    _sum: { hours: true }
  });

  await prisma.task.update({
    where: { id: data.taskId },
    data: { actualHours: aggregate._sum.hours ?? 0 }
  });

  const projectAggregate = await prisma.timeEntry.aggregate({
    where: { projectId: task.projectId },
    _sum: { hours: true }
  });

  await prisma.project.update({
    where: { id: task.projectId },
    data: { actualHours: projectAggregate._sum.hours ?? 0 }
  });

  revalidatePath(`/projects/${task.projectId}`);
  revalidatePath(`/projects/${task.projectId}/tasks`);
  revalidatePath("/tasks");
  revalidatePath("/time-entries");
}
