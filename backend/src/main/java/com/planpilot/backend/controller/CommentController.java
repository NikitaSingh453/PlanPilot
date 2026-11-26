package com.planpilot.backend.controller;

import com.planpilot.backend.dto.CommentResponse;
import com.planpilot.backend.dto.CreateCommentRequest;
import com.planpilot.backend.service.CommentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/tasks/{taskId}/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    @GetMapping
    public ResponseEntity<List<CommentResponse>> getComments(
            @PathVariable Long taskId, Principal principal) {
        return ResponseEntity.ok(commentService.getComments(principal.getName(), taskId));
    }

    @PostMapping
    public ResponseEntity<CommentResponse> addComment(
            @PathVariable Long taskId,
            Principal principal,
            @Valid @RequestBody CreateCommentRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(commentService.addComment(principal.getName(), taskId, req));
    }
}
