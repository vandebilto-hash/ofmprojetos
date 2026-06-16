"use server";

import { randomBytes } from "crypto";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { authOptions } from "@/lib/auth/options";
import { defaultModuleSettings, portalModules } from "@/features/portal/modules";
import { canManageProject, canManageTask } from "@/lib/permissions/rbac";
import { prisma } from "@/lib/prisma/client";

const dateField = z.preprocess((value) => parseFormDate(value), z.coerce.date());
const optionalDateField = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) return undefined;
  return parseFormDate(value);
}, z.coerce.date().optional());

const projectSchema = z.object({
  name: z.string().min(3),
  description: z.string().optional(),
  clientId: z.string().min(1),
  managerId: z.string().min(1),
  plannedStart: dateField,
  plannedEnd: dateField,
  currentEnd: dateField,
  notes: z.string().optional()
});

const taskSchema = z.object({
  projectId: z.string().min(1),
  name: z.string().min(3),
  description: z.string().optional(),
  ownerId: z.string().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "BLOCKED", "DONE"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  plannedStart: dateField,
  plannedEnd: dateField,
  estimatedHours: z.coerce.number().min(0)
});

const taskDependencySchema = z.object({
  predecessorIds: z.array(z.string()).default([])
});

const taskUpdateSchema = taskSchema.extend({
  taskId: z.string().min(1),
  actualHours: z.coerce.number().min(0).optional(),
  progressPercent: z.coerce.number().min(0).max(100).optional()
});

const taskStatusSchema = z.object({
  taskId: z.string().min(1),
  status: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "BLOCKED", "DONE"])
});

const baselineUpdateSchema = z.object({
  baselineId: z.string().min(1),
  projectId: z.string().min(1),
  name: z.string().min(2),
  description: z.string().optional(),
  isActive: z.coerce.boolean().optional()
});

const allocationSchema = z.object({
  allocationId: z.string().optional(),
  projectId: z.string().min(1),
  taskId: z.string().min(1, "A alocacao de recurso deve estar vinculada a uma tarefa."),
  userId: z.string().min(1),
  startDate: dateField,
  endDate: dateField,
  allocatedHours: z.coerce.number().min(0)
});

const resourceSchema = z.object({
  userId: z.string().optional(),
  name: z.string().min(2),
  email: z.string().email().optional().or(z.literal("")),
  jobTitle: z.string().optional(),
  weeklyCapacityHours: z.coerce.number().min(0),
  dailyCapacityHours: z.coerce.number().min(0),
  hourlyRate: z.coerce.number().min(0).optional()
});

const resourceDeleteSchema = z.object({
  userId: z.string().min(1)
});

const blockerSchema = z.object({
  blockerId: z.string().optional(),
  projectId: z.string().min(1),
  taskId: z.string().optional(),
  title: z.string().min(3),
  description: z.string().optional(),
  resolverId: z.string().optional(),
  responsibleCompany: z.string().optional(),
  responsiblePerson: z.string().optional(),
  expectedResolutionAt: optionalDateField,
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CANCELED"]),
  scheduleImpactDays: z.coerce.number().int().default(0),
  impactDescription: z.string().optional(),
  nextAction: z.string().optional(),
  financialImpact: z.coerce.number().default(0)
});

const projectHomeSchema = z.object({
  projectId: z.string().min(1),
  mission: z.string().optional(),
  clientOverview: z.string().optional(),
  proposal: z.string().optional(),
  scope: z.string().optional()
});

const partnerSchema = z.object({
  partnerId: z.string().optional(),
  projectId: z.string().min(1),
  name: z.string().min(2),
  description: z.string().optional(),
  website: z.string().optional()
});

const stakeholderSchema = z.object({
  stakeholderId: z.string().optional(),
  projectId: z.string().min(1),
  name: z.string().min(2),
  company: z.string().optional(),
  jobTitle: z.string().optional(),
  type: z.enum(["INTERNAL", "CLIENT", "PARTNER", "SUPPLIER", "SPONSOR"]),
  email: z.string().optional(),
  phone: z.string().optional(),
  projectRole: z.string().optional(),
  influence: z.enum(["LOW", "MEDIUM", "HIGH"]),
  interest: z.enum(["LOW", "MEDIUM", "HIGH"]),
  classification: z.string().optional(),
  notes: z.string().optional()
});

const documentSchema = z.object({
  documentId: z.string().optional(),
  projectId: z.string().min(1),
  name: z.string().min(2),
  type: z.string().min(2),
  externalUrl: z.string().optional(),
  embedUrl: z.string().optional(),
  downloadUrl: z.string().optional(),
  version: z.string().optional(),
  status: z.string().optional(),
  visibility: z.enum(["INTERNAL", "PROJECT_TEAM", "CLIENT_VISIBLE"]),
  clientDownloadAllowed: z.coerce.boolean().optional()
});

const milestoneSchema = z.object({
  milestoneId: z.string().optional(),
  projectId: z.string().min(1),
  name: z.string().min(2),
  description: z.string().optional(),
  type: z.string().optional(),
  plannedDate: dateField,
  actualDate: optionalDateField,
  status: z.enum(["PLANNED", "IN_PROGRESS", "COMPLETED", "DELAYED"]),
  owner: z.string().optional(),
  evidenceUrl: z.string().optional(),
  notes: z.string().optional()
});

const riskSchema = z.object({
  riskId: z.string().optional(),
  projectId: z.string().min(1),
  name: z.string().min(2),
  description: z.string().optional(),
  classification: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  cause: z.string().optional(),
  event: z.string().optional(),
  impact: z.string().optional(),
  probability: z.enum(["LOW", "MEDIUM", "HIGH"]),
  responseStrategy: z.enum(["MITIGATE", "ACCEPT", "TRANSFER", "AVOID"]),
  preventiveActions: z.string().optional(),
  contingencyPlan: z.string().optional(),
  triggers: z.string().optional(),
  owner: z.string().optional(),
  status: z.enum(["OPEN", "IN_TREATMENT", "MATERIALIZED", "CLOSED"]),
  lastReviewAt: optionalDateField,
  notes: z.string().optional()
});

const importantEmailSchema = z.object({
  emailId: z.string().optional(),
  projectId: z.string().min(1),
  subject: z.string().min(2),
  summary: z.string().optional(),
  origin: z.string().optional(),
  involved: z.string().optional(),
  category: z.string().optional(),
  status: z.string().optional(),
  date: dateField,
  attachmentUrl: z.string().optional()
});

const meetingMinuteSchema = z.object({
  minuteId: z.string().optional(),
  projectId: z.string().min(1),
  title: z.string().min(2),
  summary: z.string().optional(),
  meetingDate: dateField,
  meetingType: z.string().optional(),
  participants: z.string().optional(),
  status: z.string().optional(),
  fileUrl: z.string().optional()
});

async function logProjectChange({
  actorId,
  projectId,
  entityType,
  entityId,
  action,
  description,
  before,
  after
}: {
  actorId?: string | null;
  projectId?: string | null;
  entityType: string;
  entityId: string;
  action: string;
  description: string;
  before?: unknown;
  after?: unknown;
}) {
  await prisma.auditLog.create({
    data: {
      actorId: actorId || null,
      projectId: projectId || null,
      entityType,
      entityId,
      action,
      description,
      before: before as any,
      after: after as any
    }
  });
}

const mppImportSchema = z.object({
  projectName: z.string().optional(),
  clientId: z.string().min(1),
  managerId: z.string().min(1),
  existingProjectId: z.string().optional()
});

export async function createProjectAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!canManageProject(session?.user.role)) throw new Error("Sem permissao para criar projetos.");

  const data = projectSchema.parse(Object.fromEntries(formData));
  const project = await prisma.project.create({
    data: {
      ...data,
      description: data.description || null,
      notes: data.notes || null,
      plannedHours: 0,
      actualHours: 0,
      remainingHours: 0,
      financialCost: 0
    }
  });

  await prisma.projectShareLink.create({
    data: {
      projectId: project.id,
      token: randomBytes(24).toString("hex"),
      active: true,
      allowDownloads: true
    }
  });

  await prisma.projectModuleSetting.createMany({
    data: defaultModuleSettings(project.id)
  });

  await logProjectChange({
    actorId: session?.user.id,
    projectId: project.id,
    entityType: "Project",
    entityId: project.id,
    action: "CREATE",
    description: `Criou o projeto ${project.name}.`,
    after: project
  });

  revalidatePath("/projects");
  redirect(`/projects/${project.id}`);
}

export async function updateProjectPortalModulesAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!canManageProject(session?.user.role)) throw new Error("Sem permissao para configurar o portal do cliente.");

  const projectId = String(formData.get("projectId"));
  if (!projectId) throw new Error("Projeto invalido.");

  const existingProject = await prisma.project.findUnique({ where: { id: projectId }, select: { id: true } });
  if (!existingProject) throw new Error("Projeto nao encontrado.");

  await Promise.all(
    portalModules.map((module, index) => {
      const enabled = formData.get(`${module.key}:enabled`) === "on";
      const visibleToClient = formData.get(`${module.key}:visibleToClient`) === "on";
      const label = String(formData.get(`${module.key}:label`) || module.label).trim() || module.label;

      return prisma.projectModuleSetting.upsert({
        where: { projectId_key: { projectId, key: module.key } },
        update: {
          label,
          description: module.description,
          enabled,
          visibleToClient,
          sortOrder: index
        },
        create: {
          projectId,
          key: module.key,
          label,
          description: module.description,
          enabled,
          visibleToClient,
          sortOrder: index
        }
      });
    })
  );

  await logProjectChange({
    actorId: session?.user.id,
    projectId,
    entityType: "ProjectModuleSetting",
    entityId: projectId,
    action: "UPDATE",
    description: "Atualizou os modulos visiveis no portal do cliente.",
    after: Object.fromEntries(portalModules.map((module) => [module.key, formData.get(`${module.key}:visibleToClient`) === "on"]))
  });

  revalidatePath(`/projects/${projectId}/portal`);
  revalidatePath(`/projects/${projectId}`);
}

export async function updateProjectPortalEmailsAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!canManageProject(session?.user.role)) throw new Error("Sem permissao para configurar o portal do cliente.");

  const shareLinkId = String(formData.get("shareLinkId"));
  const projectId = String(formData.get("projectId"));
  const allowedEmails = String(formData.get("allowedEmails") || "").trim() || null;

  if (!shareLinkId || !projectId) throw new Error("Dados invalidos.");

  await prisma.projectShareLink.update({
    where: { id: shareLinkId },
    data: { allowedEmails }
  });

  await logProjectChange({
    actorId: session?.user.id,
    projectId,
    entityType: "ProjectShareLink",
    entityId: shareLinkId,
    action: "UPDATE",
    description: allowedEmails
      ? "Atualizou e-mails autorizados no portal do cliente."
      : "Removeu restricao de e-mails no portal do cliente.",
    after: { allowedEmails }
  });

  revalidatePath(`/projects/${projectId}/portal`);
}

