package com.hotelio.booking.history.booking_history.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "booking_history")
public class BookingHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String eventType;
    private Long bookingId;
    private String userId;
    private String hotelId;
    private String promoCode;
    private Double discountPercent;
    @Column(nullable = false)
    private Double price;
    private Instant createdAt;
}

