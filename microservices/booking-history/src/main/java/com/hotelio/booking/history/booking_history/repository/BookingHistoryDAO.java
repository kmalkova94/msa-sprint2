package com.hotelio.booking.history.booking_history.repository;

import com.hotelio.booking.history.booking_history.entity.BookingHistory;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BookingHistoryDAO extends JpaRepository<BookingHistory, Long> {
}
