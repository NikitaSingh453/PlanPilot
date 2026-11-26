package com.planpilot.backend.service;

import com.planpilot.backend.dto.NotificationResponse;
import com.planpilot.backend.model.Notification;
import com.planpilot.backend.model.User;
import com.planpilot.backend.repository.NotificationRepository;
import com.planpilot.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository         userRepository;

    public void create(User recipient, String message, String link) {
        Notification n = new Notification();
        n.setRecipient(recipient);
        n.setMessage(message);
        n.setLink(link);
        notificationRepository.save(n);
    }

    public List<NotificationResponse> getForUser(String callerEmail) {
        User user = getUser(callerEmail);
        return notificationRepository
                .findByRecipientIdOrderByCreatedAtDesc(user.getId())
                .stream().map(NotificationResponse::from).toList();
    }

    public Map<String, Object> getSummary(String callerEmail) {
        User user  = getUser(callerEmail);
        long unread = notificationRepository.countByRecipientIdAndReadFalse(user.getId());
        List<NotificationResponse> items = notificationRepository
                .findByRecipientIdOrderByCreatedAtDesc(user.getId())
                .stream().map(NotificationResponse::from).toList();
        return Map.of("unread", unread, "items", items);
    }

    public void markAllRead(String callerEmail) {
        User user = getUser(callerEmail);
        notificationRepository.markAllReadByRecipientId(user.getId());
    }

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
    }
}
