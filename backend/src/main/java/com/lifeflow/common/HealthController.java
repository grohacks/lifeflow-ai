package com.lifeflow.common;

import org.eclipse.paho.client.mqttv3.IMqttClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.connection.RedisConnection;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class HealthController {

    private final JdbcTemplate jdbcTemplate;

    @Autowired(required = false)
    private RedisConnectionFactory redisConnectionFactory;

    @Autowired(required = false)
    private IMqttClient mqttClient;

    @Value("${lifeflow.ai-service.url:http://localhost:8000}")
    private String aiServiceUrl;

    @Value("${lifeflow.edge-gateway.url:http://localhost:8081}")
    private String edgeGatewayUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    public HealthController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> getHealth() {
        Map<String, Object> health = new HashMap<>();
        health.put("status", "UP");
        health.put("timestamp", Instant.now().toString());

        Map<String, String> components = new HashMap<>();

        // MySQL Check
        try {
            jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            components.put("mysql", "UP");
        } catch (Exception e) {
            components.put("mysql", "DOWN: " + e.getMessage());
        }

        // Redis Check
        try {
            if (redisConnectionFactory != null) {
                RedisConnection conn = redisConnectionFactory.getConnection();
                conn.ping();
                conn.close();
                components.put("redis", "UP");
            } else {
                components.put("redis", "DEGRADED (Disabled/Not Connected)");
            }
        } catch (Exception e) {
            components.put("redis", "DEGRADED: " + e.getMessage());
        }

        // MQTT Check
        try {
            if (mqttClient != null && mqttClient.isConnected()) {
                components.put("mqtt", "UP");
            } else {
                components.put("mqtt", "DEGRADED (Auto-reconnecting)");
            }
        } catch (Exception e) {
            components.put("mqtt", "DOWN: " + e.getMessage());
        }

        // AI Service Check
        try {
            ResponseEntity<String> res = restTemplate.getForEntity(aiServiceUrl + "/health", String.class);
            components.put("aiService", res.getStatusCode().is2xxSuccessful() ? "UP" : "DEGRADED");
        } catch (Exception e) {
            components.put("aiService", "OFFLINE (Local fallback active)");
        }

        // Edge Gateway Check
        try {
            ResponseEntity<String> res = restTemplate.getForEntity(edgeGatewayUrl + "/health", String.class);
            components.put("edgeGateway", res.getStatusCode().is2xxSuccessful() ? "UP" : "DEGRADED");
        } catch (Exception e) {
            components.put("edgeGateway", "OFFLINE (Direct simulation active)");
        }

        components.put("websocket", "UP");
        health.put("components", components);

        return ResponseEntity.ok(health);
    }

    @GetMapping("/ready")
    public ResponseEntity<Map<String, Object>> getReady() {
        Map<String, Object> ready = new HashMap<>();
        ready.put("ready", true);
        ready.put("timestamp", Instant.now().toString());
        return ResponseEntity.ok(ready);
    }

    @GetMapping("/health/network-info")
    public ResponseEntity<Map<String, Object>> getNetworkInfo() {
        Map<String, Object> info = new HashMap<>();
        String lanIp = "127.0.0.1";
        try (java.net.DatagramSocket socket = new java.net.DatagramSocket()) {
            socket.connect(java.net.InetAddress.getByName("8.8.8.8"), 10002);
            lanIp = socket.getLocalAddress().getHostAddress();
        } catch (Exception e) {
            try {
                java.util.Enumeration<java.net.NetworkInterface> interfaces = java.net.NetworkInterface.getNetworkInterfaces();
                while (interfaces.hasMoreElements()) {
                    java.net.NetworkInterface iface = interfaces.nextElement();
                    String name = iface.getName().toLowerCase();
                    String dName = iface.getDisplayName().toLowerCase();
                    if (iface.isLoopback() || !iface.isUp() || name.contains("virtual") || dName.contains("virtual") || dName.contains("vbox") || dName.contains("vmware")) continue;
                    java.util.Enumeration<java.net.InetAddress> addresses = iface.getInetAddresses();
                    while (addresses.hasMoreElements()) {
                        java.net.InetAddress addr = addresses.nextElement();
                        if (addr instanceof java.net.Inet4Address && !addr.isLoopbackAddress() && !addr.isLinkLocalAddress()) {
                            lanIp = addr.getHostAddress();
                            break;
                        }
                    }
                    if (!"127.0.0.1".equals(lanIp)) break;
                }
            } catch (Exception ignored) {}
        }

        info.put("lanIp", lanIp);
        info.put("frontendPort", 5173);
        info.put("backendPort", 8080);
        return ResponseEntity.ok(info);
    }
}
