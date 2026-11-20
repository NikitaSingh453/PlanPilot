package com.planpilot.backend.dto;

import com.planpilot.backend.model.TaskPriority;
import com.planpilot.backend.model.TaskStatus;
import lombok.Data;

import java.time.LocalDate;

@Data
public class UpdateTaskRequest {
    private String title;
    private String description;
    private TaskStatus status;
    private TaskPriority priority;
    private LocalDate dueDate;
}
