package com.planpilot.backend.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class CreateTimeLogRequest {

    @NotNull
    private Long taskId;

    @NotNull
    @Min(1) @Max(24 * 10)   // up to 24 h per entry, guard against absurd values
    private Double hours;

    private LocalDate date;  // defaults to today if null

    private String note;
}
