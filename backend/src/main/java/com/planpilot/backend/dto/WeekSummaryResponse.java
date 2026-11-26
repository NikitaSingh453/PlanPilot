package com.planpilot.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class WeekSummaryResponse {
    private double            hoursLogged;
    private double            hoursEstimated;
    private List<TimeLogResponse> entries;
}
