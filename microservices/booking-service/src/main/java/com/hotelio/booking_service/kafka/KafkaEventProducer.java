package com.hotelio.booking_service.kafka;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;

@Service
@RequiredArgsConstructor
public class KafkaEventProducer {
    private static final Logger log = LoggerFactory.getLogger(KafkaEventProducer.class);
    private final KafkaTemplate<String, Object> kafkaTemplate;
    @Value("${kafka.topics.booking-events}")
    private String bookingEventsTopic;

    public void sendBookingCreatedEvent(Object event) {
        sendEvent(bookingEventsTopic, "booking-key", event);
    }

    private void sendEvent(String topic, String key, Object event) {
        try {
            CompletableFuture<SendResult<String, Object>> future = kafkaTemplate.send(topic, key, event);
            future.whenComplete((result, throwable) -> {
                if(throwable == null) {
                    log.info("Sent event to topic {}: {}", topic, result.getProducerRecord().value());
                } else {
                    log.error("Failed to send event to topic {}: {}", topic, throwable.getLocalizedMessage());
                }
            });
        } catch (Exception e) {
            log.error("Error sending event to topic {}: {}", topic, e.getLocalizedMessage());
        }

    }
}
