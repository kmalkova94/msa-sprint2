package com.hotelio.booking_service.config;

import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.admin.AdminClient;
import org.apache.kafka.clients.admin.ListTopicsOptions;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Properties;
import java.util.concurrent.TimeUnit;

@Slf4j
@Component
public class KafkaStartupListener implements ApplicationListener<ApplicationReadyEvent> {
    @Value("${spring.kafka.bootstrap-servers}")
    private String bootstrapServers;

    @Override
    public void onApplicationEvent(ApplicationReadyEvent event) {
        log.info("Checking Kafka connectivity...");

        Properties props = new Properties();
        props.put("bootstrap.servers", bootstrapServers);
        props.put("request.timeout.ms", 10000);

        int maxAttempts = 30;
        int attempt = 0;

        while (attempt < maxAttempts) {
            try (AdminClient admin = AdminClient.create(props)) {
                admin.listTopics(new ListTopicsOptions().timeoutMs(5000))
                        .names()
                        .get(10, TimeUnit.SECONDS);
                log.info("✅ Successfully connected to Kafka at {}", bootstrapServers);
                return;
            } catch (Exception e) {
                attempt++;
                log.warn("Attempt {}/{}: Kafka not ready yet: {}", attempt, maxAttempts, e.getMessage());
                try {
                    Thread.sleep(2000);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                }
            }
        }

        log.error("Failed to connect to Kafka after {} attempts", maxAttempts);
    }
}
