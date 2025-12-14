package com.hotelio.booking_service.service;

import com.hotelio.booking_service.entity.Booking;
import com.hotelio.booking_service.kafka.BookingCreatedEvent;
import com.hotelio.booking_service.kafka.KafkaEventProducer;
import com.hotelio.booking_service.repository.BookingDAO;
import com.hotelio.proto.booking.*;
import io.grpc.stub.StreamObserver;
import io.micrometer.common.util.StringUtils;
import lombok.RequiredArgsConstructor;
import lombok.val;
import net.devh.boot.grpc.server.service.GrpcService;
import org.springframework.util.CollectionUtils;

import java.time.Instant;
import java.util.List;
import java.util.Random;
import java.util.UUID;

@GrpcService
@RequiredArgsConstructor
public class BookingGrpcServiceImpl extends BookingServiceGrpc.BookingServiceImplBase {
    private final BookingDAO bookingDAO;
    private final KafkaEventProducer kafkaEventProducer;
    @Override
    public void createBooking(BookingRequest request, StreamObserver<BookingResponse> responseObserver) {
        System.out.println("Получен запрос на создание бронирования");
        System.out.println("Used Id: " + request.getUserId());
        System.out.println("Hotel Id: " + request.getHotelId());
        System.out.println("Promo code: " + request.getPromoCode());

        val booking = Booking.builder()
                //.id(new Random().nextLong())
                .hotelId(request.getHotelId())
                .userId(request.getUserId())
                .promoCode(request.getPromoCode())
                .createdAt(Instant.now())
                .price(new Random().nextDouble())
                .build();

        val event = BookingCreatedEvent.builder()
                .eventId(UUID.randomUUID().toString())
                .bookingId(booking.getId())
                .hotelId(booking.getHotelId())
                .userId(booking.getUserId())
                .createdAt(booking.getCreatedAt())
                .promoCode(booking.getPromoCode()).build();

        bookingDAO.save(booking);
        kafkaEventProducer.sendBookingCreatedEvent(event);

        BookingResponse response = BookingResponse.newBuilder()
                .setId(booking.getId().toString())
                .setHotelId(booking.getHotelId())
                .setUserId(booking.getUserId())
                .setPromoCode(booking.getPromoCode())
                .setCreatedAt(String.valueOf(booking.getCreatedAt()))
                .build();
        responseObserver.onNext(response);
        responseObserver.onCompleted();
    }

    @Override
    public void listBookings(BookingListRequest request, StreamObserver<BookingListResponse> responseObserver) {
        System.out.println("Получен запрос на вывод бронирований");
        System.out.println("Used Id: " + request.getUserId());
        val bookings = StringUtils.isNotEmpty(request.getUserId()) ? bookingDAO.findByUserId(request.getUserId()) : bookingDAO.findAll();
        List<BookingResponse> bookingResponses = List.of();
        if(!CollectionUtils.isEmpty(bookings)) {
            bookingResponses = bookings.stream()
                    .map(booking -> BookingResponse.newBuilder()
                            .setId(booking.getId().toString())
                            .setHotelId(booking.getHotelId())
                            .setUserId(booking.getUserId())
                            .setPromoCode(booking.getPromoCode())
                            .setCreatedAt(String.valueOf(booking.getCreatedAt()))
                            .build())
                    .toList();
        }
        val result = BookingListResponse.newBuilder().addAllBookings(bookingResponses).build();
        responseObserver.onNext(result);
        responseObserver.onCompleted();
    }
}
