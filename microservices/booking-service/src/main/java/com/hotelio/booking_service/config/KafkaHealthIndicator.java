package com.hotelio.booking_service.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.admin.AdminClient;
import org.apache.kafka.clients.admin.DescribeClusterOptions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;

import java.util.Properties;
import java.util.concurrent.TimeUnit;

@Component
@Slf4j
@RequiredArgsConstructor
public class KafkaHealthIndicator implements HealthIndicator {
    @Value("${spring.kafka.bootstrap-servers}")
    private String bootstrapServers;

    @Override
    public Health health() {
        Properties props = new Properties();
        props.put("bootstrap.servers", bootstrapServers);
        props.put("request.timeout.ms", 5000);

        try (AdminClient admin = AdminClient.create(props)) {
            admin.describeCluster(new DescribeClusterOptions().timeoutMs(5000))
                    .clusterId()
                    .get(10, TimeUnit.SECONDS);
            return Health.up().withDetail("bootstrapServers", bootstrapServers).build();
        } catch (Exception e) {
            log.warn("Kafka health check failed: {}", e.getMessage());
            return Health.down(e).withDetail("bootstrapServers", bootstrapServers).build();
        }
    }
}
