package com.planpilot.backend.controller;

import com.planpilot.backend.dto.CreateProjectRequest;
import com.planpilot.backend.dto.ProjectResponse;
import com.planpilot.backend.service.ProjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    @PostMapping
    public ResponseEntity<ProjectResponse> create(
            Principal principal,
            @Valid @RequestBody CreateProjectRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(projectService.create(principal.getName(), req));
    }

    @GetMapping
    public ResponseEntity<List<ProjectResponse>> getAll(Principal principal) {
        return ResponseEntity.ok(projectService.getAll(principal.getName()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(Principal principal, @PathVariable Long id) {
        projectService.delete(principal.getName(), id);
        return ResponseEntity.noContent().build();
    }
}
