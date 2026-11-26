package com.planpilot.backend.service;

import com.planpilot.backend.dto.CommentResponse;
import com.planpilot.backend.dto.CreateCommentRequest;
import com.planpilot.backend.model.Comment;
import com.planpilot.backend.model.Task;
import com.planpilot.backend.model.User;
import com.planpilot.backend.repository.CommentRepository;
import com.planpilot.backend.repository.TaskRepository;
import com.planpilot.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final TaskRepository    taskRepository;
    private final UserRepository    userRepository;

    public List<CommentResponse> getComments(String callerEmail, Long taskId) {
        getUser(callerEmail); // ensure authenticated
        getTask(taskId);      // ensure task exists
        return commentRepository.findByTaskIdOrderByCreatedAtAsc(taskId)
                .stream().map(CommentResponse::from).toList();
    }

    public CommentResponse addComment(String callerEmail, Long taskId, CreateCommentRequest req) {
        User author = getUser(callerEmail);
        Task task   = getTask(taskId);

        Comment comment = new Comment();
        comment.setTask(task);
        comment.setAuthor(author);
        comment.setContent(req.getContent().trim());

        return CommentResponse.from(commentRepository.save(comment));
    }

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
    }

    private Task getTask(Long id) {
        return taskRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found"));
    }
}
