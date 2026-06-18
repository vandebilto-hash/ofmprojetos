"use server";

import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { authOptions } from "@/lib/auth/options";
import { can } from "@/lib/permissions/rbac";
import { prisma } from "@/lib/prisma/client";

const userSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  roleName: z.enum(["ADMIN", "PROJECT_MANAGER", "EMPLOYEE", "CLIENT"]),
  clientId: z.string().optional(),
  jobTitle: z.string().optional(),
  weeklyCapacityHours: z.coerce.number().default(40),
  dailyCapacityHours: z.coerce.number().default(8),
  hourlyRate: z.coerce.number().optional()
});

const clientSchema = z.object({
  name: z.string().min(2),
  identifier: z.string().optional(),
  mainContact: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  notes: z.string().optional()
});

const userStatusSchema = z.object({
  userId: z.string().min(1),
  status: z.enum(["ACTIVE", "INACTIVE"])
});

const userDeleteSchema = z.object({
  userId: z.string().min(1)
});

const clientStatusSchema = z.object({
  clientId: z.string().min(1),
  status: z.enum(["ACTIVE", "INACTIVE"])
});

const clientDeleteSchema = z.object({
  clientId: z.string().min(1)
});

const systemSettingsSchema = z.object({
  companyName: z.string().min(2),
  defaultWeeklyCapacityHours: z.coerce.number().min(1).max(168),
  defaultDailyCapacityHours: z.coerce.number().min(1).max(24),
  defaultCurrency: z.string().min(3).max(3),
  allowClientReports: z.coerce.boolean().optional(),
  requirePasswordChange: z.coerce.boolean().optional()
});

type DeleteActionState = {
  status: "idle" | "success" | "blocked" | "error";
  message: string;
  causes: string[];
};

const initialDeleteState: DeleteActionState = {
  status: "idle",
  message: "",
  causes: []
};

export async function createUserAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!can(session?.user.role, "manage:users")) throw new Error("Sem permissao para criar usuarios.");

  const parsed = userSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const msg = parsed.error.errors.map((e) => e.message).join(", ");
    throw new Error(msg || "Dados invalidos.");
  }
  const data = parsed.data;

  const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
  if (existingUser) {
    throw new Error("Este e-mail ja esta cadastrado.");
  }

  const role = await prisma.role.findUniqueOrThrow({ where: { name: data.roleName } });
  const passwordHash = await bcrypt.hash(data.password, 12);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash,
      roleId: role.id,
      clientId: data.clientId || null,
      jobTitle: data.jobTitle || null,
      weeklyCapacityHours: data.weeklyCapacityHours,
      dailyCapacityHours: data.dailyCapacityHours,
      hourlyRate: data.hourlyRate,
      mustChangePassword: true
    }
  });

  await prisma.auditLog.create({
    data: {
      actorId: session?.user.id,
      entityType: "User",
      entityId: user.id,
      action: "CREATE",
      after: { id: user.id, name: user.name, email: user.email, roleName: data.roleName }
    }
  });

  revalidatePath("/admin/users");
  revalidatePath("/admin");
}

export async function createClientAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!can(session?.user.role, "manage:clients")) throw new Error("Sem permissao para criar clientes.");

  const data = clientSchema.parse(Object.fromEntries(formData));
  const client = await prisma.client.create({
    data: {
      name: data.name,
      identifier: data.identifier || null,
      mainContact: data.mainContact || null,
      email: data.email || null,
      phone: data.phone || null,
      notes: data.notes || null
    }
  });

  await prisma.auditLog.create({
    data: {
      actorId: session?.user.id,
      entityType: "Client",
      entityId: client.id,
      action: "CREATE",
      after: client
    }
  });

  revalidatePath("/admin/clients");
  revalidatePath("/admin");
}

export async function updateUserStatusAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!can(session?.user.role, "manage:users")) throw new Error("Sem permissao para alterar usuarios.");

  const data = userStatusSchema.parse(Object.fromEntries(formData));
  const before = await prisma.user.findUniqueOrThrow({ where: { id: data.userId } });
  const user = await prisma.user.update({
    where: { id: data.userId },
    data: { status: data.status }
  });

  await prisma.auditLog.create({
    data: {
      actorId: session?.user.id,
      entityType: "User",
      entityId: user.id,
      action: "UPDATE_STATUS",
      before: { id: before.id, status: before.status },
      after: { id: user.id, status: user.status }
    }
  });

  revalidatePath("/admin/users");
  revalidatePath("/admin");
}

