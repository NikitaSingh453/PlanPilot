package com.planpilot.backend.dto;

import com.planpilot.backend.model.Project;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ProjectResponse {
    private Long id;
    private String name;
    private String description;
    private Long ownerId;
    private String ownerName;
    private LocalDateTime createdAt;

    public static ProjectResponse from(Project p) {
        ProjectResponse r = new ProjectResponse();
        r.setId(p.getId());
        r.setName(p.getName());
        r.setDescription(p.getDescription());
        r.setOwnerId(p.getOwner().getId());
        r.setOwnerName(p.getOwner().getName());
        r.setCreatedAt(p.getCreatedAt());
        return r;
    }
}