export async function generateProjectShareLinkAction(projectId: string) {
  const session = await getServerSession(authOptions);
  if (!canManageProject(session?.user.role)) throw new Error("Sem permissao para gerar link do portal.");

  const existing = await prisma.projectShareLink.findFirst({
    where: { projectId, active: true }
  });
  if (existing) return existing.token;

  const token = randomBytes(24).toString("hex");
  await prisma.projectShareLink.create({
    data: {
      projectId,
      token,
      active: true,
      allowDownloads: true
    }
  });

  await logProjectChange({
    actorId: session?.user.id,
    projectId,
    entityType: "ProjectShareLink",
    entityId: projectId,
    action: "CREATE",
    description: "Gerou link publico do portal do cliente.",
    after: { token, active: true }
  });

  revalidatePath(`/projects/${projectId}/portal`);
  return token;
}

export async function updateProjectHomeAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!canManageProject(session?.user.role)) throw new Error("Sem permissao para editar a Home do projeto.");
  const data = projectHomeSchema.parse(Object.fromEntries(formData));
  const home = await prisma.projectHome.upsert({
    where: { projectId: data.projectId },
    update: {
      mission: data.mission || null,
      clientOverview: data.clientOverview || null,
      proposal: data.proposal || null,
      scope: data.scope || null
    },
    create: {
      projectId: data.projectId,
      mission: data.mission || null,
      clientOverview: data.clientOverview || null,
      proposal: data.proposal || null,
      scope: data.scope || null
    }
  });
  await logProjectChange({ actorId: session?.user.id, projectId: data.projectId, entityType: "ProjectHome", entityId: home.id, action: "UPDATE", description: "Atualizou as informacoes da Home do projeto.", after: home });
  revalidateProjectModule(data.projectId);
}

export async function createPartnerAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!canManageProject(session?.user.role)) throw new Error("Sem permissao para criar parceiro.");
  const data = partnerSchema.parse(Object.fromEntries(formData));
  const partner = await prisma.partner.create({ data: { projectId: data.projectId, name: data.name, description: data.description || null, website: data.website || null } });
  await logProjectChange({ actorId: session?.user.id, projectId: data.projectId, entityType: "Partner", entityId: partner.id, action: "CREATE", description: `Adicionou o parceiro ${partner.name}.`, after: partner });
  revalidateProjectModule(data.projectId);
}

export async function updatePartnerAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!canManageProject(session?.user.role)) throw new Error("Sem permissao para editar parceiro.");
  const data = partnerSchema.parse(Object.fromEntries(formData));
  if (!data.partnerId) throw new Error("Parceiro invalido.");
  const before = await prisma.partner.findUniqueOrThrow({ where: { id: data.partnerId } });
  const partner = await prisma.partner.update({ where: { id: data.partnerId }, data: { name: data.name, description: data.description || null, website: data.website || null } });
  await logProjectChange({ actorId: session?.user.id, projectId: data.projectId, entityType: "Partner", entityId: partner.id, action: "UPDATE", description: `Atualizou o parceiro ${partner.name}.`, before, after: partner });
  revalidateProjectModule(data.projectId);
}

export async function createStakeholderAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!canManageProject(session?.user.role)) throw new Error("Sem permissao para criar stakeholder.");
  const data = stakeholderSchema.parse(Object.fromEntries(formData));
  const stakeholder = await prisma.stakeholder.create({
    data: {
      projectId: data.projectId,
      name: data.name,
      company: data.company || null,
      jobTitle: data.jobTitle || null,
      type: data.type,
      email: data.email || null,
      phone: data.phone || null,
      projectRole: data.projectRole || null,
      influence: data.influence,
      interest: data.interest,
      classification: data.classification || null,
      notes: data.notes || null
    }
  });
  await logProjectChange({ actorId: session?.user.id, projectId: data.projectId, entityType: "Stakeholder", entityId: stakeholder.id, action: "CREATE", description: `Adicionou o stakeholder ${stakeholder.name}.`, after: stakeholder });
  revalidateProjectModule(data.projectId);
}

export async function updateStakeholderAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!canManageProject(session?.user.role)) throw new Error("Sem permissao para editar stakeholder.");
  const data = stakeholderSchema.parse(Object.fromEntries(formData));
  if (!data.stakeholderId) throw new Error("Stakeholder invalido.");
  const before = await prisma.stakeholder.findUniqueOrThrow({ where: { id: data.stakeholderId } });
  const stakeholder = await prisma.stakeholder.update({
    where: { id: data.stakeholderId },
    data: {
      name: data.name,
      company: data.company || null,
      jobTitle: data.jobTitle || null,
      type: data.type,
      email: data.email || null,
      phone: data.phone || null,
      projectRole: data.projectRole || null,
      influence: data.influence,
      interest: data.interest,
      classification: data.classification || null,
      notes: data.notes || null
    }
  });
  await logProjectChange({ actorId: session?.user.id, projectId: data.projectId, entityType: "Stakeholder", entityId: stakeholder.id, action: "UPDATE", description: `Atualizou o stakeholder ${stakeholder.name}.`, before, after: stakeholder });
  revalidateProjectModule(data.projectId);
}

export async function createProjectDocumentAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!canManageProject(session?.user.role)) throw new Error("Sem permissao para criar documento.");
  const data = documentSchema.parse(Object.fromEntries(formData));
  const document = await prisma.document.create({
    data: {
      projectId: data.projectId,
      uploadedById: session!.user.id,
      name: data.name,
      type: data.type,
      sourceType: "GOOGLE_DRIVE",
      externalUrl: data.externalUrl || null,
      embedUrl: data.embedUrl || null,
      downloadUrl: data.downloadUrl || data.externalUrl || null,
      version: data.version || null,
      status: data.status || "Aprovado",
      visibility: data.visibility,
      clientDownloadAllowed: Boolean(data.clientDownloadAllowed)
    }
  });
  await logProjectChange({ actorId: session?.user.id, projectId: data.projectId, entityType: "Document", entityId: document.id, action: "CREATE", description: `Adicionou o documento ${document.name}.`, after: document });
  revalidateProjectModule(data.projectId);
}

export async function updateProjectDocumentAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!canManageProject(session?.user.role)) throw new Error("Sem permissao para editar documento.");
  const data = documentSchema.parse(Object.fromEntries(formData));
  if (!data.documentId) throw new Error("Documento invalido.");
  const before = await prisma.document.findUniqueOrThrow({ where: { id: data.documentId } });
  const document = await prisma.document.update({
    where: { id: data.documentId },
    data: {
      name: data.name,
      type: data.type,
      externalUrl: data.externalUrl || null,
      embedUrl: data.embedUrl || null,
      downloadUrl: data.downloadUrl || data.externalUrl || null,
      version: data.version || null,
      status: data.status || "Aprovado",
      visibility: data.visibility,
      clientDownloadAllowed: Boolean(data.clientDownloadAllowed)
    }
  });
  await logProjectChange({ actorId: session?.user.id, projectId: data.projectId, entityType: "Document", entityId: document.id, action: "UPDATE", description: `Atualizou o documento ${document.name}.`, before, after: document });
  revalidateProjectModule(data.projectId);
}

export async function createMilestoneAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!canManageProject(session?.user.role)) throw new Error("Sem permissao para criar marco.");
  const data = milestoneSchema.parse(Object.fromEntries(formData));
  const milestone = await prisma.milestone.create({
    data: {
      projectId: data.projectId,
      name: data.name,
      description: data.description || null,
      type: data.type || null,
      plannedDate: data.plannedDate,
      actualDate: data.actualDate || null,
      status: data.status,
      owner: data.owner || null,
      evidenceUrl: data.evidenceUrl || null,
      notes: data.notes || null
    }
  });
  await logProjectChange({ actorId: session?.user.id, projectId: data.projectId, entityType: "Milestone", entityId: milestone.id, action: "CREATE", description: `Adicionou o marco ${milestone.name}.`, after: milestone });
  revalidateProjectModule(data.projectId);
}

export async function updateMilestoneAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!canManageProject(session?.user.role)) throw new Error("Sem permissao para editar marco.");
  const data = milestoneSchema.parse(Object.fromEntries(formData));
  if (!data.milestoneId) throw new Error("Marco invalido.");
  const before = await prisma.milestone.findUniqueOrThrow({ where: { id: data.milestoneId } });
  const milestone = await prisma.milestone.update({
    where: { id: data.milestoneId },
    data: {
      name: data.name,
      description: data.description || null,
      type: data.type || null,
      plannedDate: data.plannedDate,
      actualDate: data.actualDate || null,
      status: data.status,
      owner: data.owner || null,
      evidenceUrl: data.evidenceUrl || null,
      notes: data.notes || null
    }
  });
  await logProjectChange({ actorId: session?.user.id, projectId: data.projectId, entityType: "Milestone", entityId: milestone.id, action: "UPDATE", description: `Atualizou o marco ${milestone.name}.`, before, after: milestone });
  revalidateProjectModule(data.projectId);
}

export async function createRiskAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!canManageProject(session?.user.role)) throw new Error("Sem permissao para criar risco.");
  const data = riskSchema.parse(Object.fromEntries(formData));
  const risk = await prisma.risk.create({
    data: {
      projectId: data.projectId,
      name: data.name,
      description: data.description || null,
      classification: data.classification,
      cause: data.cause || null,
      event: data.event || null,
      impact: data.impact || null,
      probability: data.probability,
      responseStrategy: data.responseStrategy,
      preventiveActions: data.preventiveActions || null,
      contingencyPlan: data.contingencyPlan || null,
      triggers: data.triggers || null,
      owner: data.owner || null,
      status: data.status,
      lastReviewAt: data.lastReviewAt || null,
      notes: data.notes || null
    }
  });
  await logProjectChange({ actorId: session?.user.id, projectId: data.projectId, entityType: "Risk", entityId: risk.id, action: "CREATE", description: `Adicionou o risco ${risk.name}.`, after: risk });
  revalidateProjectModule(data.projectId);
}

