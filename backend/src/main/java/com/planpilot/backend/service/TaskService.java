package com.planpilot.backend.service;

import com.planpilot.backend.dto.CreateTaskRequest;
import com.planpilot.backend.dto.TaskResponse;
import com.planpilot.backend.dto.UpdateTaskRequest;
import com.planpilot.backend.model.*;
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
public class TaskService {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;

    // Employees create tasks for themselves only (source = SELF)
    public TaskResponse createSelfTask(String callerEmail, CreateTaskRequest req) {
        User caller = getUser(callerEmail);

        Task task = new Task();
        task.setTitle(req.getTitle());
        task.setDescription(req.getDescription());
        task.setPriority(req.getPriority() != null ? req.getPriority() : TaskPriority.MEDIUM);
        task.setDueDate(req.getDueDate());
        task.setSource(TaskSource.SELF);
        task.setOwner(caller);
        task.setAssignee(caller);

        return TaskResponse.from(taskRepository.save(task));
    }

    // Managers assign tasks to any user (source = ASSIGNED)
    public TaskResponse assignTask(String callerEmail, Long assigneeId, CreateTaskRequest req) {
        User caller = getUser(callerEmail);
        requireRole(caller, Role.MANAGER);

        User assignee = userRepository.findById(assigneeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Assignee not found"));

        Task task = new Task();
        task.setTitle(req.getTitle());
        task.setDescription(req.getDescription());
        task.setPriority(req.getPriority() != null ? req.getPriority() : TaskPriority.MEDIUM);
        task.setDueDate(req.getDueDate());
        task.setSource(TaskSource.ASSIGNED);
        task.setOwner(caller);
        task.setAssignee(assignee);

        return TaskResponse.from(taskRepository.save(task));
    }

    // Returns tasks visible to the caller:
    // - Managers see all tasks
    // - Employees see tasks where they are the assignee
    public List<TaskResponse> getMyTasks(String callerEmail) {
        User caller = getUser(callerEmail);

        if (caller.getRole() == Role.MANAGER) {
            return taskRepository.findAll().stream().map(TaskResponse::from).toList();
        }

        return taskRepository.findByAssigneeId(caller.getId())
                .stream().map(TaskResponse::from).toList();
    }

    // Full update — only allowed by managers or the owner of a SELF task
    public TaskResponse updateTask(String callerEmail, Long taskId, UpdateTaskRequest req) {
        User caller = getUser(callerEmail);
        Task task = getTask(taskId);

        boolean isManager = caller.getRole() == Role.MANAGER;
        boolean isSelfOwner = task.getSource() == TaskSource.SELF
                && task.getOwner().getId().equals(caller.getId());

        if (!isManager && !isSelfOwner) {
            // Employees on ASSIGNED tasks may only update status
            if (req.getTitle() != null || req.getDescription() != null
                    || req.getPriority() != null || req.getDueDate() != null) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Employees can only update the status of assigned tasks");
            }
        }

        if (req.getTitle() != null)       task.setTitle(req.getTitle());
        if (req.getDescription() != null) task.setDescription(req.getDescription());
        if (req.getStatus() != null)      task.setStatus(req.getStatus());
        if (req.getPriority() != null)    task.setPriority(req.getPriority());
        if (req.getDueDate() != null)     task.setDueDate(req.getDueDate());

        return TaskResponse.from(taskRepository.save(task));
    }

    // Delete — only managers or the owner of a SELF task
    public void deleteTask(String callerEmail, Long taskId) {
        User caller = getUser(callerEmail);
        Task task = getTask(taskId);

        boolean isManager = caller.getRole() == Role.MANAGER;
        boolean isSelfOwner = task.getSource() == TaskSource.SELF
                && task.getOwner().getId().equals(caller.getId());

        if (!isManager && !isSelfOwner) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "You can only delete your own personal tasks");
        }

        taskRepository.delete(task);
    }

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));
    }

    private Task getTask(Long id) {
        return taskRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found"));
    }

    private void requireRole(User user, Role required) {
        if (user.getRole() != required) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "This action requires the " + required + " role");
        }
    }
}
