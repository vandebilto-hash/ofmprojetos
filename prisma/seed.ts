import { PrismaClient, DocumentSourceType, DocumentVisibility, Priority, ProjectStatus, RoleName, TaskStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const portalModules = [
  ["home", "Home", "Missao, cliente, parceiros, proposta e escopo."],
  ["governance", "Governanca", "Stakeholders, mapa de influencia/interesse e dashboard analitico."],
  ["plans", "Planos", "Documentos e links do Google Drive."],
  ["downloads", "Downloads", "Central de documentos importantes para visualizacao e download."],
  ["emails", "E-mails importantes", "Registro de comunicacoes formais relevantes do projeto."],
  ["minutes", "Central de atas", "Atas, reunioes, decisoes e encaminhamentos publicados."],
  ["milestones", "Marcos do projeto", "Timeline dos principais eventos e entregas."],
  ["planning", "Planejamento", "Cronograma, EDT, horas planejadas e executadas."],
  ["todos", "To-do", "Lista operacional com semaforo e proximas acoes."],
  ["risks", "Riscos e pendencias", "Matriz de riscos e bloqueios do projeto."],
  ["dashboard", "Dashboard", "Indicadores executivos consolidados."]
] as const;

async function main() {
  const roles = await Promise.all(
    [
      [RoleName.ADMIN, "Administrador do sistema"],
      [RoleName.PROJECT_MANAGER, "Gestor de projetos"],
      [RoleName.EMPLOYEE, "Funcionario"],
      [RoleName.CLIENT, "Cliente"]
    ].map(([name, description]) =>
      prisma.role.upsert({
        where: { name },
        update: {},
        create: { name, description }
      })
    )
  );

  const roleByName = Object.fromEntries(roles.map((role) => [role.name, role]));

  const passwordHash = await bcrypt.hash("Projete@123", 12);

  const client = await prisma.client.upsert({
    where: { id: "seed-client-acme" },
    update: {},
    create: {
      id: "seed-client-acme",
      name: "ACME Tecnologia",
      identifier: "00.000.000/0001-00",
      mainContact: "Carla Mendes",
      email: "carla@acme.test",
      phone: "(11) 4002-8922",
      notes: "Cliente demonstrativo para validacao do fluxo completo."
    }
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@projete.local" },
    update: {},
    create: {
      name: "Admin Projete-se",
      email: "admin@projete.local",
      passwordHash,
      roleId: roleByName.ADMIN.id,
      jobTitle: "Administrador"
    }
  });

  const manager = await prisma.user.upsert({
    where: { email: "gestor@projete.local" },
    update: {},
    create: {
      name: "Marina Gestora",
      email: "gestor@projete.local",
      passwordHash,
      roleId: roleByName.PROJECT_MANAGER.id,
      jobTitle: "Gestora de Projetos",
      hourlyRate: 160
    }
  });

  const employee = await prisma.user.upsert({
    where: { email: "funcionario@projete.local" },
    update: {},
    create: {
      name: "Rafael Analista",
      email: "funcionario@projete.local",
      passwordHash,
      roleId: roleByName.EMPLOYEE.id,
      jobTitle: "Analista",
      weeklyCapacityHours: 40,
      dailyCapacityHours: 8,
      hourlyRate: 95
    }
  });

  await prisma.user.upsert({
    where: { email: "cliente@projete.local" },
    update: {},
    create: {
      name: "Carla Cliente",
      email: "cliente@projete.local",
      passwordHash,
      roleId: roleByName.CLIENT.id,
      clientId: client.id,
      jobTitle: "Patrocinadora"
    }
  });

  const project = await prisma.project.upsert({
    where: { id: "seed-project-implantacao" },
    update: {},
    create: {
      id: "seed-project-implantacao",
      name: "Implantacao ERP ACME",
      description: "Projeto demonstrativo com cronograma, baseline e alocacao.",
      clientId: client.id,
      managerId: manager.id,
      status: ProjectStatus.IN_PROGRESS,
      plannedStart: new Date("2026-05-01T09:00:00.000Z"),
      plannedEnd: new Date("2026-08-30T18:00:00.000Z"),
      currentEnd: new Date("2026-09-12T18:00:00.000Z"),
      progressPercent: 42,
      plannedHours: 620,
      actualHours: 251,
      remainingHours: 369,
      financialCost: 28120,
      notes: "Atencao para dependencias de dados legados."
    }
  });

  const kickoff = await prisma.task.upsert({
    where: { id: "seed-task-kickoff" },
    update: {},
    create: {
      id: "seed-task-kickoff",
      projectId: project.id,
      name: "Kickoff e plano executivo",
      ownerId: manager.id,
      status: TaskStatus.DONE,
      priority: Priority.HIGH,
      plannedStart: new Date("2026-05-01T09:00:00.000Z"),
      plannedEnd: new Date("2026-05-05T18:00:00.000Z"),
      actualStart: new Date("2026-05-01T09:00:00.000Z"),
      actualEnd: new Date("2026-05-05T18:00:00.000Z"),
      plannedDuration: 5,
      actualDuration: 5,
      progressPercent: 100,
      estimatedHours: 32,
      actualHours: 30
    }
  });

  const mapping = await prisma.task.upsert({
    where: { id: "seed-task-mapping" },
    update: {},
    create: {
      id: "seed-task-mapping",
      projectId: project.id,
      name: "Mapeamento de processos",
      ownerId: employee.id,
      status: TaskStatus.IN_PROGRESS,
      priority: Priority.CRITICAL,
      plannedStart: new Date("2026-05-06T09:00:00.000Z"),
      plannedEnd: new Date("2026-05-22T18:00:00.000Z"),
      plannedDuration: 13,
      progressPercent: 60,
      estimatedHours: 96,
      actualHours: 72
    }
  });

  await prisma.taskDependency.upsert({
    where: {
      predecessorId_successorId_type: {
        predecessorId: kickoff.id,
        successorId: mapping.id,
        type: "FS"
      }
    },
    update: {},
    create: {
      predecessorId: kickoff.id,
      successorId: mapping.id,
      type: "FS"
    }
  });

  await prisma.projectShareLink.upsert({
    where: { token: "demo-implantacao-erp-acme" },
    update: { active: true, allowDownloads: true },
    create: {
      projectId: project.id,
      token: "demo-implantacao-erp-acme",
      active: true,
      allowDownloads: true
    }
  });

  await Promise.all(
    portalModules.map(([key, label, description], index) =>
      prisma.projectModuleSetting.upsert({
        where: { projectId_key: { projectId: project.id, key } },
        update: {
          label,
          description,
          enabled: true,
          visibleToClient: true,
          sortOrder: index
        },
        create: {
          projectId: project.id,
          key,
          label,
          description,
          enabled: true,
          visibleToClient: true,
          sortOrder: index
        }
      })
    )
  );

  await prisma.projectHome.upsert({
    where: { projectId: project.id },
    update: {},
    create: {
      projectId: project.id,
      mission: "Implantar o ERP ACME com controle executivo de escopo, cronograma, riscos e bloqueios.",
      clientOverview: "ACME Tecnologia e uma empresa demonstrativa usada para validar o portal multi-projetos.",
      proposal: "Centralizar informacoes do projeto, permitir acompanhamento pelo cliente e consolidar indicadores executivos.",
      scope: "Inclui planejamento, governanca, planos, marcos, tarefas, riscos, bloqueios e dashboard executivo."
    }
  });

  await prisma.partner.deleteMany({ where: { projectId: project.id } });
  await prisma.partner.createMany({
    data: [
      { projectId: project.id, name: "Equipe PMO", description: "Governanca, acompanhamento e reporte executivo." },
      { projectId: project.id, name: "Integrador ERP", description: "Configuracao tecnica e apoio de implantacao." }
    ]
  });

  await prisma.stakeholder.deleteMany({ where: { projectId: project.id } });
  await prisma.stakeholder.createMany({
    data: [
      { projectId: project.id, name: "Carla Mendes", company: "ACME Tecnologia", jobTitle: "Sponsor", type: "SPONSOR", projectRole: "Patrocinadora", influence: "HIGH", interest: "HIGH", classification: "Gerenciar de perto", email: "carla@acme.test" },
      { projectId: project.id, name: "Marina Gestora", company: "Projete-se", jobTitle: "Gerente de Projeto", type: "INTERNAL", projectRole: "Gestao", influence: "HIGH", interest: "HIGH", classification: "Gerenciar de perto" },
      { projectId: project.id, name: "Operacoes ACME", company: "ACME Tecnologia", jobTitle: "Usuarios-chave", type: "CLIENT", projectRole: "Validacao", influence: "MEDIUM", interest: "HIGH", classification: "Manter informado" }
    ]
  });

  await prisma.milestone.deleteMany({ where: { projectId: project.id } });
  await prisma.milestone.createMany({
    data: [
      { projectId: project.id, name: "Kickoff concluido", description: "Alinhamento inicial e governanca aprovados.", type: "Reuniao", plannedDate: new Date("2026-05-01T09:00:00.000Z"), actualDate: new Date("2026-05-01T09:00:00.000Z"), status: "COMPLETED", owner: "Marina Gestora" },
      { projectId: project.id, name: "Mapeamento aprovado", description: "Validacao dos processos principais.", type: "Aprovacao", plannedDate: new Date("2026-05-22T18:00:00.000Z"), status: "IN_PROGRESS", owner: "Rafael Analista" },
      { projectId: project.id, name: "Go-live", description: "Entrada assistida da primeira onda.", type: "Implantacao", plannedDate: new Date("2026-08-30T18:00:00.000Z"), status: "PLANNED", owner: "Marina Gestora" }
    ]
  });

  await prisma.document.deleteMany({ where: { projectId: project.id } });
  await prisma.document.createMany({
    data: [
      {
        projectId: project.id,
        uploadedById: admin.id,
        name: "Plano executivo do projeto",
        type: "Plano do projeto",
        sourceType: DocumentSourceType.GOOGLE_DRIVE,
        externalUrl: "https://drive.google.com/",
        embedUrl: "https://drive.google.com/",
        downloadUrl: "https://drive.google.com/",
        visibility: DocumentVisibility.CLIENT_VISIBLE,
        version: "v1.0",
        status: "Aprovado",
        clientDownloadAllowed: true
      },
      {
        projectId: project.id,
        uploadedById: admin.id,
        name: "Plano de comunicacao",
        type: "Plano de Comunicacao",
        sourceType: DocumentSourceType.GOOGLE_DRIVE,
        externalUrl: "https://drive.google.com/",
        downloadUrl: "https://drive.google.com/",
        visibility: DocumentVisibility.CLIENT_VISIBLE,
        version: "v1.0",
        status: "Em revisao",
        clientDownloadAllowed: true
      }
    ]
  });

  await prisma.risk.deleteMany({ where: { projectId: project.id } });
  const migrationRisk = await prisma.risk.create({
    data: {
      projectId: project.id,
      name: "Atraso na migracao de dados",
      description: "Dados legados podem nao estar saneados no prazo previsto.",
      classification: "HIGH",
      cause: "Dependencia de extracoes do sistema legado.",
      event: "Carga de dados atrasada ou incompleta.",
      impact: "Atraso no ciclo de homologacao.",
      probability: "MEDIUM",
      responseStrategy: "MITIGATE",
      preventiveActions: "Executar validacoes semanais com operacoes.",
      contingencyPlan: "Priorizar carga minima para go-live.",
      triggers: "Extracao pendente por mais de 5 dias.",
      owner: "Marina Gestora",
      status: "IN_TREATMENT",
      lastReviewAt: new Date("2026-06-10T09:00:00.000Z")
    }
  });

  await prisma.portalTodo.deleteMany({ where: { projectId: project.id } });
  await prisma.portalTodo.createMany({
    data: [
      { projectId: project.id, taskId: mapping.id, code: "TD-001", trafficLight: "YELLOW", origin: "Cronograma", description: "Validar processos mapeados com usuarios-chave", responsible: "Rafael Analista", priority: Priority.HIGH, status: "IN_PROGRESS", dueDate: new Date("2026-06-20T18:00:00.000Z"), plannedProgress: 70, actualProgress: 60, estimatedHours: 16, workedHours: 10, nextAction: "Realizar reuniao de validacao" },
      { projectId: project.id, riskId: migrationRisk.id, code: "TD-002", trafficLight: "RED", origin: "Risco", description: "Confirmar extracao de dados legados", responsible: "Operacoes ACME", priority: Priority.CRITICAL, status: "OPEN", dueDate: new Date("2026-06-18T18:00:00.000Z"), plannedProgress: 50, actualProgress: 10, estimatedHours: 8, workedHours: 1, nextAction: "Escalar dependencia para sponsor" }
    ]
  });

  await prisma.blocker.deleteMany({ where: { projectId: project.id } });
  await prisma.blocker.create({
    data: {
      projectId: project.id,
      taskId: mapping.id,
      title: "Acesso ao ambiente de homologacao",
      description: "Credenciais pendentes para o time de implantacao.",
      responsibleCompany: "ACME Tecnologia",
      responsiblePerson: "Bruno TI",
      expectedResolutionAt: new Date("2026-06-19T18:00:00.000Z"),
      status: "OPEN",
      scheduleImpactDays: 3,
      impactDescription: "Pode atrasar configuracao e testes integrados em homologacao.",
      nextAction: "Solicitar liberacao emergencial ao gestor de infraestrutura."
    }
  });

  await prisma.resourceAllocation.deleteMany({ where: { projectId: project.id } });
  await prisma.baseline.deleteMany({ where: { projectId: project.id } });

  await prisma.resourceAllocation.createMany({
    data: [
      {
        userId: employee.id,
        projectId: project.id,
        taskId: mapping.id,
        startDate: new Date("2026-05-18T09:00:00.000Z"),
        endDate: new Date("2026-05-22T18:00:00.000Z"),
        allocatedHours: 46
      },
      {
        userId: manager.id,
        projectId: project.id,
        taskId: kickoff.id,
        startDate: new Date("2026-05-01T09:00:00.000Z"),
        endDate: new Date("2026-05-05T18:00:00.000Z"),
        allocatedHours: 22
      }
    ]
  });

  await prisma.baseline.create({
    data: {
      projectId: project.id,
      name: "Baseline inicial",
      description: "Snapshot inicial criado pelo seed.",
      isActive: true,
      createdById: admin.id,
      tasks: {
        create: [
          {
            taskId: kickoff.id,
            name: kickoff.name,
            plannedStart: kickoff.plannedStart,
            plannedEnd: kickoff.plannedEnd,
            estimatedHours: kickoff.estimatedHours,
            progressPercent: kickoff.progressPercent
          },
          {
            taskId: mapping.id,
            name: mapping.name,
            plannedStart: mapping.plannedStart,
            plannedEnd: mapping.plannedEnd,
            estimatedHours: mapping.estimatedHours,
            progressPercent: mapping.progressPercent
          }
        ]
      }
    }
  });

  const phoenixClient = await prisma.client.upsert({
    where: { id: "seed-client-phoenix" },
    update: {},
    create: {
      id: "seed-client-phoenix",
      name: "Grupo Phoenix Energia",
      identifier: "11.111.111/0001-11",
      mainContact: "Helena Prado",
      email: "helena@phoenix.test",
      phone: "(21) 3000-4500",
      notes: "Cliente ficticio completo para testes do portal multipaginas."
    }
  });

  const phoenix = await prisma.project.upsert({
    where: { id: "seed-project-phoenix" },
    update: {},
    create: {
      id: "seed-project-phoenix",
      name: "Programa Phoenix 360",
      description: "Implantacao de portal executivo, integracao de dados e governanca operacional.",
      clientId: phoenixClient.id,
      managerId: manager.id,
      status: ProjectStatus.IN_PROGRESS,
      plannedStart: new Date("2026-04-01T09:00:00.000Z"),
      plannedEnd: new Date("2026-10-30T18:00:00.000Z"),
      currentEnd: new Date("2026-11-12T18:00:00.000Z"),
      progressPercent: 58,
      plannedHours: 1280,
      actualHours: 742,
      remainingHours: 538,
      financialCost: 118900,
      notes: "Projeto ficticio completo para demonstracao executiva."
    }
  });

  await prisma.projectShareLink.upsert({
    where: { token: "demo-phoenix-360" },
    update: { active: true, allowDownloads: true },
    create: { projectId: phoenix.id, token: "demo-phoenix-360", active: true, allowDownloads: true }
  });

  await Promise.all(portalModules.map(([key, label, description], index) => prisma.projectModuleSetting.upsert({
    where: { projectId_key: { projectId: phoenix.id, key } },
    update: { label, description, enabled: true, visibleToClient: true, sortOrder: index },
    create: { projectId: phoenix.id, key, label, description, enabled: true, visibleToClient: true, sortOrder: index }
  })));

  await prisma.projectHome.upsert({
    where: { projectId: phoenix.id },
    update: {},
    create: {
      projectId: phoenix.id,
      mission: "Criar uma sala de controle digital para consolidar indicadores operacionais, reduzir riscos de implantacao e dar visibilidade executiva ao cliente.",
      clientOverview: "O Grupo Phoenix Energia atua em distribuicao e operacao de ativos energeticos em multiplas regioes, com forte dependencia de dados operacionais confiaveis.",
      proposal: "Entregar um portal executivo multiprojetos com dados de cronograma, riscos, bloqueios, documentos, marcos e governanca em tempo quase real.",
      scope: "Inclui desenho de governanca, integracao de cronograma, organizacao documental, dashboards executivos, matriz de riscos, acompanhamento de bloqueios e publicacao do portal do cliente."
    }
  });

  await prisma.partner.deleteMany({ where: { projectId: phoenix.id } });
  await prisma.partner.createMany({ data: [
    { projectId: phoenix.id, name: "Nexus Data", description: "Parceiro responsavel pela integracao de dados e qualidade das cargas." },
    { projectId: phoenix.id, name: "PMO Phoenix", description: "Governanca interna, aprovacao de marcos e priorizacao executiva." },
    { projectId: phoenix.id, name: "CloudOps Brasil", description: "Infraestrutura, seguranca e observabilidade." }
  ] });

  await prisma.stakeholder.deleteMany({ where: { projectId: phoenix.id } });
  await prisma.stakeholder.createMany({ data: [
    { projectId: phoenix.id, name: "Helena Prado", company: "Grupo Phoenix", jobTitle: "Diretora de Operacoes", type: "SPONSOR", projectRole: "Sponsor executivo", influence: "HIGH", interest: "HIGH", classification: "Gerenciar de perto", email: "helena@phoenix.test" },
    { projectId: phoenix.id, name: "Bruno Costa", company: "Grupo Phoenix", jobTitle: "Gerente de TI", type: "CLIENT", projectRole: "Aprovador tecnico", influence: "HIGH", interest: "MEDIUM", classification: "Manter satisfeito" },
    { projectId: phoenix.id, name: "Larissa Nogueira", company: "Nexus Data", jobTitle: "Lider de Dados", type: "PARTNER", projectRole: "Responsavel por integracoes", influence: "MEDIUM", interest: "HIGH", classification: "Manter informado" },
    { projectId: phoenix.id, name: "Comite Regional", company: "Grupo Phoenix", jobTitle: "Usuarios-chave", type: "CLIENT", projectRole: "Validacao operacional", influence: "LOW", interest: "HIGH", classification: "Manter informado" }
  ] });

  await prisma.task.deleteMany({ where: { projectId: phoenix.id } });
  const phoenixTasks = await Promise.all([
    prisma.task.create({ data: { projectId: phoenix.id, wbsCode: "1.1", name: "Kickoff executivo e plano de governanca", ownerId: manager.id, status: TaskStatus.DONE, priority: Priority.HIGH, plannedStart: new Date("2026-04-01T09:00:00.000Z"), plannedEnd: new Date("2026-04-08T18:00:00.000Z"), actualStart: new Date("2026-04-01T09:00:00.000Z"), actualEnd: new Date("2026-04-07T18:00:00.000Z"), plannedDuration: 6, actualDuration: 5, progressPercent: 100, estimatedHours: 80, actualHours: 72 } }),
    prisma.task.create({ data: { projectId: phoenix.id, wbsCode: "2.1", name: "Mapeamento de indicadores executivos", ownerId: employee.id, status: TaskStatus.DONE, priority: Priority.HIGH, plannedStart: new Date("2026-04-09T09:00:00.000Z"), plannedEnd: new Date("2026-05-10T18:00:00.000Z"), actualEnd: new Date("2026-05-12T18:00:00.000Z"), plannedDuration: 22, actualDuration: 24, progressPercent: 100, estimatedHours: 180, actualHours: 196 } }),
    prisma.task.create({ data: { projectId: phoenix.id, wbsCode: "3.1", name: "Integracao com fontes operacionais", ownerId: employee.id, status: TaskStatus.IN_PROGRESS, priority: Priority.CRITICAL, plannedStart: new Date("2026-05-13T09:00:00.000Z"), plannedEnd: new Date("2026-07-30T18:00:00.000Z"), plannedDuration: 56, progressPercent: 64, estimatedHours: 420, actualHours: 286 } }),
    prisma.task.create({ data: { projectId: phoenix.id, wbsCode: "4.1", name: "Homologacao do portal cliente", ownerId: manager.id, status: TaskStatus.IN_REVIEW, priority: Priority.HIGH, plannedStart: new Date("2026-08-01T09:00:00.000Z"), plannedEnd: new Date("2026-09-15T18:00:00.000Z"), plannedDuration: 32, progressPercent: 35, estimatedHours: 260, actualHours: 92 } }),
    prisma.task.create({ data: { projectId: phoenix.id, wbsCode: "5.1", name: "Go-live assistido", ownerId: manager.id, status: TaskStatus.TODO, priority: Priority.MEDIUM, plannedStart: new Date("2026-09-16T09:00:00.000Z"), plannedEnd: new Date("2026-10-30T18:00:00.000Z"), plannedDuration: 33, progressPercent: 0, estimatedHours: 340, actualHours: 0 } })
  ]);

  await prisma.document.deleteMany({ where: { projectId: phoenix.id } });
  await prisma.document.createMany({ data: [
    { projectId: phoenix.id, uploadedById: admin.id, name: "Plano Diretor Phoenix 360", type: "Plano do Projeto", sourceType: DocumentSourceType.GOOGLE_DRIVE, externalUrl: "https://drive.google.com/", embedUrl: "https://drive.google.com/", downloadUrl: "https://drive.google.com/", visibility: DocumentVisibility.CLIENT_VISIBLE, version: "v2.1", status: "Aprovado", clientDownloadAllowed: true },
    { projectId: phoenix.id, uploadedById: admin.id, name: "Plano de Comunicacao Executiva", type: "Plano de Comunicacao", sourceType: DocumentSourceType.GOOGLE_DRIVE, externalUrl: "https://drive.google.com/", downloadUrl: "https://drive.google.com/", visibility: DocumentVisibility.CLIENT_VISIBLE, version: "v1.4", status: "Aprovado", clientDownloadAllowed: true },
    { projectId: phoenix.id, uploadedById: admin.id, name: "Matriz de Riscos Detalhada", type: "Plano de Riscos", sourceType: DocumentSourceType.GOOGLE_DRIVE, externalUrl: "https://drive.google.com/", downloadUrl: "https://drive.google.com/", visibility: DocumentVisibility.CLIENT_VISIBLE, version: "v1.8", status: "Em revisao", clientDownloadAllowed: true },
    { projectId: phoenix.id, uploadedById: admin.id, name: "Cronograma Executivo Consolidado", type: "Cronograma", sourceType: DocumentSourceType.GOOGLE_DRIVE, externalUrl: "https://drive.google.com/", downloadUrl: "https://drive.google.com/", visibility: DocumentVisibility.CLIENT_VISIBLE, version: "v3.0", status: "Aprovado", clientDownloadAllowed: true },
    { projectId: phoenix.id, uploadedById: admin.id, name: "Pacote de Evidencias de Homologacao", type: "Evidencias", sourceType: DocumentSourceType.GOOGLE_DRIVE, externalUrl: "https://drive.google.com/", downloadUrl: "https://drive.google.com/", visibility: DocumentVisibility.CLIENT_VISIBLE, version: "v1.0", status: "Em construcao", clientDownloadAllowed: true }
  ] });

  await prisma.importantEmail.deleteMany({ where: { projectId: phoenix.id } });
  await prisma.importantEmail.createMany({ data: [
    { projectId: phoenix.id, subject: "Cronograma de implantacao Phoenix 360", summary: "Resumo da troca de informacoes sobre os marcos executivos, janelas de integracao e dependencias operacionais entre as equipes.", origin: "OFM Systems", involved: "Grupo Phoenix, Nexus Data e CloudOps Brasil", category: "E-mail Formal", status: "Solucionado", date: new Date("2026-04-08T10:00:00.000Z"), attachmentUrl: "https://drive.google.com/" },
    { projectId: phoenix.id, subject: "OnePage para acompanhamento semanal", summary: "Diretrizes estabelecidas para o reporte semanal, incluindo indicadores de prazo, riscos, bloqueios e proximas acoes.", origin: "PMO Phoenix", involved: "Helena Prado, Marina Gestora", category: "Status Report", status: "Solucionado", date: new Date("2026-05-12T14:00:00.000Z"), attachmentUrl: "https://drive.google.com/" },
    { projectId: phoenix.id, subject: "Acessos ao ambiente de homologacao", summary: "Pendencia de liberacao de acessos e VPN para consolidacao das cargas regionais no ambiente de homologacao.", origin: "CloudOps Brasil", involved: "TI Phoenix, Nexus Data", category: "Pendencia", status: "Pendencia", date: new Date("2026-06-10T09:30:00.000Z"), attachmentUrl: "https://drive.google.com/" }
  ] });

  await prisma.meetingMinute.deleteMany({ where: { projectId: phoenix.id } });
  await prisma.meetingMinute.createMany({ data: [
    { projectId: phoenix.id, title: "Ata - Check Point Projeto Phoenix 360", summary: "Alinhamento semanal sobre integracoes, riscos ativos, pendencias de VPN e proximas entregas do dashboard executivo.", meetingDate: new Date("2026-06-04T15:00:00.000Z"), meetingType: "Status Semanal", participants: "OFM, Grupo Phoenix, Nexus Data, CloudOps Brasil", status: "Publicado", fileUrl: "https://drive.google.com/" },
    { projectId: phoenix.id, title: "Ata - Comite Executivo de Governanca", summary: "Aprovacao dos criterios de saude do projeto, formato de reporte e matriz de escalonamento executivo.", meetingDate: new Date("2026-05-20T11:00:00.000Z"), meetingType: "Comite Executivo", participants: "Helena Prado, Marina Gestora, Bruno Costa", status: "Publicado", fileUrl: "https://drive.google.com/" },
    { projectId: phoenix.id, title: "Ata - Homologacao dos Indicadores", summary: "Validacao dos KPIs principais e encaminhamentos para ajustes de dados nas regionais Norte e Sul.", meetingDate: new Date("2026-05-30T16:00:00.000Z"), meetingType: "Homologacao", participants: "Operacoes Phoenix, Nexus Data, PMO Phoenix", status: "Publicado", fileUrl: "https://drive.google.com/" }
  ] });

  await prisma.milestone.deleteMany({ where: { projectId: phoenix.id } });
  await prisma.milestone.createMany({ data: [
    { projectId: phoenix.id, name: "Governanca aprovada", description: "Comite executivo aprovou ritos, papeis e matriz de decisao.", type: "Aprovacao", plannedDate: new Date("2026-04-08T18:00:00.000Z"), actualDate: new Date("2026-04-07T18:00:00.000Z"), status: "COMPLETED", owner: "Marina Gestora" },
    { projectId: phoenix.id, name: "Indicadores homologados", description: "KPIs executivos validados com operacoes e TI.", type: "Entrega", plannedDate: new Date("2026-05-30T18:00:00.000Z"), status: "COMPLETED", owner: "Helena Prado" },
    { projectId: phoenix.id, name: "Primeira carga integrada", description: "Carga operacional integrada ao dashboard executivo.", type: "Entrega", plannedDate: new Date("2026-07-15T18:00:00.000Z"), status: "IN_PROGRESS", owner: "Larissa Nogueira" },
    { projectId: phoenix.id, name: "Go-live portal cliente", description: "Publicacao do portal para diretoria e stakeholders.", type: "Implantacao", plannedDate: new Date("2026-10-30T18:00:00.000Z"), status: "PLANNED", owner: "Marina Gestora" }
  ] });

  await prisma.risk.deleteMany({ where: { projectId: phoenix.id } });
  const phoenixRisk = await prisma.risk.create({ data: { projectId: phoenix.id, name: "Inconsistencia nas fontes operacionais", description: "Algumas regioes possuem padroes diferentes de classificacao operacional.", classification: "CRITICAL", cause: "Baixa padronizacao de sistemas legados.", event: "Indicadores executivos divergentes entre regioes.", impact: "Perda de confianca nos dashboards e atraso na homologacao.", probability: "HIGH", responseStrategy: "MITIGATE", preventiveActions: "Criar dicionario de dados e reconciliacao automatica.", contingencyPlan: "Publicar indicadores por regional com ressalvas ate saneamento.", triggers: "Divergencia maior que 3% entre bases.", owner: "Larissa Nogueira", status: "IN_TREATMENT", lastReviewAt: new Date("2026-06-12T09:00:00.000Z") } });
  await prisma.risk.create({ data: { projectId: phoenix.id, name: "Baixa disponibilidade de usuarios-chave", description: "Agenda dos validadores regionais pode comprometer aprovacoes.", classification: "HIGH", probability: "MEDIUM", responseStrategy: "ACCEPT", owner: "Bruno Costa", status: "OPEN", impact: "Atraso em homologacao e go-live." } });
  await prisma.risk.create({ data: { projectId: phoenix.id, name: "Dependencia de fornecedor de rede", description: "Liberacoes de firewall dependem de janela externa.", classification: "MEDIUM", probability: "MEDIUM", responseStrategy: "TRANSFER", owner: "CloudOps Brasil", status: "OPEN", cause: "Processo externo de mudanca", event: "Janela negada ou reagendada", impact: "Atraso em integracoes", preventiveActions: "Antecipar solicitacoes de mudanca", contingencyPlan: "Usar tunel temporario homologado", triggers: "Mudanca sem aprovacao 72h antes", lastReviewAt: new Date("2026-06-14T09:00:00.000Z") } });
  await prisma.risk.create({ data: { projectId: phoenix.id, name: "Mudanca de prioridade executiva", description: "Nova demanda regulatoria pode redirecionar equipe-chave.", classification: "LOW", probability: "LOW", responseStrategy: "ACCEPT", owner: "Helena Prado", status: "OPEN", impact: "Reducao temporaria de capacidade" } });

  await prisma.portalTodo.deleteMany({ where: { projectId: phoenix.id } });
  await prisma.portalTodo.createMany({ data: [
    { projectId: phoenix.id, taskId: phoenixTasks[2].id, code: "PX-001", trafficLight: "RED", origin: "Cronograma", description: "Fechar dicionario de dados das regionais", responsible: "Larissa Nogueira", priority: Priority.CRITICAL, status: "IN_PROGRESS", dueDate: new Date("2026-07-05T18:00:00.000Z"), plannedProgress: 80, actualProgress: 55, estimatedHours: 40, workedHours: 28, nextAction: "Validar campos pendentes com regional Sul" },
    { projectId: phoenix.id, riskId: phoenixRisk.id, code: "PX-002", trafficLight: "YELLOW", origin: "Risco", description: "Definir regra de reconciliacao de indicadores", responsible: "Nexus Data", priority: Priority.HIGH, status: "OPEN", dueDate: new Date("2026-07-12T18:00:00.000Z"), plannedProgress: 50, actualProgress: 20, estimatedHours: 24, workedHours: 8, nextAction: "Apresentar proposta no comite tecnico" }
  ] });

  await prisma.blocker.deleteMany({ where: { projectId: phoenix.id } });
  await prisma.blocker.createMany({ data: [
    { projectId: phoenix.id, taskId: phoenixTasks[2].id, title: "VPN da regional Norte indisponivel", description: "A integracao com a fonte regional depende de liberacao de rede.", responsibleCompany: "CloudOps Brasil", responsiblePerson: "Mateus Lima", expectedResolutionAt: new Date("2026-07-03T18:00:00.000Z"), status: "IN_PROGRESS", scheduleImpactDays: 5, impactDescription: "Impede carga automatica da regional Norte e reduz abrangencia dos indicadores.", nextAction: "Executar mudanca de firewall na proxima janela aprovada.", financialImpact: 12500 },
    { projectId: phoenix.id, taskId: phoenixTasks[3].id, title: "Pendencia de aprovacao do layout executivo", description: "Comite solicitou ajustes na hierarquia de KPIs antes da publicacao.", responsibleCompany: "Grupo Phoenix", responsiblePerson: "Helena Prado", expectedResolutionAt: new Date("2026-08-22T18:00:00.000Z"), status: "OPEN", scheduleImpactDays: 2, impactDescription: "Pode postergar homologacao visual do portal do cliente.", nextAction: "Enviar versao revisada para aprovacao assincrona.", financialImpact: 4800 }
  ] });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
