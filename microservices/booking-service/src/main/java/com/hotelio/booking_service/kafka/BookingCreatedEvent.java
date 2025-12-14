package com.hotelio.booking_service.kafka;


import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@Builder
public class BookingCreatedEvent {
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