export async function updateRiskAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!canManageProject(session?.user.role)) throw new Error("Sem permissao para editar risco.");
  const data = riskSchema.parse(Object.fromEntries(formData));
  if (!data.riskId) throw new Error("Risco invalido.");
  const before = await prisma.risk.findUniqueOrThrow({ where: { id: data.riskId } });
  const risk = await prisma.risk.update({
    where: { id: data.riskId },
    data: {
      name: data.name,
      description: data.description || null,
      classification: data.classification,
      cause: data.cause || null,
      event: data.event || null,
      impact: data.impact || null,
      probability: data.probability,
      responseStrategy: data.responseStrategy,
      preventiveActions: data.preventiveActions || null,
      contingencyPlan: data.contingencyPlan || null,
      triggers: data.triggers || null,
      owner: data.owner || null,
      status: data.status,
      lastReviewAt: data.lastReviewAt || null,
      notes: data.notes || null
    }
  });
  await logProjectChange({ actorId: session?.user.id, projectId: data.projectId, entityType: "Risk", entityId: risk.id, action: "UPDATE", description: `Atualizou o risco ${risk.name}.`, before, after: risk });
  revalidateProjectModule(data.projectId);
}

export async function deletePartnerAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!canManageProject(session?.user.role)) throw new Error("Sem permissao para excluir parceiro.");
  const partnerId = String(formData.get("partnerId"));
  const projectId = String(formData.get("projectId"));
  const before = await prisma.partner.findUniqueOrThrow({ where: { id: partnerId } });
  await prisma.partner.delete({ where: { id: partnerId } });
  await logProjectChange({ actorId: session?.user.id, projectId, entityType: "Partner", entityId: partnerId, action: "DELETE", description: `Removeu o parceiro ${before.name}.`, before });
  revalidateProjectModule(projectId);
}

export async function deleteStakeholderAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!canManageProject(session?.user.role)) throw new Error("Sem permissao para excluir stakeholder.");
  const stakeholderId = String(formData.get("stakeholderId"));
  const projectId = String(formData.get("projectId"));
  const before = await prisma.stakeholder.findUniqueOrThrow({ where: { id: stakeholderId } });
  await prisma.stakeholder.delete({ where: { id: stakeholderId } });
  await logProjectChange({ actorId: session?.user.id, projectId, entityType: "Stakeholder", entityId: stakeholderId, action: "DELETE", description: `Removeu o stakeholder ${before.name}.`, before });
  revalidateProjectModule(projectId);
}

export async function deleteProjectDocumentAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!canManageProject(session?.user.role)) throw new Error("Sem permissao para excluir documento.");
  const documentId = String(formData.get("documentId"));
  const projectId = String(formData.get("projectId"));
  const before = await prisma.document.findUniqueOrThrow({ where: { id: documentId } });
  await prisma.document.delete({ where: { id: documentId } });
  await logProjectChange({ actorId: session?.user.id, projectId, entityType: "Document", entityId: documentId, action: "DELETE", description: `Removeu o documento ${before.name}.`, before });
  revalidateProjectModule(projectId);
}

export async function deleteMilestoneAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!canManageProject(session?.user.role)) throw new Error("Sem permissao para excluir marco.");
  const milestoneId = String(formData.get("milestoneId"));
  const projectId = String(formData.get("projectId"));
  const before = await prisma.milestone.findUniqueOrThrow({ where: { id: milestoneId } });
  await prisma.milestone.delete({ where: { id: milestoneId } });
  await logProjectChange({ actorId: session?.user.id, projectId, entityType: "Milestone", entityId: milestoneId, action: "DELETE", description: `Removeu o marco ${before.name}.`, before });
  revalidateProjectModule(projectId);
}

export async function deleteRiskAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!canManageProject(session?.user.role)) throw new Error("Sem permissao para excluir risco.");
  const riskId = String(formData.get("riskId"));
  const projectId = String(formData.get("projectId"));
  const before = await prisma.risk.findUniqueOrThrow({ where: { id: riskId } });
  await prisma.risk.delete({ where: { id: riskId } });
  await logProjectChange({ actorId: session?.user.id, projectId, entityType: "Risk", entityId: riskId, action: "DELETE", description: `Removeu o risco ${before.name}.`, before });
  revalidateProjectModule(projectId);
}

export async function upsertImportantEmailAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!canManageProject(session?.user.role)) throw new Error("Sem permissao para salvar e-mail.");
  const data = importantEmailSchema.parse(Object.fromEntries(formData));
  const payload = {
    projectId: data.projectId,
    subject: data.subject,
    summary: data.summary || null,
    origin: data.origin || null,
    involved: data.involved || null,
    category: data.category || "E-mail Formal",
    status: data.status || "Solucionado",
    date: data.date,
    attachmentUrl: data.attachmentUrl || null
  };
  const before = data.emailId ? await prisma.importantEmail.findUnique({ where: { id: data.emailId } }) : null;
  const email = data.emailId
    ? await prisma.importantEmail.update({ where: { id: data.emailId }, data: payload })
    : await prisma.importantEmail.create({ data: payload });
  await logProjectChange({ actorId: session?.user.id, projectId: data.projectId, entityType: "ImportantEmail", entityId: email.id, action: data.emailId ? "UPDATE" : "CREATE", description: `${data.emailId ? "Atualizou" : "Adicionou"} o e-mail ${email.subject}.`, before, after: email });
  revalidateProjectModule(data.projectId);
}

export async function deleteImportantEmailAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!canManageProject(session?.user.role)) throw new Error("Sem permissao para excluir e-mail.");
  const emailId = String(formData.get("emailId"));
  const projectId = String(formData.get("projectId"));
  const before = await prisma.importantEmail.findUniqueOrThrow({ where: { id: emailId } });
  await prisma.importantEmail.delete({ where: { id: emailId } });
  await logProjectChange({ actorId: session?.user.id, projectId, entityType: "ImportantEmail", entityId: emailId, action: "DELETE", description: `Removeu o e-mail ${before.subject}.`, before });
  revalidateProjectModule(projectId);
}

export async function upsertMeetingMinuteAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!canManageProject(session?.user.role)) throw new Error("Sem permissao para salvar ata.");
  const data = meetingMinuteSchema.parse(Object.fromEntries(formData));
  const payload = {
    projectId: data.projectId,
    title: data.title,
    summary: data.summary || null,
    meetingDate: data.meetingDate,
    meetingType: data.meetingType || null,
    participants: data.participants || null,
    status: data.status || "Publicado",
    fileUrl: data.fileUrl || null
  };
  const before = data.minuteId ? await prisma.meetingMinute.findUnique({ where: { id: data.minuteId } }) : null;
  const minute = data.minuteId
    ? await prisma.meetingMinute.update({ where: { id: data.minuteId }, data: payload })
    : await prisma.meetingMinute.create({ data: payload });
  await logProjectChange({ actorId: session?.user.id, projectId: data.projectId, entityType: "MeetingMinute", entityId: minute.id, action: data.minuteId ? "UPDATE" : "CREATE", description: `${data.minuteId ? "Atualizou" : "Adicionou"} a ata ${minute.title}.`, before, after: minute });
  revalidateProjectModule(data.projectId);
}

export async function deleteMeetingMinuteAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!canManageProject(session?.user.role)) throw new Error("Sem permissao para excluir ata.");
  const minuteId = String(formData.get("minuteId"));
  const projectId = String(formData.get("projectId"));
  const before = await prisma.meetingMinute.findUniqueOrThrow({ where: { id: minuteId } });
  await prisma.meetingMinute.delete({ where: { id: minuteId } });
  await logProjectChange({ actorId: session?.user.id, projectId, entityType: "MeetingMinute", entityId: minuteId, action: "DELETE", description: `Removeu a ata ${before.title}.`, before });
  revalidateProjectModule(projectId);
}

export async function updateResourceAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!canManageProject(session?.user.role)) throw new Error("Sem permissao para editar recursos.");

  const data = resourceSchema.parse(Object.fromEntries(formData));
  if (!data.userId) throw new Error("Recurso invalido.");
  const before = await prisma.user.findUniqueOrThrow({ where: { id: data.userId } });
  const resource = await prisma.user.update({
    where: { id: data.userId },
    data: {
      name: data.name,
      jobTitle: data.jobTitle || null,
      weeklyCapacityHours: data.weeklyCapacityHours,
      dailyCapacityHours: data.dailyCapacityHours,
      hourlyRate: data.hourlyRate ?? null
    }
  });

  const projectIds = await resourceProjectIds(data.userId);
  for (const projectId of projectIds) await recalculateProject(projectId);

  await prisma.auditLog.create({
    data: {
      actorId: session?.user.id,
      entityType: "User",
      entityId: resource.id,
      action: "UPDATE_RESOURCE",
      before: { id: before.id, name: before.name, hourlyRate: before.hourlyRate },
      after: { id: resource.id, name: resource.name, hourlyRate: resource.hourlyRate }
    }
  });

  revalidatePath("/resources");
  revalidatePath("/projects");
  for (const projectId of projectIds) {
    revalidatePath(`/projects/${projectId}/resources`);
    revalidateProjectModule(projectId);
  }
}

export async function createResourceAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!canManageProject(session?.user.role)) throw new Error("Sem permissao para criar recursos.");

  const data = resourceSchema.parse(Object.fromEntries(formData));
  const role = await prisma.role.findUniqueOrThrow({ where: { name: "EMPLOYEE" } });
  const email = data.email || `recurso-${slugify(data.name)}-${randomBytes(4).toString("hex")}@local.projete`;
  const resource = await prisma.user.create({
    data: {
      name: data.name,
      email,
      roleId: role.id,
      jobTitle: data.jobTitle || null,
      weeklyCapacityHours: data.weeklyCapacityHours,
      dailyCapacityHours: data.dailyCapacityHours,
      hourlyRate: data.hourlyRate ?? null,
      status: "ACTIVE"
    }
  });

  await prisma.auditLog.create({
    data: {
      actorId: session?.user.id,
      entityType: "User",
      entityId: resource.id,
      action: "CREATE_RESOURCE",
      after: { id: resource.id, name: resource.name, hourlyRate: resource.hourlyRate }
    }
  });

  revalidatePath("/resources");
}

