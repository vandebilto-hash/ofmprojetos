package com.projetese.mpp;

import java.io.File;
import java.nio.file.Files;
import java.util.List;
import java.util.ArrayList;
import java.util.Objects;

import net.sf.mpxj.ProjectFile;
import net.sf.mpxj.Task;
import net.sf.mpxj.reader.UniversalProjectReader;
import org.springframework.http.MediaType;
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
