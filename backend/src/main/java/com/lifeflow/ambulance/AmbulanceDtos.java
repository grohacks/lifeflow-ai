package com.lifeflow.ambulance;

import jakarta.validation.constraints.NotBlank;

public class AmbulanceDtos {

    public static class AmbulanceDto {
        private Long id;
        private String vehicleNumber;
        private String callSign;
        private String model;
        private String status;
        private String baseStation;

        public AmbulanceDto() {}
        public AmbulanceDto(Long id, String vehicleNumber, String callSign, String model, String status, String baseStation) {
            this.id = id;
            this.vehicleNumber = vehicleNumber;
            this.callSign = callSign;
            this.model = model;
            this.status = status;
            this.baseStation = baseStation;
        }

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }

        public String getVehicleNumber() { return vehicleNumber; }
        public void setVehicleNumber(String vehicleNumber) { this.vehicleNumber = vehicleNumber; }

        public String getCallSign() { return callSign; }
        public void setCallSign(String callSign) { this.callSign = callSign; }

        public String getModel() { return model; }
        public void setModel(String model) { this.model = model; }

        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }

        public String getBaseStation() { return baseStation; }
        public void setBaseStation(String baseStation) { this.baseStation = baseStation; }
    }

    public static class CreateAmbulanceRequest {
        @NotBlank(message = "Vehicle number is required")
        private String vehicleNumber;

        @NotBlank(message = "Call sign is required")
        private String callSign;

        private String model;
        private String baseStation;

        public CreateAmbulanceRequest() {}

        public String getVehicleNumber() { return vehicleNumber; }
        public void setVehicleNumber(String vehicleNumber) { this.vehicleNumber = vehicleNumber; }

        public String getCallSign() { return callSign; }
        public void setCallSign(String callSign) { this.callSign = callSign; }

        public String getModel() { return model; }
        public void setModel(String model) { this.model = model; }

        public String getBaseStation() { return baseStation; }
        public void setBaseStation(String baseStation) { this.baseStation = baseStation; }
    }

    public static class UpdateAmbulanceStatusRequest {
        @NotBlank(message = "Status is required")
        private String status;

        public UpdateAmbulanceStatusRequest() {}
        public UpdateAmbulanceStatusRequest(String status) { this.status = status; }

        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
    }
}
