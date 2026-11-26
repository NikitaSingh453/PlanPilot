package com.planpilot.backend.repository;

import com.planpilot.backend.model.TimeLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface TimeLogRepository extends JpaRepository<TimeLog, Long> {

    List<TimeLog> findByUserIdAndDateBetweenOrderByDateDescCreatedAtDesc(
            Long userId, LocalDate from, LocalDate to);

    @Query("SELECT COALESCE(SUM(t.hours), 0) FROM TimeLog t WHERE t.user.id = :userId AND t.date BETWEEN :from AND :to")
    double sumHoursByUserAndDateRange(@Param("userId") Long userId,
                                     @Param("from") LocalDate from,
                                     @Param("to") LocalDate to);
}
