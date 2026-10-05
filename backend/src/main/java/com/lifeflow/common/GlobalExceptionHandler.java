package com.lifeflow.common;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleResourceNotFound(ResourceNotFoundException ex, HttpServletRequest request) {
        String correlationId = CorrelationIdFilter.getCorrelationId(request);
        log.warn("[{}] Resource not found: {}", correlationId, ex.getMessage());
        return buildResponse(HttpStatus.NOT_FOUND, "Not Found", ex.getMessage(), request.getRequestURI(), correlationId);
    }

    @ExceptionHandler(ValidationException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(ValidationException ex, HttpServletRequest request) {
        String correlationId = CorrelationIdFilter.getCorrelationId(request);
        log.warn("[{}] Validation error: {}", correlationId, ex.getMessage());
        return buildResponse(HttpStatus.BAD_REQUEST, "Validation Error", ex.getMessage(), request.getRequestURI(), correlationId);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleMethodArgumentNotValid(MethodArgumentNotValidException ex, HttpServletRequest request) {
        String correlationId = CorrelationIdFilter.getCorrelationId(request);
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(err -> err.getField() + ": " + err.getDefaultMessage())
                .reduce((a, b) -> a + "; " + b)
                .orElse("Validation failed");
        log.warn("[{}] Method argument invalid: {}", correlationId, message);
        return buildResponse(HttpStatus.BAD_REQUEST, "Invalid Request Arguments", message, request.getRequestURI(), correlationId);
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Map<String, Object>> handleBadCredentials(BadCredentialsException ex, HttpServletRequest request) {
        String correlationId = CorrelationIdFilter.getCorrelationId(request);
        log.warn("[{}] Authentication failure: {}", correlationId, ex.getMessage());
        return buildResponse(HttpStatus.UNAUTHORIZED, "Unauthorized", "Invalid username or password", request.getRequestURI(), correlationId);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleAccessDenied(AccessDeniedException ex, HttpServletRequest request) {
        String correlationId = CorrelationIdFilter.getCorrelationId(request);
        log.warn("[{}] Access denied: {}", correlationId, ex.getMessage());
        return buildResponse(HttpStatus.FORBIDDEN, "Forbidden", "You do not have permission to access this resource", request.getRequestURI(), correlationId);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGenericException(Exception ex, HttpServletRequest request) {
        String correlationId = CorrelationIdFilter.getCorrelationId(request);
        log.error("[{}] Internal server error on {}: {}", correlationId, request.getRequestURI(), ex.getMessage(), ex);
        return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, "Internal Server Error", "An unexpected system error occurred. Please contact support.", request.getRequestURI(), correlationId);
    }

    private ResponseEntity<Map<String, Object>> buildResponse(HttpStatus status, String error, String message, String path, String correlationId) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", Instant.now().toString());
        body.put("status", status.value());
        body.put("error", error);
        body.put("message", message);
        body.put("path", path);
        body.put("correlationId", correlationId);
        return ResponseEntity.status(status).body(body);
    }
}
