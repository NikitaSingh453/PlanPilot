package com.planpilot.backend.controller;

import com.planpilot.backend.dto.CreateTaskRequest;
import com.planpilot.backend.dto.TaskResponse;
import com.planpilot.backend.dto.UpdateTaskRequest;
import com.planpilot.backend.service.TaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    // Any authenticated user creates a personal task for themselves
    @PostMapping("/self")
    public ResponseEntity<TaskResponse> createSelfTask(
            Principal principal,
            @Valid @RequestBody CreateTaskRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(taskService.createSelfTask(principal.getName(), req));
    }

    // Managers assign a task to a specific user
    @PostMapping("/assign/{assigneeId}")
    public ResponseEntity<TaskResponse> assignTask(
            Principal principal,
            @PathVariable Long assigneeId,
            @Valid @RequestBody CreateTaskRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(taskService.assignTask(principal.getName(), assigneeId, req));
    }

    // Returns tasks visible to the caller
    @GetMapping
    public ResponseEntity<List<TaskResponse>> getMyTasks(Principal principal) {
        return ResponseEntity.ok(taskService.getMyTasks(principal.getName()));
    }

    // Update — permission enforced in service
    @PatchMapping("/{id}")
    public ResponseEntity<TaskResponse> updateTask(
            Principal principal,
            @PathVariable Long id,
            @RequestBody UpdateTaskRequest req) {
        return ResponseEntity.ok(taskService.updateTask(principal.getName(), id, req));
    }

    // Delete — permission enforced in service
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTask(Principal principal, @PathVariable Long id) {
        taskService.deleteTask(principal.getName(), id);
        return ResponseEntity.noContent().build();
    }
}
