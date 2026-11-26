package com.planpilot.backend.dto;

import com.planpilot.backend.model.Comment;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CommentResponse {
    private Long          id;
    private Long          authorId;
    private String        authorName;
    private String        content;
    private LocalDateTime createdAt;

    public static CommentResponse from(Comment c) {
        CommentResponse r = new CommentResponse();
        r.setId(c.getId());
        r.setAuthorId(c.getAuthor().getId());
        r.setAuthorName(c.getAuthor().getName());
        r.setContent(c.getContent());
        r.setCreatedAt(c.getCreatedAt());
        return r;
    }
}