export async function deleteResourceAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!canManageProject(session?.user.role)) throw new Error("Sem permissao para excluir recursos.");

  const data = resourceDeleteSchema.parse(Object.fromEntries(formData));
  if (data.userId === session?.user.id) throw new Error("Nao e possivel excluir o proprio recurso logado.");

  const before = await prisma.user.findUniqueOrThrow({
    where: { id: data.userId },
    include: {
      allocations: { select: { projectId: true } },
      ownedTasks: { select: { projectId: true } }
    }
  });
  const projectIds = [...new Set([...before.allocations.map((allocation) => allocation.projectId), ...before.ownedTasks.map((task) => task.projectId)])];

  await prisma.$transaction(async (tx) => {
    await tx.resourceAllocation.deleteMany({ where: { userId: data.userId } });
    await tx.taskParticipant.deleteMany({ where: { userId: data.userId } });
    await tx.task.updateMany({ where: { ownerId: data.userId }, data: { ownerId: null } });
    await tx.user.update({ where: { id: data.userId }, data: { status: "INACTIVE" } });
    await tx.auditLog.create({
      data: {
        actorId: session?.user.id,
        entityType: "User",
        entityId: data.userId,
        action: "DELETE_RESOURCE",
        description: "Recurso inativado e removido das alocacoes/tarefas vinculadas.",
        before: { id: before.id, name: before.name, projectIds },
        after: { id: before.id, status: "INACTIVE" }
      }
    });
  });

  for (const projectId of projectIds) await recalculateProject(projectId);

  revalidatePath("/resources");
  revalidatePath("/projects");
  for (const projectId of projectIds) {
    revalidatePath(`/projects/${projectId}/resources`);
    revalidateProjectModule(projectId);
  }
}

export async function deleteProjectAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!canManageProject(session?.user.role)) throw new Error("Sem permissao para excluir projetos.");

  const projectId = String(formData.get("projectId"));
  const before = await prisma.project.findUniqueOrThrow({
    where: { id: projectId },
    include: {
      client: { select: { id: true, name: true } },
      manager: { select: { id: true, name: true } }
    }
  });

  await prisma.project.delete({ where: { id: projectId } });
  await prisma.auditLog.create({
    data: {
      actorId: session?.user.id,
      entityType: "Project",
      entityId: projectId,
      action: "DELETE",
      before
    }
  });

  revalidatePath("/projects");
  revalidatePath("/dashboard");
}

export async function importMppProjectAction(formData: FormData) {
  try {
    const session = await getServerSession(authOptions);
    if (!canManageProject(session?.user.role)) throw new Error("Sem permissao para importar projetos.");

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) throw new Error("Selecione um arquivo MPP, XML, MPX ou CSV valido.");

  const data = mppImportSchema.parse(Object.fromEntries(formData));
  const extension = file.name.split(".").pop()?.toLowerCase();
  const sourceLabel = extension === "csv" ? "CSV" : "MS Project";
  const legacySource = extension === "csv" ? "LEGACY_CSV" : "MS_PROJECT";
  let imported: ImportedMppProject;

  if (extension === "csv") {
    imported = parseCsvProject(decodeCsvFile(await file.arrayBuffer()), file.name);
  } else {
    const serviceUrl = process.env.MPP_SERVICE_URL;
    if (!serviceUrl) {
      throw new Error("Servico de importacao MPP nao esta disponivel. Use arquivos CSV ou configure MPP_SERVICE_URL.");
    }

    const importForm = new FormData();
    importForm.set("file", file);

    let response: Response;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60000);
      response = await fetch(`${serviceUrl}/import`, {
        method: "POST",
        body: importForm,
        signal: controller.signal
      });
      clearTimeout(timeout);
    } catch {
      throw new Error("Servico de importacao MPP esta dormindo (Render free tier). Aguarde 30s e tente novamente para acorda-lo.");
    }

    if (!response.ok) throw new Error("Falha ao importar arquivo pelo servico MPXJ.");
    imported = (await response.json()) as ImportedMppProject;
  }

  const importedTasks = normalizeImportedTasks(imported.tasks);
  if (!importedTasks.length) throw new Error("O arquivo nao possui tarefas validas para importacao.");

  const existingProjectId = data.existingProjectId?.trim() || "";
  const projectName = data.projectName?.trim() || imported.name || file.name.replace(/\.[^.]+$/i, "");
  const projectStart = minDate(importedTasks.map((task) => task.start));
  const projectEnd = maxDate(importedTasks.map((task) => task.finish));
  if (existingProjectId && formData.get("confirmImport") !== "1") {
    const changes = await importedScheduleChanges(existingProjectId, importedTasks, legacySource);
    if (!changes.length) return { redirect: `/projects/${existingProjectId}/gantt?importStatus=nochanges` };

    const previewKey = `import-preview-${randomBytes(12).toString("hex")}`;
    await prisma.systemSetting.create({
      data: {
        key: previewKey,
        value: {
          actorId: session?.user.id,
          fileName: file.name,
          sourceLabel,
          legacySource,
          projectName,
          clientId: data.clientId,
          managerId: data.managerId,
          existingProjectId,
          tasks: importedTasks,
          changes,
          createdAt: new Date().toISOString()
        }
      }
    });
    return { redirect: `/projects/${existingProjectId}/gantt?importPreview=${previewKey}` };
  }

  const project = await applyImportedSchedule({
    actorId: session?.user.id,
    existingProjectId,
    projectName,
    clientId: data.clientId,
    managerId: data.managerId,
    projectStart,
    projectEnd,
    importedTasks,
    sourceLabel,
    legacySource,
    fileName: file.name,
    action: existingProjectId ? (extension === "csv" ? "REIMPORT_CSV" : "REIMPORT_MPP") : (extension === "csv" ? "IMPORT_CSV" : "IMPORT_MPP")
  });

  await recalculateProject(project.id);
  revalidatePath("/projects");
  revalidateProjectModule(project.id);
    return { redirect: `/projects/${project.id}/tasks` };
  } catch (error) {
    console.error("[IMPORT_MPP_PROJECT]", error);
    return {
      error: error instanceof Error ? error.message : "Erro ao importar cronograma."
    };
  }
}

export async function confirmMppImportAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!canManageProject(session?.user.role)) throw new Error("Sem permissao para confirmar importacao.");

  const previewKey = String(formData.get("previewKey"));
  const preview = await prisma.systemSetting.findUniqueOrThrow({ where: { key: previewKey } });
  const value = preview.value as any;
  if (!value.existingProjectId || !Array.isArray(value.tasks)) throw new Error("Previa de importacao invalida.");

  const importedTasks = restoreImportedTasks(value.tasks);
  const projectStart = minDate(importedTasks.map((task) => task.start));
  const projectEnd = maxDate(importedTasks.map((task) => task.finish));
  const project = await applyImportedSchedule({
    actorId: session?.user.id,
    existingProjectId: value.existingProjectId,
    projectName: value.projectName,
    clientId: value.clientId,
    managerId: value.managerId,
    projectStart,
    projectEnd,
    importedTasks,
    sourceLabel: value.sourceLabel,
    legacySource: value.legacySource,
    fileName: value.fileName,
    action: value.legacySource === "LEGACY_CSV" ? "REIMPORT_CSV" : "REIMPORT_MPP"
  });
  await prisma.systemSetting.delete({ where: { key: previewKey } });
  await recalculateProject(project.id);
  revalidatePath("/projects");
  revalidateProjectModule(project.id);
  redirect(`/projects/${project.id}/tasks`);
}

async function applyImportedSchedule({
  actorId,
  existingProjectId,
  projectName,
  clientId,
  managerId,
  projectStart,
  projectEnd,
  importedTasks,
  sourceLabel,
  legacySource,
  fileName,
  action
}: {
  actorId?: string | null;
  existingProjectId: string;
  projectName: string;
  clientId: string;
  managerId: string;
  projectStart: Date;
  projectEnd: Date;
  importedTasks: NormalizedImportedTask[];
  sourceLabel: string;
  legacySource: string;
  fileName: string;
  action: string;
}) {
  const users = await prisma.user.findMany({ where: { status: "ACTIVE" } });
  const usersByName = new Map(users.map((user) => [normalizeName(user.name), user]));
  const employeeRole = await prisma.role.findUniqueOrThrow({ where: { name: "EMPLOYEE" } });

  return prisma.$transaction(async (tx) => {
    const createdProject = existingProjectId
      ? await tx.project.update({
          where: { id: existingProjectId },
          data: {
            name: projectName || undefined,
            plannedStart: projectStart,
            plannedEnd: projectEnd,
            currentEnd: projectEnd,
            clientId,
            managerId
          }
        })
      : await tx.project.create({
          data: {
            name: projectName,
            description: `Projeto importado de arquivo ${sourceLabel} em ${new Date().toLocaleString("pt-BR")}.`,
            clientId,
            managerId,
            status: "PLANNED",
            plannedStart: projectStart,
            plannedEnd: projectEnd,
            currentEnd: projectEnd,
            plannedHours: 0,
            actualHours: 0,
            remainingHours: 0,
            financialCost: 0
          }
        });

    const taskIdByExternalId = new Map<string, string>();
    const stackByLevel = new Map<number, string>();
    const countersByLevel = new Map<number, number>();

    for (const importedTask of importedTasks) {
      const assignmentUsers = [];
      for (const assignment of importedTask.assignments ?? []) {
        assignmentUsers.push(await findOrCreateImportedResourceUser(tx, usersByName, employeeRole.id, assignment.resourceName));
      }
      const owner = assignmentUsers[0] ?? null;
      const parentTaskId = nearestParentId(stackByLevel, importedTask.outlineLevel);
      const wbsCode = importedTask.wbsCode ?? nextWbsCode(countersByLevel, importedTask.outlineLevel);
      const estimatedHours = estimatedHoursForImportedTask(importedTask);
      const plannedDuration = plannedDurationDays(importedTask.start, importedTask.finish);
      const existingTask = await findExistingImportedTask(tx, createdProject.id, legacySource, importedTask);

      const taskData = {
          projectId: createdProject.id,
          parentTaskId,
          wbsCode,
          outlineLevel: importedTask.outlineLevel,
          legacySource,
          legacyOccurrenceId: importedTask.legacyOccurrenceId ?? importedTask.externalId ?? null,
          legacyItemCode: importedTask.legacyItemCode ?? wbsCode,
          name: importedTask.name,
          description: importedTask.externalId ? `Importado de ${sourceLabel} | ID externo: ${importedTask.externalId}` : `Importado de ${sourceLabel}`,
          ownerId: owner?.id ?? null,
          status: importedTask.status ?? taskStatusFromPercent(importedTask.percentComplete),
          priority: "MEDIUM" as const,
          plannedStart: importedTask.start,
          plannedEnd: importedTask.finish,
          actualEnd: importedTask.actualEnd ?? null,
          plannedDuration,
          progressPercent: importedTask.percentComplete,
          estimatedHours,
          actualHours: importedTask.actualHours ?? 0
      };

      const task = existingTask
        ? await tx.task.update({ where: { id: existingTask.id }, data: taskData })
        : await tx.task.create({ data: taskData });

      if (importedTask.externalId) taskIdByExternalId.set(importedTask.externalId, task.id);
      if (importedTask.legacyItemCode) taskIdByExternalId.set(importedTask.legacyItemCode, task.id);
      stackByLevel.set(importedTask.outlineLevel, task.id);
      [...stackByLevel.keys()].filter((level) => level > importedTask.outlineLevel).forEach((level) => stackByLevel.delete(level));

      if (existingTask) await tx.resourceAllocation.deleteMany({ where: { taskId: task.id } });
      for (const [index, assignment] of (importedTask.assignments ?? []).entries()) {
        const user = assignmentUsers[index];
        if (!user) continue;
        await tx.resourceAllocation.create({
          data: {
            projectId: createdProject.id,
            taskId: task.id,
            userId: user.id,
            startDate: importedTask.start,
            endDate: importedTask.finish,
            allocatedHours: assignment.workHours && assignment.workHours > 0 ? assignment.workHours : estimatedHours
          }
        });
      }
    }

    for (const importedTask of importedTasks) {
      if (!importedTask.externalId) continue;
      const successorId = taskIdByExternalId.get(importedTask.externalId);
      if (!successorId) continue;

      for (const predecessor of importedTask.predecessors ?? []) {
        const predecessorId = taskIdByExternalId.get(predecessor.externalId);
        if (!predecessorId || predecessorId === successorId) continue;
        await tx.taskDependency.createMany({
          data: [{
            predecessorId,
            successorId,
            type: dependencyType(predecessor.type),
            lagDays: predecessor.lagDays ?? 0
          }],
          skipDuplicates: true
        });
      }
    }

    await tx.auditLog.create({
      data: {
        actorId,
        projectId: createdProject.id,
        entityType: "Project",
        entityId: createdProject.id,
        action,
        description: `${existingProjectId ? "Atualizou" : "Importou"} cronograma por ${sourceLabel}.`,
        after: {
          fileName,
          source: sourceLabel,
          importedTasks: importedTasks.length,
          importedResources: importedTasks.reduce((sum, task) => sum + (task.assignments?.length ?? 0), 0)
        }
      }
    });

    return createdProject;
  }, { maxWait: 10000, timeout: 120000 });
}

