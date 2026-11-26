package com.planpilot.backend.controller;

import com.planpilot.backend.dto.RegisterRequest;
import com.planpilot.backend.dto.UpdateProfileRequest;
import com.planpilot.backend.dto.UserResponse;
import com.planpilot.backend.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PatchMapping("/me")
    public ResponseEntity<UserResponse> updateProfile(
            Principal principal,
            @RequestBody UpdateProfileRequest req) {
        return ResponseEntity.ok(userService.updateProfile(principal.getName(), req));
    }

    @GetMapping
    public ResponseEntity<List<UserResponse>> getAllEmployees(Principal principal) {
        return ResponseEntity.ok(userService.getAllEmployees(principal.getName()));
    }

    @PostMapping
    public ResponseEntity<UserResponse> addMember(
            Principal principal,
            @Valid @RequestBody RegisterRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(userService.addMember(principal.getName(), req));
    }
}
