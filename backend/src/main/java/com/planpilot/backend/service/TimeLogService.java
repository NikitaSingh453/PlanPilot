package com.planpilot.backend.service;

import com.planpilot.backend.dto.CreateTimeLogRequest;
import com.planpilot.backend.dto.TimeLogResponse;
import com.planpilot.backend.dto.WeekSummaryResponse;
import com.planpilot.backend.model.Task;
import com.planpilot.backend.model.TimeLog;
import com.planpilot.backend.model.User;
import com.planpilot.backend.repository.TaskRepository;
import com.planpilot.backend.repository.TimeLogRepository;
import com.planpilot.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TimeLogService {

    private final TimeLogRepository timeLogRepository;
    private final UserRepository    userRepository;
    private final TaskRepository    taskRepository;

    public TimeLogResponse logTime(String callerEmail, CreateTimeLogRequest req) {
        User caller = getUser(callerEmail);

        Task task = taskRepository.findById(req.getTaskId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found"));

        // Only allow logging on tasks assigned to the caller (or managers logging any task)
        boolean isManager = caller.getRole().name().equals("MANAGER");
        if (!isManager && !task.getAssignee().getId().equals(caller.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "You can only log time on tasks assigned to you");
        }

        TimeLog log = new TimeLog();
        log.setUser(caller);
        log.setTask(task);
        log.setHours(req.getHours());
        log.setDate(req.getDate() != null ? req.getDate() : LocalDate.now());
        log.setNote(req.getNote());

        return TimeLogResponse.from(timeLogRepository.save(log));
    }

    public WeekSummaryResponse getWeekSummary(String callerEmail) {
        User caller = getUser(callerEmail);

        LocalDate today   = LocalDate.now();
        LocalDate monday  = today.with(DayOfWeek.MONDAY);
        LocalDate sunday  = monday.plusDays(6);

        List<TimeLogResponse> entries = timeLogRepository
                .findByUserIdAndDateBetweenOrderByDateDescCreatedAtDesc(caller.getId(), monday, sunday)
                .stream().map(TimeLogResponse::from).toList();

        double hoursLogged = timeLogRepository.sumHoursByUserAndDateRange(caller.getId(), monday, sunday);

        // Estimate: count of open tasks × 2 hours each, minimum hoursLogged
        long openTasks = taskRepository.findByAssigneeId(caller.getId())
                .stream().filter(t -> !t.getStatus().name().equals("DONE")).count();
        double hoursEstimated = Math.max(openTasks * 2.0, hoursLogged + 1);

        return new WeekSummaryResponse(hoursLogged, hoursEstimated, entries);
    }

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));
    }
}