async function importedScheduleChanges(projectId: string, importedTasks: NormalizedImportedTask[], legacySource: string) {
  const existingTasks = await prisma.task.findMany({ where: { projectId }, include: { owner: true } });
  const byLegacy = new Map(existingTasks.filter((task) => task.legacySource && task.legacyItemCode).map((task) => [`${task.legacySource}:${task.legacyItemCode}`, task]));
  const byWbs = new Map(existingTasks.filter((task) => task.wbsCode).map((task) => [task.wbsCode!, task]));
  const changes: Array<{ type: string; wbs: string | null; task: string; fields: Array<{ field: string; current: string; next: string }> }> = [];
  const countersByLevel = new Map<number, number>();

  for (const importedTask of importedTasks) {
    const wbsCode = importedTask.wbsCode ?? nextWbsCode(countersByLevel, importedTask.outlineLevel);
    const existing = byLegacy.get(`${legacySource}:${importedTask.legacyItemCode ?? wbsCode}`) ?? byWbs.get(wbsCode) ?? existingTasks.find((task) => normalizeName(task.name) === normalizeName(importedTask.name));
    if (!existing) {
      changes.push({ type: "CREATE", wbs: wbsCode, task: importedTask.name, fields: [] });
      continue;
    }

    const fields = importedTaskFieldChanges(existing, importedTask, wbsCode);
    if (fields.length) changes.push({ type: "UPDATE", wbs: wbsCode, task: importedTask.name, fields });
  }

  return changes;
}

function importedTaskFieldChanges(existing: any, importedTask: NormalizedImportedTask, wbsCode: string) {
  const estimatedHours = estimatedHoursForImportedTask(importedTask);
  const plannedDuration = plannedDurationDays(importedTask.start, importedTask.finish);
  const checks = [
    ["EDT", existing.wbsCode ?? "", wbsCode],
    ["Nome", existing.name ?? "", importedTask.name],
    ["Inicio", dateKey(existing.plannedStart), dateKey(importedTask.start)],
    ["Fim planejado", dateKey(existing.plannedEnd), dateKey(importedTask.finish)],
    ["Fim real", dateKey(existing.actualEnd), dateKey(importedTask.actualEnd)],
    ["Duracao", String(existing.plannedDuration ?? 0), String(plannedDuration)],
    ["Avanco", String(Number(existing.progressPercent)), String(importedTask.percentComplete)],
    ["Horas planejadas", String(Number(existing.estimatedHours)), String(estimatedHours)],
    ["Horas executadas", String(Number(existing.actualHours)), String(importedTask.actualHours ?? 0)],
    ["Status", existing.status ?? "", importedTask.status ?? taskStatusFromPercent(importedTask.percentComplete)]
  ];
  return checks.filter(([, current, next]) => current !== next).map(([field, current, next]) => ({ field, current, next }));
}

function dateKey(value: Date | string | null | undefined) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

function restoreImportedTasks(tasks: any[]): NormalizedImportedTask[] {
  return tasks.map((task) => ({
    ...task,
    start: new Date(task.start),
    finish: new Date(task.finish),
    actualEnd: task.actualEnd ? new Date(task.actualEnd) : null
  }));
}

async function findExistingImportedTask(tx: any, projectId: string, legacySource: string, importedTask: NormalizedImportedTask) {
  const legacyItemCode = importedTask.legacyItemCode ?? importedTask.wbsCode ?? importedTask.externalId ?? null;
  if (legacyItemCode) {
    const byLegacy = await tx.task.findFirst({ where: { projectId, legacySource, legacyItemCode } });
    if (byLegacy) return byLegacy;
  }
  if (importedTask.wbsCode) {
    const byWbs = await tx.task.findFirst({ where: { projectId, wbsCode: importedTask.wbsCode } });
    if (byWbs) return byWbs;
  }
  return tx.task.findFirst({ where: { projectId, name: importedTask.name } });
}

export async function createTaskAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!canManageTask(session?.user.role)) throw new Error("Sem permissao para criar tarefas.");

  const data = taskSchema.parse(Object.fromEntries(formData));
  const dependencies = taskDependencySchema.parse({
    predecessorIds: formData.getAll("predecessorIds").map(String).filter(Boolean)
  });
  const plannedDuration = Math.max(
    1,
    Math.ceil((data.plannedEnd.getTime() - data.plannedStart.getTime()) / 86400000) + 1
  );

  const task = await prisma.task.create({
    data: {
      projectId: data.projectId,
      name: data.name,
      description: data.description || null,
      ownerId: data.ownerId || null,
      status: data.status,
      priority: data.priority,
      plannedStart: data.plannedStart,
      plannedEnd: data.plannedEnd,
      plannedDuration,
      estimatedHours: data.estimatedHours,
      progressPercent: data.status === "DONE" ? 100 : 0
    }
  });

  await prisma.resourceAllocation.create({
    data: {
      userId: data.ownerId || session!.user.id,
      projectId: data.projectId,
      taskId: task.id,
      startDate: data.plannedStart,
      endDate: data.plannedEnd,
      allocatedHours: data.estimatedHours
    }
  });

  await syncTaskPredecessors(task.id, dependencies.predecessorIds);
  await autoAdjustTaskFromPredecessors(task.id, session?.user.id);
  await autoAdjustSuccessors(task.id, session?.user.id);
  await autoAdjustSequentialWbsTasks(task.id, session?.user.id);

  await recalculateProject(data.projectId);
  await prisma.auditLog.create({
    data: {
      actorId: session?.user.id,
      entityType: "Task",
      entityId: task.id,
      action: "CREATE",
      after: task
    }
  });

  revalidatePath(`/projects/${data.projectId}`);
  revalidatePath(`/projects/${data.projectId}/tasks`);
  revalidatePath("/tasks");
}

export async function updateTaskAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!canManageTask(session?.user.role)) throw new Error("Sem permissao para editar tarefas.");

  const data = taskUpdateSchema.parse(Object.fromEntries(formData));
  const dependencies = taskDependencySchema.parse({
    predecessorIds: formData.getAll("predecessorIds").map(String).filter(Boolean)
  });
  const before = await prisma.task.findUniqueOrThrow({
    where: { id: data.taskId },
    include: { predecessors: true }
  });
  const plannedDuration = Math.max(
    1,
    Math.ceil((data.plannedEnd.getTime() - data.plannedStart.getTime()) / 86400000) + 1
  );

  const task = await prisma.task.update({
    where: { id: data.taskId },
    data: {
      name: data.name,
      description: data.description || null,
      ownerId: data.ownerId || null,
      status: data.status,
      priority: data.priority,
      plannedStart: data.plannedStart,
      plannedEnd: data.plannedEnd,
      plannedDuration,
      estimatedHours: data.estimatedHours,
      actualHours: data.actualHours ?? before.actualHours,
      progressPercent: data.status === "DONE" ? 100 : (data.progressPercent ?? before.progressPercent)
    }
  });

  await prisma.resourceAllocation.updateMany({
    where: { taskId: task.id },
    data: {
      userId: task.ownerId || session!.user.id,
      startDate: task.plannedStart,
      endDate: task.plannedEnd,
      allocatedHours: task.estimatedHours
    }
  });

  await syncTaskPredecessors(task.id, dependencies.predecessorIds);
  await autoAdjustSuccessors(task.id, session?.user.id);
  await autoAdjustSequentialWbsTasks(task.id, session?.user.id);

  await recalculateProject(data.projectId);
  await prisma.auditLog.create({
    data: {
      actorId: session?.user.id,
      entityType: "Task",
      entityId: task.id,
      action: "UPDATE",
      before,
      after: task
    }
  });

  revalidateProjectModule(data.projectId);
}

export async function updateTaskStatusAction(taskId: string, status: "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "BLOCKED" | "DONE") {
  const session = await getServerSession(authOptions);
  if (!canManageTask(session?.user.role)) throw new Error("Sem permissao para mover tarefas.");

  const data = taskStatusSchema.parse({ taskId, status });
  const before = await prisma.task.findUniqueOrThrow({ where: { id: data.taskId } });
  const task = await prisma.task.update({
    where: { id: data.taskId },
    data: {
      status: data.status,
      progressPercent: data.status === "DONE" ? 100 : before.progressPercent,
      actualEnd: data.status === "DONE" ? new Date() : before.actualEnd
    }
  });

  await recalculateProject(task.projectId);
  await prisma.auditLog.create({
    data: {
      actorId: session?.user.id,
      entityType: "Task",
      entityId: task.id,
      action: "MOVE_STATUS",
      before,
      after: task
    }
  });

  revalidateProjectModule(task.projectId);
}

