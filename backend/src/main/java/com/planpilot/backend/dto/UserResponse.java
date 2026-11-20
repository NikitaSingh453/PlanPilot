package com.planpilot.backend.dto;

import com.planpilot.backend.model.Role;
import com.planpilot.backend.model.User;
import lombok.Data;

@Data
public class UserResponse {
    private Long id;
    private String name;
    private String email;
    private Role role;

    public static UserResponse from(User u) {
        UserResponse r = new UserResponse();
        r.setId(u.getId());
        r.setName(u.getName());
        r.setEmail(u.getEmail());
        r.setRole(u.getRole());
        return r;
    }
}
