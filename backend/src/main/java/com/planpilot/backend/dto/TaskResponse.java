package com.planpilot.backend.dto;

import com.planpilot.backend.model.Task;
import com.planpilot.backend.model.TaskPriority;
import com.planpilot.backend.model.TaskSource;
import com.planpilot.backend.model.TaskStatus;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class TaskResponse {
    private Long id;
    private String title;
    private String description;
    private TaskStatus status;
    private TaskPriority priority;
    private TaskSource source;
    private Long ownerId;
    private String ownerName;
    private Long assigneeId;
    private String assigneeName;
    private Long projectId;
    private String projectName;
    private LocalDate dueDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static TaskResponse from(Task task) {
        TaskResponse r = new TaskResponse();
        r.setId(task.getId());
        r.setTitle(task.getTitle());
        r.setDescription(task.getDescription());
        r.setStatus(task.getStatus());
        r.setPriority(task.getPriority());
        r.setSource(task.getSource());
        r.setOwnerId(task.getOwner().getId());
        r.setOwnerName(task.getOwner().getName());
        r.setAssigneeId(task.getAssignee().getId());
        r.setAssigneeName(task.getAssignee().getName());
        if (task.getProject() != null) {
            r.setProjectId(task.getProject().getId());
            r.setProjectName(task.getProject().getName());
        }
        r.setDueDate(task.getDueDate());
        r.setCreatedAt(task.getCreatedAt());
        r.setUpdatedAt(task.getUpdatedAt());
        return r;
    }
}