export async function deleteTaskAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!canManageTask(session?.user.role)) throw new Error("Sem permissao para excluir tarefas.");

  const taskId = String(formData.get("taskId"));
  const projectId = String(formData.get("projectId"));
  const before = await prisma.task.findUniqueOrThrow({ where: { id: taskId } });

  await prisma.task.delete({ where: { id: taskId } });
  await recalculateProject(projectId);
  await prisma.auditLog.create({
    data: {
      actorId: session?.user.id,
      entityType: "Task",
      entityId: taskId,
      action: "DELETE",
      before
    }
  });

  revalidateProjectModule(projectId);
}

export async function createBaselineAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!canManageTask(session?.user.role)) throw new Error("Sem permissao para criar baselines.");

  const projectId = String(formData.get("projectId"));
  const name = String(formData.get("name") || "Nova baseline");
  const description = String(formData.get("description") || "");
  const reason = String(formData.get("reason") || "");

  if (!reason.trim()) {
    throw new Error("A justificativa (motivo) e obrigatoria para criar uma baseline.");
  }

  const tasks = await prisma.task.findMany({ where: { projectId } });

  await prisma.$transaction(async (tx) => {
    await tx.baseline.updateMany({ where: { projectId }, data: { isActive: false } });
    const baseline = await tx.baseline.create({
      data: {
        projectId,
        name,
        description,
        reason: reason.trim(),
        isActive: true,
        createdById: session!.user.id,
        tasks: {
          create: tasks.map((task) => ({
            taskId: task.id,
            name: task.name,
            plannedStart: task.plannedStart,
            plannedEnd: task.plannedEnd,
            estimatedHours: task.estimatedHours,
            progressPercent: task.progressPercent
          }))
        }
      }
    });

    await tx.auditLog.create({
      data: {
        actorId: session?.user.id,
        entityType: "Baseline",
        entityId: baseline.id,
        action: "CREATE",
        after: baseline
      }
    });
  });

  revalidatePath(`/projects/${projectId}/baselines`);
  revalidatePath(`/projects/${projectId}/gantt`);
}

export async function updateBaselineAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!canManageTask(session?.user.role)) throw new Error("Sem permissao para editar baselines.");

  const data = baselineUpdateSchema.parse(Object.fromEntries(formData));

  await prisma.$transaction(async (tx) => {
    if (data.isActive) {
      await tx.baseline.updateMany({ where: { projectId: data.projectId }, data: { isActive: false } });
    }

    const baseline = await tx.baseline.update({
      where: { id: data.baselineId },
      data: {
        name: data.name,
        description: data.description || null,
        isActive: Boolean(data.isActive)
      }
    });

    await tx.auditLog.create({
      data: {
        actorId: session?.user.id,
        entityType: "Baseline",
        entityId: baseline.id,
        action: "UPDATE_METADATA",
        after: baseline
      }
    });
  });

  revalidatePath(`/projects/${data.projectId}/baselines`);
  revalidatePath(`/projects/${data.projectId}/gantt`);
}

export async function upsertBlockerAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!canManageTask(session?.user.role)) throw new Error("Sem permissao para editar bloqueios.");

  const data = blockerSchema.parse(Object.fromEntries(formData));
  const payload = {
    projectId: data.projectId,
    taskId: data.taskId || null,
    title: data.title,
    description: data.description || null,
    resolverId: data.resolverId || null,
    responsibleCompany: data.responsibleCompany || null,
    responsiblePerson: data.responsiblePerson || null,
    expectedResolutionAt: data.expectedResolutionAt,
    status: data.status,
    scheduleImpactDays: data.scheduleImpactDays,
    impactDescription: data.impactDescription || null,
    nextAction: data.nextAction || null,
    financialImpact: data.financialImpact
  };

  const blocker = data.blockerId
    ? await prisma.blocker.update({ where: { id: data.blockerId }, data: payload })
    : await prisma.blocker.create({ data: payload });

  await logProjectChange({
    actorId: session?.user.id,
    projectId: data.projectId,
    entityType: "Blocker",
    entityId: blocker.id,
    action: data.blockerId ? "UPDATE" : "CREATE",
    description: `${data.blockerId ? "Atualizou" : "Adicionou"} o bloqueio ${blocker.title}.`,
    after: blocker
  });

  revalidatePath(`/projects/${data.projectId}/blockers`);
  revalidatePath(`/projects/${data.projectId}`);
}

export async function deleteBlockerAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!canManageTask(session?.user.role)) throw new Error("Sem permissao para excluir bloqueios.");

  const blockerId = String(formData.get("blockerId"));
  const projectId = String(formData.get("projectId"));
  const before = await prisma.blocker.findUniqueOrThrow({ where: { id: blockerId } });
  await prisma.blocker.delete({ where: { id: blockerId } });
  await logProjectChange({
    actorId: session?.user.id,
    projectId,
    entityType: "Blocker",
    entityId: blockerId,
    action: "DELETE",
    description: `Removeu o bloqueio ${before.title}.`,
    before
  });

  revalidatePath(`/projects/${projectId}/blockers`);
  revalidatePath(`/projects/${projectId}`);
}

export async function deleteBaselineAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!canManageTask(session?.user.role)) throw new Error("Sem permissao para excluir baselines.");

  const baselineId = String(formData.get("baselineId"));
  const projectId = String(formData.get("projectId"));
  const before = await prisma.baseline.findUniqueOrThrow({ where: { id: baselineId } });

  await prisma.baseline.delete({ where: { id: baselineId } });
  await prisma.auditLog.create({
    data: {
      actorId: session?.user.id,
      entityType: "Baseline",
      entityId: baselineId,
      action: "DELETE",
      before
    }
  });

  revalidatePath(`/projects/${projectId}/baselines`);
  revalidatePath(`/projects/${projectId}/gantt`);
}

export async function upsertAllocationAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!canManageTask(session?.user.role)) throw new Error("Sem permissao para editar recursos.");

  const data = allocationSchema.parse(Object.fromEntries(formData));

  if (data.allocationId) {
    await prisma.resourceAllocation.update({
      where: { id: data.allocationId },
      data: {
        userId: data.userId,
        taskId: data.taskId,
        startDate: data.startDate,
        endDate: data.endDate,
        allocatedHours: data.allocatedHours
      }
    });
  } else {
    await prisma.resourceAllocation.create({
      data: {
        projectId: data.projectId,
        userId: data.userId,
        taskId: data.taskId,
        startDate: data.startDate,
        endDate: data.endDate,
        allocatedHours: data.allocatedHours
      }
    });
  }

  await prisma.auditLog.create({
    data: {
      actorId: session?.user.id,
      entityType: "ResourceAllocation",
      entityId: data.allocationId || data.projectId,
      action: data.allocationId ? "UPDATE" : "CREATE",
      after: data
    }
  });

  revalidatePath(`/projects/${data.projectId}/resources`);
}

export async function deleteAllocationAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!canManageTask(session?.user.role)) throw new Error("Sem permissao para excluir recursos.");

  const allocationId = String(formData.get("allocationId"));
  const projectId = String(formData.get("projectId"));
  const before = await prisma.resourceAllocation.findUniqueOrThrow({ where: { id: allocationId } });

  await prisma.resourceAllocation.delete({ where: { id: allocationId } });
  await prisma.auditLog.create({
    data: {
      actorId: session?.user.id,
      entityType: "ResourceAllocation",
      entityId: allocationId,
      action: "DELETE",
      before
    }
  });

  revalidatePath(`/projects/${projectId}/resources`);
}

type ImportedMppProject = {
  name?: string | null;
  tasks?: ImportedMppTask[];
};

type ImportedMppTask = {
  externalId?: string | null;
  legacyOccurrenceId?: string | null;
  legacyItemCode?: string | null;
  wbsCode?: string | null;
  name: string;
  start?: string | null;
  finish?: string | null;
  actualEnd?: string | null;
  percentComplete?: number;
  actualHours?: number;
  outlineLevel?: number;
  status?: "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "BLOCKED" | "DONE";
  assignments?: Array<{ resourceName: string; workHours?: number | null }>;
  predecessors?: Array<{ externalId: string; type?: string | null; lagDays?: number | null }>;
};

type NormalizedImportedTask = Omit<ImportedMppTask, "start" | "finish" | "actualEnd" | "percentComplete" | "outlineLevel"> & {
  start: Date;
  finish: Date;
  actualEnd?: Date | null;
  percentComplete: number;
  outlineLevel: number;
};

function normalizeImportedTasks(tasks: ImportedMppTask[] | undefined): NormalizedImportedTask[] {
  return (tasks ?? [])
    .filter((task) => task.name?.trim() && task.start && task.finish)
    .filter((task) => Number(task.outlineLevel ?? 1) > 0)
    .map((task) => {
      const start = parseImportedDate(task.start!);
      const finish = parseImportedDate(task.finish!);
      const actualEnd = task.actualEnd ? parseImportedDate(task.actualEnd) : null;
      return {
        ...task,
        name: task.name.trim(),
        start,
        finish: finish >= start ? finish : start,
        actualEnd,
        percentComplete: Math.min(100, Math.max(0, Number(task.percentComplete ?? 0))),
        outlineLevel: Number(task.outlineLevel ?? 1),
        actualHours: Number(task.actualHours ?? 0),
        assignments: task.assignments ?? [],
        predecessors: task.predecessors ?? []
      };
    });
}

