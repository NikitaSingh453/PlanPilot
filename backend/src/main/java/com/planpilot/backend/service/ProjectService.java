package com.planpilot.backend.service;

import com.planpilot.backend.dto.CreateProjectRequest;
import com.planpilot.backend.dto.ProjectResponse;
import com.planpilot.backend.model.Project;
import com.planpilot.backend.model.Role;
import com.planpilot.backend.model.User;
import com.planpilot.backend.repository.ProjectRepository;
import com.planpilot.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    public ProjectResponse create(String callerEmail, CreateProjectRequest req) {
        User caller = getUser(callerEmail);
        requireRole(caller, Role.MANAGER);

        Project project = new Project();
        project.setName(req.getName());
        project.setDescription(req.getDescription());
        project.setOwner(caller);

        return ProjectResponse.from(projectRepository.save(project));
    }

    public List<ProjectResponse> getAll(String callerEmail) {
        User caller = getUser(callerEmail);
        requireRole(caller, Role.MANAGER);
        return projectRepository.findAll().stream().map(ProjectResponse::from).toList();
    }

    public void delete(String callerEmail, Long projectId) {
        User caller = getUser(callerEmail);
        requireRole(caller, Role.MANAGER);
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found"));
        projectRepository.delete(project);
    }

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));
    }

    private void requireRole(User user, Role required) {
        if (user.getRole() != required) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "This action requires the " + required + " role");
        }
    }
}
