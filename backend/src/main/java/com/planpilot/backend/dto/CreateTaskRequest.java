package com.planpilot.backend.dto;

import com.planpilot.backend.model.TaskPriority;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDate;

@Data
public class CreateTaskRequest {

    @NotBlank
    private String title;

    private String description;

    private TaskPriority priority;

    private LocalDate dueDate;
}
