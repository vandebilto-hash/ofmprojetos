package com.projetese.mpp;

import java.io.File;
import java.io.OutputStream;
import java.nio.file.Files;
import java.time.LocalDateTime;
import java.util.List;
import java.util.ArrayList;
import java.util.Objects;

import net.sf.mpxj.ProjectFile;
import net.sf.mpxj.Task;
import net.sf.mpxj.ProjectCalendar;
import net.sf.mpxj.Day;
import net.sf.mpxj.Priority;
import net.sf.mpxj.RelationType;
import net.sf.mpxj.mspdi.MSPDIWriter;
import net.sf.mpxj.reader.UniversalProjectReader;
import org.springframework.http.MediaType;
import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
public class MppController {
  @GetMapping("/health")
  public Health health() {
    return new Health("ok");
  }

  @GetMapping(value = "/template", produces = "application/octet-stream")
  public void downloadTemplate(org.springframework.http.HttpServletResponse response) throws Exception {
    response.setHeader(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"template-projete-se.xml\"");

    ProjectFile project = new ProjectFile();

    ProjectCalendar cal = project.getCalendar();
    cal.setName("Padrao");
    for (int d = 2; d <= 6; d++) {
      Day day = Day.getValue(d);
      cal.setWorking(day, true);
      cal.addDefaultWorkingHours(day);
    }
    cal.setWorking(Day.SUNDAY, false);
    cal.setWorking(Day.SATURDAY, true);
    cal.addDefaultWorkingHours(Day.SATURDAY);

    project.getProjectProperties().setTitle("Template Projete-se");
    project.getProjectProperties().setStart(LocalDateTime.of(2026, 7, 1, 8, 0));

    Task phase1 = createTask(project, 1, "Fase de Planejamento", 0, "1",
      LocalDateTime.of(2026, 7, 1, 8, 0), LocalDateTime.of(2026, 7, 15, 17, 0));
    Task t11 = createTask(project, 2, "Definicao de Escopo", 1, "1.1",
      LocalDateTime.of(2026, 7, 1, 8, 0), LocalDateTime.of(2026, 7, 5, 17, 0));
    Task t111 = createTask(project, 3, "Levantamento de Requisitos", 2, "1.1.1",
      LocalDateTime.of(2026, 7, 1, 8, 0), LocalDateTime.of(2026, 7, 3, 17, 0));
    Task t112 = createTask(project, 4, "Documentacao de Escopo", 2, "1.1.2",
      LocalDateTime.of(2026, 7, 3, 8, 0), LocalDateTime.of(2026, 7, 5, 17, 0));
    Task t12 = createTask(project, 5, "Planejamento de Recursos", 1, "1.2",
      LocalDateTime.of(2026, 7, 5, 8, 0), LocalDateTime.of(2026, 7, 10, 17, 0));
    Task t121 = createTask(project, 6, "Alocacao de Equipe", 2, "1.2.1",
      LocalDateTime.of(2026, 7, 5, 8, 0), LocalDateTime.of(2026, 7, 8, 17, 0));
    Task t122 = createTask(project, 7, "Aquisicao de Ferramentas", 2, "1.2.2",
      LocalDateTime.of(2026, 7, 8, 8, 0), LocalDateTime.of(2026, 7, 10, 17, 0));
    Task t13 = createTask(project, 8, "Aprovacao do Planejamento", 1, "1.3",
      LocalDateTime.of(2026, 7, 10, 8, 0), LocalDateTime.of(2026, 7, 15, 17, 0));

    Task phase2 = createTask(project, 9, "Fase de Desenvolvimento", 0, "2",
      LocalDateTime.of(2026, 7, 15, 8, 0), LocalDateTime.of(2026, 8, 30, 17, 0));
    Task t21 = createTask(project, 10, "Modulo Backend", 1, "2.1",
      LocalDateTime.of(2026, 7, 15, 8, 0), LocalDateTime.of(2026, 8, 10, 17, 0));
    Task t211 = createTask(project, 11, "API REST", 2, "2.1.1",
      LocalDateTime.of(2026, 7, 15, 8, 0), LocalDateTime.of(2026, 7, 25, 17, 0));
    Task t212 = createTask(project, 12, "Banco de Dados", 2, "2.1.2",
      LocalDateTime.of(2026, 7, 25, 8, 0), LocalDateTime.of(2026, 8, 5, 17, 0));
    Task t213 = createTask(project, 13, "Integracao", 2, "2.1.3",
      LocalDateTime.of(2026, 8, 5, 8, 0), LocalDateTime.of(2026, 8, 10, 17, 0));
    Task t22 = createTask(project, 14, "Modulo Frontend", 1, "2.2",
      LocalDateTime.of(2026, 7, 20, 8, 0), LocalDateTime.of(2026, 8, 20, 17, 0));
    Task t221 = createTask(project, 15, "Design de Interface", 2, "2.2.1",
      LocalDateTime.of(2026, 7, 20, 8, 0), LocalDateTime.of(2026, 7, 30, 17, 0));
    Task t222 = createTask(project, 16, "Implementacao de Componentes", 2, "2.2.2",
      LocalDateTime.of(2026, 7, 30, 8, 0), LocalDateTime.of(2026, 8, 15, 17, 0));
    Task t223 = createTask(project, 17, "Testes de Interface", 2, "2.2.3",
      LocalDateTime.of(2026, 8, 15, 8, 0), LocalDateTime.of(2026, 8, 20, 17, 0));
    Task t23 = createTask(project, 18, "Testes Integrados", 1, "2.3",
      LocalDateTime.of(2026, 8, 20, 8, 0), LocalDateTime.of(2026, 8, 30, 17, 0));

    Task phase3 = createTask(project, 19, "Fase de Entrega", 0, "3",
      LocalDateTime.of(2026, 8, 30, 8, 0), LocalDateTime.of(2026, 9, 10, 17, 0));
    Task t31 = createTask(project, 20, "Deploy em Producao", 1, "3.1",
      LocalDateTime.of(2026, 8, 30, 8, 0), LocalDateTime.of(2026, 9, 5, 17, 0));
    Task t32 = createTask(project, 21, "Documentacao Final", 1, "3.2",
      LocalDateTime.of(2026, 9, 1, 8, 0), LocalDateTime.of(2026, 9, 8, 17, 0));
    Task t33 = createTask(project, 22, "Treinamento do Cliente", 1, "3.3",
      LocalDateTime.of(2026, 9, 5, 8, 0), LocalDateTime.of(2026, 9, 10, 17, 0));

    addLink(t112, t111, RelationType.FINISH_START);
    addLink(t12, t112, RelationType.FINISH_START);
    addLink(t122, t121, RelationType.FINISH_START);
    addLink(t13, t122, RelationType.FINISH_START);
    addLink(phase2, t13, RelationType.FINISH_START);
    addLink(t212, t211, RelationType.FINISH_START);
    addLink(t213, t212, RelationType.FINISH_START);
    addLink(t222, t221, RelationType.FINISH_START);
    addLink(t223, t222, RelationType.FINISH_START);
    addLink(t23, t213, RelationType.FINISH_START);
    addLink(t23, t223, RelationType.FINISH_START);
    addLink(phase3, t23, RelationType.FINISH_START);
    addLink(t33, t31, RelationType.FINISH_START);
    addLink(t33, t32, RelationType.FINISH_START);

    phase1.addChildTask(t11);
    phase1.addChildTask(t12);
    phase1.addChildTask(t13);
    t11.addChildTask(t111);
    t11.addChildTask(t112);
    t12.addChildTask(t121);
    t12.addChildTask(t122);
    phase2.addChildTask(t21);
    phase2.addChildTask(t22);
    phase2.addChildTask(t23);
    t21.addChildTask(t211);
    t21.addChildTask(t212);
    t21.addChildTask(t213);
    t22.addChildTask(t221);
    t22.addChildTask(t222);
    t22.addChildTask(t223);
    phase3.addChildTask(t31);
    phase3.addChildTask(t32);
    phase3.addChildTask(t33);

    MSPDIWriter writer = new MSPDIWriter();
    writer.write(project, response.getOutputStream());
    response.getOutputStream().flush();
  }

