package com.planpilot.backend.controller;

import com.planpilot.backend.dto.CreateTimeLogRequest;
import com.planpilot.backend.dto.TimeLogResponse;
import com.planpilot.backend.dto.WeekSummaryResponse;
import com.planpilot.backend.service.TimeLogService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/timelogs")
@RequiredArgsConstructor
public class TimeLogController {

    private final TimeLogService timeLogService;

    @PostMapping
    public ResponseEntity<TimeLogResponse> logTime(
            Principal principal,
            @Valid @RequestBody CreateTimeLogRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(timeLogService.logTime(principal.getName(), req));
    }

    @GetMapping("/week")
    public ResponseEntity<WeekSummaryResponse> getWeekSummary(Principal principal) {
        return ResponseEntity.ok(timeLogService.getWeekSummary(principal.getName()));
    }
}