function parseCsvProject(content: string, fileName: string): ImportedMppProject {
  const rows = parseCsvRows(stripBom(content));
  if (rows.length < 2) throw new Error("CSV sem linhas suficientes para importacao.");

  const headers = rows[0].map(normalizeCsvHeader);
  const tasks = rows.slice(1).flatMap((row, index) => {
    const record = Object.fromEntries(headers.map((header, columnIndex) => [header, row[columnIndex]?.trim() ?? ""]));
    const name = firstCsvValue(record, ["descricao", "descrição", "tarefa", "nome", "name", "task", "atividade", "taskname"]);
    if (!name) return [];

    const wbs = firstCsvValue(record, ["item", "edt", "wbs", "eap", "codigoedt", "codigowbs"]);
    const occurrence = firstCsvValue(record, ["ocorrencia", "ocorrência", "id", "externalid", "idexterno", "uid"]);
    const externalId = occurrence || wbs || String(index + 1);
    const start = parseCsvDate(firstCsvValue(record, ["datainicio", "data início", "inicio", "start", "plannedstart", "inicioplanejado"]));
    const finish = parseCsvDate(firstCsvValue(record, ["datafimplanejada", "data fim planejada", "fim", "finish", "termino", "datafim", "plannedend", "fimplanejado"]));
    const actualEnd = parseCsvDate(firstCsvValue(record, ["datafimreal", "data fim real", "actualend", "fimreal"]));
    const percentComplete = parseCsvNumber(firstCsvValue(record, ["avanco", "progresso", "percentual", "percentcomplete", "percentualconclusao"]));
    const hours = parseCsvNumber(firstCsvValue(record, ["horasplanejadas", "horas planejadas", "horas", "estimatedhours", "trabalho", "work"]));
    const actualHours = parseCsvNumber(firstCsvValue(record, ["horastrabalhadas", "horas trabalhadas", "actualhours", "horasrealizadas"]));
    const resources = firstCsvValue(record, ["responsavel", "responsaveis", "recurso", "recursos", "owner", "resource"]);
    const legacyStatus = firstCsvValue(record, ["situacaoocorrencia", "situação ocorrência", "situacao", "situação", "status"]);
    const predecessors = firstCsvValue(record, ["predecessoras", "predecessores", "predecessors", "pred"]);
    const outlineLevel = parseCsvNumber(firstCsvValue(record, ["nivel", "outlinelevel", "outline", "level"])) || outlineLevelFromWbs(wbs);

    return [{
      externalId,
      legacyOccurrenceId: occurrence || null,
      legacyItemCode: wbs || externalId,
      wbsCode: wbs || null,
      name,
      start,
      finish,
      actualEnd,
      percentComplete,
      actualHours,
      outlineLevel,
      status: legacyTaskStatus(legacyStatus, percentComplete),
      assignments: splitCsvList(resources).map((resourceName) => ({
        resourceName,
        workHours: hours > 0 ? hours : null
      })),
      predecessors: splitCsvList(predecessors).map((predecessor) => ({
        externalId: predecessor,
        type: "FS",
        lagDays: 0
      }))
    }];
  });

  return {
    name: fileName.replace(/\.[^.]+$/i, ""),
    tasks
  };
}

function decodeCsvFile(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) return new TextDecoder("utf-8").decode(bytes);
  return new TextDecoder("windows-1252").decode(bytes);
}

function parseCsvRows(content: string) {
  const firstLine = content.split(/\r?\n/, 1)[0] ?? "";
  const delimiter = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ";" : ",";
  const rows: string[][] = [];
  let row: string[] = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < content.length; index += 1) {
    const char = content[index];
    const next = content[index + 1];

    if (char === '"' && quoted && next === '"') {
      value += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      quoted = !quoted;
      continue;
    }

    if (!quoted && char === delimiter) {
      row.push(value);
      value = "";
      continue;
    }

    if (!quoted && (char === "\n" || char === "\r")) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(value);
      if (row.some((cell) => cell.trim())) rows.push(row);
      row = [];
      value = "";
      continue;
    }

    value += char;
  }

  row.push(value);
  if (row.some((cell) => cell.trim())) rows.push(row);
  return rows;
}

function stripBom(content: string) {
  return content.charCodeAt(0) === 0xfeff ? content.slice(1) : content;
}

function normalizeCsvHeader(value: string) {
  return normalizeName(value).replace(/[^a-z0-9]/g, "");
}

function firstCsvValue(record: Record<string, string>, keys: string[]) {
  for (const key of keys) {
    const value = record[normalizeCsvHeader(key)];
    if (value) return value;
  }
  return "";
}

function splitCsvList(value: string) {
  return value
    .split(/[|/]+|,(?=\s*[^\s])/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseCsvNumber(value: string) {
  if (!value) return 0;
  const normalized = value.replace("%", "").replace(/\./g, "").replace(",", ".");
  return Number(normalized) || 0;
}

function parseCsvDate(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const brazilianDate = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
  if (brazilianDate) {
    const [, day, month, year, hour = "00", minute = "00", second = "00"] = brazilianDate;
    const fullYear = year.length === 2 ? `20${year}` : year;
    return `${fullYear}-${month.padStart(2, "0")}-${day.padStart(2, "0")}T${hour.padStart(2, "0")}:${minute}:${second}`;
  }

  return trimmed;
}

function legacyTaskStatus(value: string, percentComplete: number): "TODO" | "IN_PROGRESS" | "DONE" {
  const normalized = normalizeName(value);
  if (normalized === "fechado") return "DONE";
  if (normalized === "executar") return "IN_PROGRESS";
  if (normalized === "pendente") return "TODO";
  return taskStatusFromPercent(percentComplete);
}

function outlineLevelFromWbs(wbs: string) {
  if (!wbs) return 1;
  return Math.max(1, wbs.split(".").filter(Boolean).length);
}

function parseImportedDate(value: string) {
  return new Date(value.length === 16 ? `${value}:00` : value);
}

function parseFormDate(value: unknown) {
  if (typeof value !== "string") return value;
  const dateOnly = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!dateOnly) return value;

  const [, year, month, day] = dateOnly;
  return new Date(Number(year), Number(month) - 1, Number(day), 12);
}

function minDate(values: Date[]) {
  return new Date(Math.min(...values.map((value) => value.getTime())));
}

function maxDate(values: Date[]) {
  return new Date(Math.max(...values.map((value) => value.getTime())));
}

function plannedDurationDays(start: Date, finish: Date) {
  return Math.max(1, Math.ceil((finish.getTime() - start.getTime()) / 86400000) + 1);
}

function estimatedHoursForImportedTask(task: NormalizedImportedTask) {
  const assignmentHours = (task.assignments ?? []).reduce((sum, assignment) => sum + Number(assignment.workHours ?? 0), 0);
  if (assignmentHours > 0) return assignmentHours;
  const hours = Math.max(1, Math.ceil((task.finish.getTime() - task.start.getTime()) / 3600000));
  return Math.min(hours, plannedDurationDays(task.start, task.finish) * 8);
}

function taskStatusFromPercent(percentComplete: number) {
  if (percentComplete >= 100) return "DONE";
  if (percentComplete > 0) return "IN_PROGRESS";
  return "TODO";
}

function normalizeName(value: string) {
  return value.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function nearestParentId(stackByLevel: Map<number, string>, outlineLevel: number) {
  for (let level = outlineLevel - 1; level >= 1; level -= 1) {
    const parentId = stackByLevel.get(level);
    if (parentId) return parentId;
  }
  return null;
}

function nextWbsCode(countersByLevel: Map<number, number>, outlineLevel: number) {
  const current = (countersByLevel.get(outlineLevel) ?? 0) + 1;
  countersByLevel.set(outlineLevel, current);
  [...countersByLevel.keys()].filter((level) => level > outlineLevel).forEach((level) => countersByLevel.delete(level));

  const parts = [];
  for (let level = 1; level <= outlineLevel; level += 1) {
    parts.push(countersByLevel.get(level) ?? 1);
  }
  return parts.join(".");
}

function dependencyType(type: string | null | undefined) {
  const normalized = String(type ?? "FS").toUpperCase();
  if (normalized.includes("START_START") || normalized === "SS") return "SS";
  if (normalized.includes("FINISH_FINISH") || normalized === "FF") return "FF";
  if (normalized.includes("START_FINISH") || normalized === "SF") return "SF";
  return "FS";
}

async function findOrCreateImportedResourceUser(
  tx: any,
  usersByName: Map<string, any>,
  employeeRoleId: string,
  resourceName: string
) {
  const normalizedName = normalizeName(resourceName);
  const existing = usersByName.get(normalizedName);
  if (existing) return existing;

  const email = `recurso-${slugify(resourceName)}@import.projete.local`;
  const user = await tx.user.upsert({
    where: { email },
    update: {},
    create: {
      name: resourceName,
      email,
      roleId: employeeRoleId,
      jobTitle: "Recurso importado do MS Project",
      weeklyCapacityHours: 40,
      dailyCapacityHours: 8
    }
  });

  usersByName.set(normalizedName, user);
  return user;
}

function slugify(value: string) {
  const slug = normalizeName(value).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return slug || "sem-nome";
}

async function recalculateProject(projectId: string) {
  const tasks = await prisma.task.findMany({ where: { projectId } });
  const allocations = await prisma.resourceAllocation.findMany({ where: { projectId }, include: { user: true } });
  const parentIds = new Set(tasks.map((task) => task.parentTaskId).filter(Boolean));
  const leafTasks = tasks.filter((task) => !parentIds.has(task.id));
  const rollupTasks = leafTasks.length ? leafTasks : tasks;
  const total = rollupTasks.length || 1;
  const done = rollupTasks.filter((task) => task.status === "DONE").length;
  const plannedHours = rollupTasks.reduce((sum, task) => sum + Number(task.estimatedHours), 0);
  const actualHours = rollupTasks.reduce((sum, task) => sum + Number(task.actualHours), 0);
  const financialCost = allocations.reduce((sum, allocation) => sum + Number(allocation.allocatedHours) * Number(allocation.user.hourlyRate ?? 0), 0);

  await prisma.project.update({
    where: { id: projectId },
    data: {
      progressPercent: Math.round((done / total) * 100),
      plannedHours,
      actualHours,
      remainingHours: Math.max(0, plannedHours - actualHours),
      financialCost,
      currentEnd: rollupTasks.length ? maxDate(rollupTasks.map((task) => task.plannedEnd)) : undefined,
      status: done === rollupTasks.length && rollupTasks.length > 0 ? "COMPLETED" : undefined
    }
  });
}

async function resourceProjectIds(userId: string) {
  const [allocations, ownedTasks] = await Promise.all([
    prisma.resourceAllocation.findMany({ where: { userId }, select: { projectId: true } }),
    prisma.task.findMany({ where: { ownerId: userId }, select: { projectId: true } })
  ]);
  return [...new Set([...allocations.map((allocation) => allocation.projectId), ...ownedTasks.map((task) => task.projectId)])];
}

async function syncTaskPredecessors(taskId: string, predecessorIds: string[]) {
  const task = await prisma.task.findUniqueOrThrow({ where: { id: taskId }, select: { projectId: true } });
  const uniqueIds = [...new Set(predecessorIds)].filter((id) => id !== taskId);
  const validPredecessors = await prisma.task.findMany({
    where: { id: { in: uniqueIds }, projectId: task.projectId },
    select: { id: true }
  });
  const validIds = new Set(validPredecessors.map((item) => item.id));

  await prisma.taskDependency.deleteMany({ where: { successorId: taskId } });

  if (!validIds.size) return;

  const safeIds: string[] = [];
  for (const predecessorId of validIds) {
    if (!(await wouldCreateDependencyCycle(taskId, predecessorId))) safeIds.push(predecessorId);
  }

  if (!safeIds.length) return;

  await prisma.taskDependency.createMany({
    data: safeIds.map((predecessorId) => ({
      predecessorId,
      successorId: taskId,
      type: "FS",
      lagDays: 0
    })),
    skipDuplicates: true
  });
}

async function wouldCreateDependencyCycle(successorId: string, predecessorId: string) {
  const queue = [predecessorId];
  const visited = new Set<string>();

  while (queue.length) {
    const currentId = queue.shift()!;
    if (currentId === successorId) return true;
    if (visited.has(currentId)) continue;
    visited.add(currentId);

    const upstream = await prisma.taskDependency.findMany({
      where: { successorId: currentId },
      select: { predecessorId: true }
    });
    queue.push(...upstream.map((dependency) => dependency.predecessorId));
  }

  return false;
}

async function autoAdjustSuccessors(taskId: string, actorId?: string) {
  const queue = [taskId];
  const visited = new Set<string>();

  while (queue.length) {
    const predecessorId = queue.shift()!;
    if (visited.has(predecessorId)) continue;
    visited.add(predecessorId);

    const dependencies = await prisma.taskDependency.findMany({
      where: { predecessorId },
      include: { predecessor: true, successor: true }
    });

    for (const dependency of dependencies) {
      const before = dependency.successor;
      const nextDates = scheduleDatesForDependency(dependency);
      if (!nextDates) continue;

      const plannedDuration = Math.max(
        1,
        Math.ceil((nextDates.plannedEnd.getTime() - nextDates.plannedStart.getTime()) / 86400000) + 1
      );

      const updated = await prisma.task.update({
        where: { id: before.id },
        data: {
          plannedStart: nextDates.plannedStart,
          plannedEnd: nextDates.plannedEnd,
          plannedDuration
        }
      });

      await prisma.resourceAllocation.updateMany({
        where: { taskId: updated.id },
        data: {
          startDate: updated.plannedStart,
          endDate: updated.plannedEnd
        }
      });

      await prisma.auditLog.create({
        data: {
          actorId,
          entityType: "Task",
          entityId: updated.id,
          action: "AUTO_SCHEDULE",
          before,
          after: updated
        }
      });

      queue.push(updated.id);
    }
  }
}

async function autoAdjustTaskFromPredecessors(taskId: string, actorId?: string) {
  const dependencies = await prisma.taskDependency.findMany({
    where: { successorId: taskId },
    include: { predecessor: true, successor: true }
  });
  if (!dependencies.length) return;

  const before = dependencies[0].successor;
  const candidates = dependencies
    .map((dependency) => scheduleDatesForDependency(dependency))
    .filter((dates): dates is { plannedStart: Date; plannedEnd: Date } => Boolean(dates));
  if (!candidates.length) return;

  const nextDates = candidates.reduce((latest, current) =>
    current.plannedStart > latest.plannedStart ? current : latest
  );
  const plannedDuration = Math.max(
    1,
    Math.ceil((nextDates.plannedEnd.getTime() - nextDates.plannedStart.getTime()) / 86400000) + 1
  );

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: {
      plannedStart: nextDates.plannedStart,
      plannedEnd: nextDates.plannedEnd,
      plannedDuration
    }
  });

  await prisma.resourceAllocation.updateMany({
    where: { taskId },
    data: {
      startDate: updated.plannedStart,
      endDate: updated.plannedEnd
    }
  });

  await prisma.auditLog.create({
    data: {
      actorId,
      entityType: "Task",
      entityId: taskId,
      action: "AUTO_SCHEDULE_FROM_PREDECESSORS",
      before,
      after: updated
    }
  });
}

