package com.projetese.mpp;

import java.io.File;
import java.nio.file.Files;
import java.util.List;
import java.util.ArrayList;
import java.util.Objects;

import net.sf.mpxj.ProjectFile;
import net.sf.mpxj.Task;
import net.sf.mpxj.reader.UniversalProjectReader;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
public class MppController {

  private static final Logger log = LoggerFactory.getLogger(MppController.class);

  @GetMapping("/health")
  public Health health() {
    return new Health("ok");
  }

  @PostMapping(path = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public Object importMpp(@RequestParam("file") MultipartFile file) throws Exception {
    String originalName = Objects.requireNonNullElse(file.getOriginalFilename(), "project.mpp");
    log.info("[IMPORT] Received file: {} ({} bytes)", originalName, file.getSize());

    if (file.isEmpty() || file.getSize() <= 0) {
      log.error("[IMPORT] File is empty: {}", originalName);
      return new ErrorResponse("Arquivo vazio. Selecione um arquivo MPP valido.");
    }

    File tempFile = Files.createTempFile("projete-se-", "-" + originalName).toFile();
    try {
      file.transferTo(tempFile);
      log.info("[IMPORT] Temp file written: {} ({} bytes)", tempFile.getAbsolutePath(), tempFile.length());

      if (tempFile.length() == 0) {
        log.error("[IMPORT] Temp file is empty after transfer");
        return new ErrorResponse("Falha ao ler o arquivo. O arquivo esta vazio apos transferencia.");
      }

      ProjectFile project = new UniversalProjectReader().read(tempFile);

      if (project == null) {
        log.error("[IMPORT] MPXJ returned null for file: {} (size: {})", originalName, tempFile.length());
        return new ErrorResponse("Nao foi possivel ler o arquivo. Verifique se e um arquivo MPP, XML ou MPX valido e nao corrompido.");
      }

      List<Task> allTasks = project.getTasks();
      if (allTasks == null || allTasks.isEmpty()) {
        log.warn("[IMPORT] No tasks found in file: {}", originalName);
        return new ErrorResponse("O arquivo nao contem tarefas.");
      }

      List<ImportedTask> tasks = allTasks.stream()
        .filter(task -> task.getName() != null && !task.getName().isBlank())
        .map(this::toImportedTask)
        .toList();

      log.info("[IMPORT] Successfully parsed {} tasks from {}", tasks.size(), originalName);
      String title = project.getProjectProperties() != null ? project.getProjectProperties().getProjectTitle() : null;
      return new ImportResult(title, tasks);
    } catch (Exception e) {
      log.error("[IMPORT] Error parsing file {}: {}", originalName, e.getMessage(), e);
      return new ErrorResponse("Erro ao processar o arquivo: " + e.getMessage());
    } finally {
      tempFile.delete();
    }
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
  public record ErrorResponse(String error) {}
}
