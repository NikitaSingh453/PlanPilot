package com.planpilot.backend.dto;

import com.planpilot.backend.model.TimeLog;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class TimeLogResponse {
    private Long   id;
    private Long   taskId;
    private String taskTitle;
    private double hours;
    private LocalDate     date;
    private String        note;
    private LocalDateTime createdAt;

    public static TimeLogResponse from(TimeLog tl) {
        TimeLogResponse r = new TimeLogResponse();
        r.setId(tl.getId());
        r.setTaskId(tl.getTask().getId());
        r.setTaskTitle(tl.getTask().getTitle());
        r.setHours(tl.getHours());
        r.setDate(tl.getDate());
        r.setNote(tl.getNote());
        r.setCreatedAt(tl.getCreatedAt());
        return r;
    }
}
