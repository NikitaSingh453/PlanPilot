package com.planpilot.backend.repository;

import com.planpilot.backend.model.Task;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByAssigneeId(Long assigneeId);
    List<Task> findByOwnerId(Long ownerId);
}
