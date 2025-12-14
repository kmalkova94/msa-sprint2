package com.hotelio.booking.history.booking_history.service;

import com.hotelio.booking.history.booking_history.entity.BookingHistory;
import com.hotelio.booking.history.booking_history.kafka.BookingCreatedEvent;
import com.hotelio.booking.history.booking_history.repository.BookingHistoryDAO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;


@Component
@RequiredArgsConstructor
@Slf4j
public class BookingHistoryListener {
    private final BookingHistoryDAO bookingHistoryDAO;
    @KafkaListener(topics = "${kafka.topics.booking-events}", groupId = "${spring.kafka.consumer.group-id}")
    public void listen(BookingCreatedEvent bookingCreatedEvent) {
        try {
            log.info("Received JSON message: {}", bookingCreatedEvent.toString());
            val bookingHistory = BookingHistory.builder()
                    .bookingId(bookingCreatedEvent.getBookingId())
                    .hotelId(bookingCreatedEvent.getHotelId())
                    .userId(bookingCreatedEvent.getUserId())
                    .promoCode(bookingCreatedEvent.getPromoCode())
                    .discountPercent(bookingCreatedEvent.getDiscountPercent())
                    .price(bookingCreatedEvent.getPrice())
                    .createdAt(bookingCreatedEvent.getCreatedAt())
                    .build();
            bookingHistoryDAO.save(bookingHistory);
        } catch (Exception e) {
            log.error("Failed to process booking event: {}", bookingCreatedEvent, e);
            throw e;
        }

    }
}
