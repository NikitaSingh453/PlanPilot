package com.planpilot.backend;

import com.planpilot.backend.model.*;
import com.planpilot.backend.repository.ProjectRepository;
import com.planpilot.backend.repository.TaskRepository;
import com.planpilot.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DataSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final UserRepository    userRepository;
    private final ProjectRepository projectRepository;
    private final TaskRepository    taskRepository;

    @Override
    public void run(ApplicationArguments args) {
        if (taskRepository.count() > 0) {
            log.info("Seed data already present — skipping.");
            return;
        }

        List<User> managers  = userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.MANAGER).toList();
        List<User> employees = userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.EMPLOYEE).toList();

        if (managers.isEmpty() || employees.isEmpty()) {
            log.info("Waiting for both a MANAGER and an EMPLOYEE account before seeding. Register both accounts then restart.");
            return;
        }

        User manager  = managers.get(0);
        User employee = employees.get(0);

        // ── Projects ──────────────────────────────────────────────
        Project webRedesign = project(manager, "Website Redesign",
                "Revamp the public-facing site with new branding and improved UX.");
        Project mobileApp = project(manager, "Mobile App v2",
                "React Native rewrite of the mobile client with offline support.");
        Project internalTools = project(manager, "Internal Tools",
                "Developer tooling: CI/CD pipelines, monitoring dashboards, scripts.");

        projectRepository.saveAll(List.of(webRedesign, mobileApp, internalTools));

        // ── Self tasks (employee owns & is assigned to themselves) ─
        LocalDate today = LocalDate.now();

        taskRepository.saveAll(List.of(

            // Overdue – surfaces the overdue banner + stat card
            task(employee, employee, "Review Q4 performance report",
                    "Go through the report and highlight key wins and blockers.",
                    TaskStatus.TODO, TaskPriority.HIGH, TaskSource.SELF,
                    today.minusDays(2), null),

            // Due today – appears in Today's flight plan
            task(employee, employee, "Update personal developer profile",
                    "Add recent projects and update skills on the internal directory.",
                    TaskStatus.IN_PROGRESS, TaskPriority.MEDIUM, TaskSource.SELF,
                    today, null),

            // Upcoming – appears in Upcoming deadlines
            task(employee, employee, "Prepare sprint planning notes",
                    "Draft discussion points and blockers for the next sprint kick-off.",
                    TaskStatus.TODO, TaskPriority.MEDIUM, TaskSource.SELF,
                    today.plusDays(3), null),

            // ── Assigned tasks (manager → employee) ───────────────

            // Due tomorrow – high priority, in progress
            task(manager, employee, "Fix login page redirect bug",
                    "Users are not being redirected to their last visited page after OAuth login.",
                    TaskStatus.IN_PROGRESS, TaskPriority.HIGH, TaskSource.ASSIGNED,
                    today.plusDays(1), webRedesign),

            // Upcoming – medium priority
            task(manager, employee, "Write REST API documentation",
                    "Document all v2 endpoints using OpenAPI 3.0 annotations.",
                    TaskStatus.TODO, TaskPriority.MEDIUM, TaskSource.ASSIGNED,
                    today.plusDays(5), mobileApp),

            // Upcoming – high priority
            task(manager, employee, "Set up GitHub Actions CI pipeline",
                    "Configure lint, test and build steps. Add Slack notifications on failure.",
                    TaskStatus.TODO, TaskPriority.HIGH, TaskSource.ASSIGNED,
                    today.plusDays(7), internalTools),

            // In review
            task(manager, employee, "Implement dark mode toggle",
                    "Add a theme switcher to the settings page and persist the preference.",
                    TaskStatus.IN_REVIEW, TaskPriority.MEDIUM, TaskSource.ASSIGNED,
                    today.plusDays(4), webRedesign),

            // Completed – boosts the Done stat card and activity feed
            task(manager, employee, "Conduct design system audit",
                    "Review all UI components for consistency with the new design tokens.",
                    TaskStatus.DONE, TaskPriority.LOW, TaskSource.ASSIGNED,
                    today.minusDays(3), webRedesign),

            // Another completed task
            task(manager, employee, "Migrate user table to new schema",
                    "Run Flyway migration V3 on staging, verify row counts, then promote to prod.",
                    TaskStatus.DONE, TaskPriority.HIGH, TaskSource.ASSIGNED,
                    today.minusDays(1), internalTools)
        ));

        log.info("Seeded 3 projects and 9 tasks for {} (manager) and {} (employee).",
                manager.getName(), employee.getName());
    }

    private Project project(User owner, String name, String description) {
        Project p = new Project();
        p.setOwner(owner);
        p.setName(name);
        p.setDescription(description);
        return p;
    }

    private Task task(User owner, User assignee, String title, String description,
                      TaskStatus status, TaskPriority priority, TaskSource source,
                      LocalDate dueDate, Project project) {
        Task t = new Task();
        t.setOwner(owner);
        t.setAssignee(assignee);
        t.setTitle(title);
        t.setDescription(description);
        t.setStatus(status);
        t.setPriority(priority);
        t.setSource(source);
        t.setDueDate(dueDate);
        t.setProject(project);
        return t;
    }
}