  private Task createTask(ProjectFile project, int uid, String name, int outlineLevel, String outlineNumber,
      LocalDateTime start, LocalDateTime finish) {
    Task task = project.addTask();
    task.setUniqueID(uid);
    task.setID(uid);
    task.setName(name);
    task.setOutlineLevel(outlineLevel + 1);
    task.setOutlineNumber(outlineNumber);
    task.setStart(start);
    task.setFinish(finish);
    task.setPercentageComplete(0.0);
    task.setPriority(Priority.getInstance(500));
    task.setNotes("Template de importacao - edite este campo com observacoes da tarefa.");
    return task;
  }

  private void addLink(Task successor, Task predecessor, RelationType type) {
    successor.addPredecessor().predecessorTask(predecessor).type(type).finish();
  }

  @PostMapping(path = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ImportResult importMpp(@RequestParam("file") MultipartFile file) throws Exception {
    File tempFile = Files.createTempFile("projete-se-", "-" + Objects.requireNonNullElse(file.getOriginalFilename(), "project.mpp")).toFile();
    file.transferTo(tempFile);

    ProjectFile project = new UniversalProjectReader().read(tempFile);
    List<ImportedTask> tasks = project.getTasks().stream()
      .filter(task -> task.getName() != null && !task.getName().isBlank())
      .map(this::toImportedTask)
      .toList();

    tempFile.delete();
    return new ImportResult(project.getProjectProperties().getProjectTitle(), tasks);
  }

  private ImportedTask toImportedTask(Task task) {
    return new ImportedTask(
      task.getUniqueID() == null ? null : task.getUniqueID().toString(),
      task.getName(),
      task.getStart() == null ? null : task.getStart().toString(),
      task.getFinish() == null ? null : task.getFinish().toString(),
      task.getPercentageComplete() == null ? 0 : task.getPercentageComplete().intValue(),
      task.getOutlineLevel() == null ? 1 : task.getOutlineLevel(),
      extractAssignments(task),
      extractPredecessors(task)
    );
  }

  private List<ImportedAssignment> extractAssignments(Task task) {
    List<ImportedAssignment> assignments = new ArrayList<>();
    Object rawAssignments = invoke(task, "getResourceAssignments");
    if (!(rawAssignments instanceof Iterable<?> iterable)) return assignments;

    for (Object assignment : iterable) {
      Object resource = invoke(assignment, "getResource");
      String resourceName = valueAsString(invoke(resource, "getName"));
      if (resourceName == null || resourceName.isBlank()) continue;

      Object work = invoke(assignment, "getWork");
      Double workHours = durationToHours(work);
      assignments.add(new ImportedAssignment(resourceName, workHours));
    }

    return assignments;
  }

  private List<ImportedPredecessor> extractPredecessors(Task task) {
    List<ImportedPredecessor> predecessors = new ArrayList<>();
    Object rawPredecessors = invoke(task, "getPredecessors");
    if (!(rawPredecessors instanceof Iterable<?> iterable)) return predecessors;

    for (Object relation : iterable) {
      Object targetTask = firstNonNull(invoke(relation, "getTargetTask"), invoke(relation, "getSourceTask"));
      String externalId = valueAsString(invoke(targetTask, "getUniqueID"));
      String type = valueAsString(invoke(relation, "getType"));
      Integer lagDays = durationToDays(invoke(relation, "getLag"));
      if (externalId == null || externalId.isBlank()) continue;
      predecessors.add(new ImportedPredecessor(externalId, type == null ? "FS" : type, lagDays == null ? 0 : lagDays));
    }

    return predecessors;
  }

  private Object invoke(Object target, String methodName) {
    if (target == null) return null;
    try {
      return target.getClass().getMethod(methodName).invoke(target);
    } catch (Exception ignored) {
      return null;
    }
  }

  private Object firstNonNull(Object first, Object second) {
    return first == null ? second : first;
  }

  private String valueAsString(Object value) {
    return value == null ? null : value.toString();
  }

  private Double durationToHours(Object duration) {
    if (duration == null) return null;
    Object raw = invoke(duration, "getDuration");
    if (raw instanceof Number number) return number.doubleValue();
    try {
      return Double.parseDouble(duration.toString().replaceAll("[^0-9.,-]", "").replace(",", "."));
    } catch (Exception ignored) {
      return null;
    }
  }

  private Integer durationToDays(Object duration) {
    Double hours = durationToHours(duration);
    if (hours == null) return null;
    return (int) Math.round(hours / 8.0);
  }

  public record Health(String status) {}
  public record ImportResult(String name, List<ImportedTask> tasks) {}
  public record ImportedTask(String externalId, String name, String start, String finish, int percentComplete, int outlineLevel, List<ImportedAssignment> assignments, List<ImportedPredecessor> predecessors) {}
  public record ImportedAssignment(String resourceName, Double workHours) {}
  public record ImportedPredecessor(String externalId, String type, int lagDays) {}
}
