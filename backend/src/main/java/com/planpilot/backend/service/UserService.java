package com.planpilot.backend.service;

import com.planpilot.backend.dto.RegisterRequest;
import com.planpilot.backend.dto.UserResponse;
import com.planpilot.backend.model.Role;
import com.planpilot.backend.model.User;
import com.planpilot.backend.repository.UserRepository;
import com.planpilot.backend.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public List<UserResponse> getAllEmployees(String callerEmail) {
        requireRole(callerEmail, Role.MANAGER);
        return userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.EMPLOYEE)
                .map(UserResponse::from)
                .toList();
    }

    public UserResponse addMember(String callerEmail, RegisterRequest req) {
        requireRole(callerEmail, Role.MANAGER);

        if (userRepository.existsByEmail(req.getEmail())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already in use");
        }

        User user = new User();
        user.setName(req.getName());
        user.setEmail(req.getEmail());
        user.setPasswordHash(passwordEncoder.encode(req.getPassword()));
        user.setRole(req.getRole() != null ? req.getRole() : Role.EMPLOYEE);

        return UserResponse.from(userRepository.save(user));
    }

    private void requireRole(String email, Role required) {
        User caller = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        if (caller.getRole() != required) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "This action requires the " + required + " role");
        }
    }
}