async function autoAdjustSequentialWbsTasks(taskId: string, actorId?: string) {
  const changedTask = await prisma.task.findUnique({
    where: { id: taskId },
    select: {
      id: true,
      projectId: true,
      wbsCode: true,
      plannedEnd: true
    }
  });
  if (!changedTask?.wbsCode) return;

  const tasks = await prisma.task.findMany({
    where: { projectId: changedTask.projectId },
    select: {
      id: true,
      parentTaskId: true,
      wbsCode: true,
      plannedStart: true,
      plannedEnd: true
    }
  });
  const parentIds = new Set(tasks.map((task) => task.parentTaskId).filter(Boolean));
  const orderedLeafTasks = tasks
    .filter((task) => task.wbsCode && !parentIds.has(task.id))
    .sort((left, right) => compareWbsCodes(left.wbsCode, right.wbsCode));

  const changedIndex = orderedLeafTasks.findIndex((task) => task.id === changedTask.id);
  if (changedIndex === -1) return;

  let cursorEnd = changedTask.plannedEnd;
  for (const task of orderedLeafTasks.slice(changedIndex + 1)) {
    const before = await prisma.task.findUniqueOrThrow({ where: { id: task.id } });
    const durationDays = Math.max(
      0,
      Math.ceil((before.plannedEnd.getTime() - before.plannedStart.getTime()) / 86400000)
    );
    const plannedStart = addDays(cursorEnd, 1);
    const plannedEnd = addDays(plannedStart, durationDays);

    if (sameDay(before.plannedStart, plannedStart) && sameDay(before.plannedEnd, plannedEnd)) {
      cursorEnd = before.plannedEnd;
      continue;
    }

    const updated = await prisma.task.update({
      where: { id: before.id },
      data: {
        plannedStart,
        plannedEnd,
        plannedDuration: plannedDurationDays(plannedStart, plannedEnd)
      }
    });

    await prisma.resourceAllocation.updateMany({
      where: { taskId: updated.id },
      data: {
        startDate: updated.plannedStart,
        endDate: updated.plannedEnd
      }
    });

    await prisma.auditLog.create({
      data: {
        actorId,
        entityType: "Task",
        entityId: updated.id,
        action: "AUTO_SCHEDULE_WBS",
        before,
        after: updated
      }
    });

    cursorEnd = updated.plannedEnd;
  }

  await rollupSummaryTaskDates(changedTask.projectId, actorId);
}

async function rollupSummaryTaskDates(projectId: string, actorId?: string) {
  const tasks = await prisma.task.findMany({
    where: { projectId },
    select: {
      id: true,
      parentTaskId: true,
      outlineLevel: true,
      plannedStart: true,
      plannedEnd: true
    }
  });
  const childrenByParent = new Map<string, typeof tasks>();
  for (const task of tasks) {
    if (!task.parentTaskId) continue;
    const siblings = childrenByParent.get(task.parentTaskId) ?? [];
    siblings.push(task);
    childrenByParent.set(task.parentTaskId, siblings);
  }

  const parentTasks = tasks
    .filter((task) => childrenByParent.has(task.id))
    .sort((left, right) => right.outlineLevel - left.outlineLevel);

  for (const parent of parentTasks) {
    const children = childrenByParent.get(parent.id) ?? [];
    if (!children.length) continue;

    const plannedStart = minDate(children.map((child) => child.plannedStart));
    const plannedEnd = maxDate(children.map((child) => child.plannedEnd));
    if (sameDay(parent.plannedStart, plannedStart) && sameDay(parent.plannedEnd, plannedEnd)) continue;

    const before = await prisma.task.findUniqueOrThrow({ where: { id: parent.id } });
    const updated = await prisma.task.update({
      where: { id: parent.id },
      data: {
        plannedStart,
        plannedEnd,
        plannedDuration: plannedDurationDays(plannedStart, plannedEnd)
      }
    });

    await prisma.resourceAllocation.updateMany({
      where: { taskId: updated.id },
      data: {
        startDate: updated.plannedStart,
        endDate: updated.plannedEnd
      }
    });

    await prisma.auditLog.create({
      data: {
        actorId,
        entityType: "Task",
        entityId: updated.id,
        action: "AUTO_ROLLUP_SUMMARY",
        before,
        after: updated
      }
    });

    const parentIndex = tasks.findIndex((task) => task.id === updated.id);
    if (parentIndex >= 0) {
      Object.assign(tasks[parentIndex], {
        plannedStart: updated.plannedStart,
        plannedEnd: updated.plannedEnd
      });
    }
  }
}

function scheduleDatesForDependency(dependency: {
  type: "FS" | "SS" | "FF" | "SF";
  lagDays: number;
  predecessor: { plannedStart: Date; plannedEnd: Date };
  successor: { plannedStart: Date; plannedEnd: Date };
}) {
  const lag = dependency.lagDays || 0;
  const successorDurationDays = Math.max(
    0,
    Math.ceil((dependency.successor.plannedEnd.getTime() - dependency.successor.plannedStart.getTime()) / 86400000)
  );
  const currentStart = dependency.successor.plannedStart;
  const currentEnd = dependency.successor.plannedEnd;

  if (dependency.type === "FS") {
    const minimumStart = addDays(dependency.predecessor.plannedEnd, lag + 1);
    if (currentStart >= minimumStart) return null;
    return { plannedStart: minimumStart, plannedEnd: addDays(minimumStart, successorDurationDays) };
  }

  if (dependency.type === "SS") {
    const minimumStart = addDays(dependency.predecessor.plannedStart, lag);
    if (currentStart >= minimumStart) return null;
    return { plannedStart: minimumStart, plannedEnd: addDays(minimumStart, successorDurationDays) };
  }

  if (dependency.type === "FF") {
    const minimumEnd = addDays(dependency.predecessor.plannedEnd, lag);
    if (currentEnd >= minimumEnd) return null;
    return { plannedStart: addDays(minimumEnd, -successorDurationDays), plannedEnd: minimumEnd };
  }

  const minimumEnd = addDays(dependency.predecessor.plannedStart, lag);
  if (currentEnd >= minimumEnd) return null;
  return { plannedStart: addDays(minimumEnd, -successorDurationDays), plannedEnd: minimumEnd };
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function compareWbsCodes(left: string | null | undefined, right: string | null | undefined) {
  const leftParts = String(left ?? "").split(".").map((part) => Number(part) || 0);
  const rightParts = String(right ?? "").split(".").map((part) => Number(part) || 0);
  const maxLength = Math.max(leftParts.length, rightParts.length);

  for (let index = 0; index < maxLength; index += 1) {
    const difference = (leftParts[index] ?? 0) - (rightParts[index] ?? 0);
    if (difference !== 0) return difference;
  }

  return String(left ?? "").localeCompare(String(right ?? ""));
}

function sameDay(left: Date, right: Date) {
  return left.getTime() === right.getTime();
}

function revalidateProjectModule(projectId: string) {
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/tasks`);
  revalidatePath(`/projects/${projectId}/kanban`);
  revalidatePath(`/projects/${projectId}/gantt`);
  revalidatePath(`/projects/${projectId}/resources`);
  revalidatePath(`/projects/${projectId}/reports`);
  revalidatePath("/projects");
  revalidatePath("/dashboard");
  revalidatePath("/tasks");
}