export async function deleteUserAction(_state: DeleteActionState = initialDeleteState, formData: FormData): Promise<DeleteActionState> {
  const session = await getServerSession(authOptions);
  if (!can(session?.user.role, "manage:users")) {
    return {
      status: "error",
      message: "Sem permissao para excluir usuarios.",
      causes: ["Seu perfil atual nao possui permissao administrativa para gerenciar usuarios."]
    };
  }

  const data = userDeleteSchema.parse(Object.fromEntries(formData));
  const before = await prisma.user.findUniqueOrThrow({
    where: { id: data.userId },
    include: {
      role: true,
      client: true,
      managedProjects: { select: { name: true }, orderBy: { name: "asc" }, take: 5 },
      ownedTasks: { select: { name: true, project: { select: { name: true } } }, orderBy: { name: "asc" }, take: 5 },
      timeEntries: { select: { task: { select: { name: true } }, project: { select: { name: true } } }, orderBy: { date: "desc" }, take: 5 },
      allocations: { select: { task: { select: { name: true } }, project: { select: { name: true } } }, orderBy: { createdAt: "desc" }, take: 5 },
      comments: { select: { task: { select: { name: true } } }, orderBy: { createdAt: "desc" }, take: 5 },
      uploadedDocuments: { select: { name: true }, orderBy: { createdAt: "desc" }, take: 5 },
      notifications: { select: { title: true }, orderBy: { createdAt: "desc" }, take: 5 },
      auditLogs: { select: { action: true, entityType: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 5 }
    }
  });

  const causes = [
    data.userId === session?.user.id ? "Este e o usuario atualmente logado. Excluir a propria conta poderia interromper a sessao administrativa." : "",
    before.managedProjects.length ? `Gerencia projeto(s): ${before.managedProjects.map((project) => project.name).join(", ")}.` : "",
    before.ownedTasks.length ? `E responsavel por tarefa(s): ${before.ownedTasks.map((task) => `${task.project.name} / ${task.name}`).join(", ")}.` : "",
    before.timeEntries.length ? `Possui apontamento(s) de horas em: ${before.timeEntries.map((entry) => `${entry.project.name} / ${entry.task.name}`).join(", ")}.` : "",
    before.allocations.length ? `Possui alocacao(oes) em: ${before.allocations.map((allocation) => `${allocation.project.name} / ${allocation.task?.name ?? "tarefa nao vinculada"}`).join(", ")}.` : "",
    before.comments.length ? `Possui comentario(s) em tarefa(s): ${before.comments.map((comment) => comment.task.name).join(", ")}.` : "",
    before.uploadedDocuments.length ? `Enviou documento(s): ${before.uploadedDocuments.map((document) => document.name).join(", ")}.` : "",
    before.notifications.length ? `Possui notificacao(oes): ${before.notifications.map((notification) => notification.title).join(", ")}.` : "",
    before.auditLogs.length ? `Aparece em auditoria: ${before.auditLogs.map((log) => `${log.action} em ${log.entityType}`).join(", ")}.` : ""
  ].filter(Boolean);

  if (causes.length > 0) {
    await prisma.user.update({
      where: { id: data.userId },
      data: { status: "INACTIVE" }
    });

    await prisma.auditLog.create({
      data: {
        actorId: session?.user.id,
        entityType: "User",
        entityId: data.userId,
        action: "DELETE_BLOCKED_INACTIVATED",
        before: { id: before.id, status: before.status },
        after: { id: before.id, status: "INACTIVE", causes }
      }
    });

    revalidatePath("/admin/users");
    revalidatePath("/admin");
    return {
      status: "blocked",
      message: "A exclusao foi bloqueada para preservar o historico. O usuario foi inativado.",
      causes
    };
  }

  await prisma.user.delete({ where: { id: data.userId } });
  await prisma.auditLog.create({
    data: {
      actorId: session?.user.id,
      entityType: "User",
      entityId: data.userId,
      action: "DELETE",
      before: {
        id: before.id,
        name: before.name,
        email: before.email,
        role: before.role.name,
        client: before.client?.name ?? null
      }
    }
  });

  revalidatePath("/admin/users");
  revalidatePath("/admin");
  return {
    status: "success",
    message: "Usuario excluido com sucesso.",
    causes: []
  };
}

export async function updateClientStatusAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!can(session?.user.role, "manage:clients")) throw new Error("Sem permissao para alterar clientes.");

  const data = clientStatusSchema.parse(Object.fromEntries(formData));
  const before = await prisma.client.findUniqueOrThrow({ where: { id: data.clientId } });
  const client = await prisma.client.update({
    where: { id: data.clientId },
    data: { status: data.status }
  });

  await prisma.auditLog.create({
    data: {
      actorId: session?.user.id,
      entityType: "Client",
      entityId: client.id,
      action: "UPDATE_STATUS",
      before: { id: before.id, status: before.status },
      after: { id: client.id, status: client.status }
    }
  });

  revalidatePath("/admin/clients");
  revalidatePath("/admin");
}

