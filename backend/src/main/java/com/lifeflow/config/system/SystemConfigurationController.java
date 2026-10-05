package com.lifeflow.config.system;

import com.lifeflow.common.ApiResponse;
import com.lifeflow.common.CorrelationIdFilter;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/configurations")
public class SystemConfigurationController {

    private final SystemConfigurationService configurationService;

    public SystemConfigurationController(SystemConfigurationService configurationService) {
        this.configurationService = configurationService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<SystemConfiguration>>> getAllConfigurations(HttpServletRequest request) {
        String correlationId = CorrelationIdFilter.getCorrelationId(request);
        List<SystemConfiguration> configs = configurationService.getAllConfigurations();
        return ResponseEntity.ok(ApiResponse.ok(configs, correlationId));
    }

    public static class UpdateConfigRequest {
        public String value;
        public String updatedBy;
    }

    @PatchMapping("/{key}")
    public ResponseEntity<ApiResponse<SystemConfiguration>> updateConfiguration(
            @PathVariable String key,
            @RequestBody UpdateConfigRequest req,
            HttpServletRequest request) {
        String correlationId = CorrelationIdFilter.getCorrelationId(request);
        SystemConfiguration updated = configurationService.updateConfiguration(key, req.value, req.updatedBy);
        return ResponseEntity.ok(ApiResponse.ok("Configuration updated", updated, correlationId));
    }
}
