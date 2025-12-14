package com.hotelio.booking_service.repository;

import com.hotelio.booking_service.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BookingDAO extends JpaRepository<Booking, Long> {
    List<Booking> findByUserId(String userId);
}