export async function deleteClientAction(_state: DeleteActionState = initialDeleteState, formData: FormData): Promise<DeleteActionState> {
  const session = await getServerSession(authOptions);
  if (!can(session?.user.role, "manage:clients")) {
    return {
      status: "error",
      message: "Sem permissao para excluir clientes.",
      causes: ["Seu perfil atual nao possui permissao administrativa para gerenciar clientes."]
    };
  }

  const data = clientDeleteSchema.parse(Object.fromEntries(formData));
  const before = await prisma.client.findUniqueOrThrow({
    where: { id: data.clientId },
    include: {
      projects: { select: { name: true }, orderBy: { name: "asc" }, take: 8 },
      users: { select: { name: true, email: true }, orderBy: { name: "asc" }, take: 8 },
      documents: { select: { name: true }, orderBy: { createdAt: "desc" }, take: 8 }
    }
  });

  const causes = [
    before.projects.length ? `Possui projeto(s) vinculado(s): ${before.projects.map((project) => project.name).join(", ")}.` : "",
    before.users.length ? `Possui usuario(s) vinculado(s): ${before.users.map((user) => `${user.name} (${user.email})`).join(", ")}.` : "",
    before.documents.length ? `Possui documento(s) vinculado(s): ${before.documents.map((document) => document.name).join(", ")}.` : ""
  ].filter(Boolean);

  if (causes.length > 0) {
    await prisma.client.update({
      where: { id: data.clientId },
      data: { status: "INACTIVE" }
    });

    await prisma.auditLog.create({
      data: {
        actorId: session?.user.id,
        entityType: "Client",
        entityId: data.clientId,
        action: "DELETE_BLOCKED_INACTIVATED",
        before: { id: before.id, status: before.status },
        after: { id: before.id, status: "INACTIVE", causes }
      }
    });

    revalidatePath("/admin/clients");
    revalidatePath("/admin");
    return {
      status: "blocked",
      message: "A exclusao foi bloqueada para preservar o historico. O cliente foi inativado.",
      causes
    };
  }

  await prisma.client.delete({ where: { id: data.clientId } });
  await prisma.auditLog.create({
    data: {
      actorId: session?.user.id,
      entityType: "Client",
      entityId: data.clientId,
      action: "DELETE",
      before
    }
  });

  revalidatePath("/admin/clients");
  revalidatePath("/admin");
  return {
    status: "success",
    message: "Cliente excluido com sucesso.",
    causes: []
  };
}

export async function updateSystemSettingsAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!can(session?.user.role, "manage:system")) throw new Error("Sem permissao para alterar configuracoes.");

  const data = systemSettingsSchema.parse(Object.fromEntries(formData));
  const entries = [
    ["companyName", data.companyName],
    ["defaultWeeklyCapacityHours", data.defaultWeeklyCapacityHours],
    ["defaultDailyCapacityHours", data.defaultDailyCapacityHours],
    ["defaultCurrency", data.defaultCurrency.toUpperCase()],
    ["allowClientReports", Boolean(data.allowClientReports)],
    ["requirePasswordChange", Boolean(data.requirePasswordChange)]
  ] as const;

  await prisma.$transaction(async (tx) => {
    for (const [key, value] of entries) {
      await tx.systemSetting.upsert({
        where: { key },
        update: { value },
        create: { key, value }
      });
    }

    await tx.auditLog.create({
      data: {
        actorId: session?.user.id,
        entityType: "SystemSetting",
        entityId: "system",
        action: "UPDATE",
        after: Object.fromEntries(entries)
      }
    });
  });

  revalidatePath("/admin/settings");
  revalidatePath("/admin");
}
