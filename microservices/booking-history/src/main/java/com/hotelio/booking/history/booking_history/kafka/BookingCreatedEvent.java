package com.hotelio.booking.history.booking_history.kafka;


import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.time.Instant;

@Getter
@Setter
@Builder
@ToString
@JsonIgnoreProperties(ignoreUnknown = true)
public class BookingCreatedEvent {
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private String eventId;
    @Builder.Default
    private String eventType = "BOOKING_CREATED";
    private Long bookingId;
    private String userId;
    private String hotelId;
    private String promoCode;
    private Double discountPercent;
    private Double price;
    private Instant createdAt;
}
