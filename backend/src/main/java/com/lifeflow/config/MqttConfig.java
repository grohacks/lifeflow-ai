package com.lifeflow.config;

import org.eclipse.paho.client.mqttv3.*;
import org.eclipse.paho.client.mqttv3.persist.MemoryPersistence;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class MqttConfig {

    private static final Logger log = LoggerFactory.getLogger(MqttConfig.class);

    @Value("${lifeflow.mqtt.broker-url:tcp://localhost:1883}")
    private String brokerUrl;

    @Value("${lifeflow.mqtt.client-id:lifeflow-backend-core}")
    private String clientId;

    @Bean
    public IMqttClient mqttClient() {
        try {
            MqttClient client = new MqttClient(brokerUrl, clientId, new MemoryPersistence());
            MqttConnectOptions options = new MqttConnectOptions();
            options.setCleanSession(true);
            options.setAutomaticReconnect(true);
            options.setConnectionTimeout(10);
            options.setKeepAliveInterval(60);

            try {
                client.connect(options);
                log.info("Successfully connected to MQTT Broker at {}", brokerUrl);
            } catch (MqttException e) {
                log.warn("MQTT broker at {} not reachable on startup: {}. Operating in offline/degraded mode; client will auto-reconnect once broker is online.", brokerUrl, e.getMessage());
            }

            return client;
        } catch (MqttException e) {
            log.error("Fatal error creating MQTT client instance: {}", e.getMessage());
            return null;
        }
    }
}
