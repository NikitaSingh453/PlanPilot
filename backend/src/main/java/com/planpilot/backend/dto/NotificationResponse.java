package com.planpilot.backend.dto;

import com.planpilot.backend.model.Notification;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class NotificationResponse {
    private Long          id;
    private String        message;
    private String        link;
    private boolean       read;
    private LocalDateTime createdAt;

    public static NotificationResponse from(Notification n) {
        NotificationResponse r = new NotificationResponse();
        r.setId(n.getId());
        r.setMessage(n.getMessage());
        r.setLink(n.getLink());
        r.setRead(n.isRead());
        r.setCreatedAt(n.getCreatedAt());
        return r;
    }
}
