package com.lifeflow.common;

import java.time.Instant;

public class ApiResponse<T> {
    private boolean success;
    private String message;
    private T data;
    private String correlationId;
    private Instant timestamp;

    public ApiResponse() {
        this.timestamp = Instant.now();
    }

    public ApiResponse(boolean success, String message, T data, String correlationId) {
        this.success = success;
        this.message = message;
        this.data = data;
        this.correlationId = correlationId;
        this.timestamp = Instant.now();
    }

    public static <T> ApiResponse<T> ok(T data, String correlationId) {
        return new ApiResponse<>(true, "Success", data, correlationId);
    }

    public static <T> ApiResponse<T> ok(String message, T data, String correlationId) {
        return new ApiResponse<>(true, message, data, correlationId);
    }

    public static <T> ApiResponse<T> error(String message, String correlationId) {
        return new ApiResponse<>(false, message, null, correlationId);
    }

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public T getData() { return data; }
    public void setData(T data) { this.data = data; }

    public String getCorrelationId() { return correlationId; }
    public void setCorrelationId(String correlationId) { this.correlationId = correlationId; }

    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }
}
