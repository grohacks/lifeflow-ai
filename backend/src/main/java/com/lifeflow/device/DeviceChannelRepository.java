package com.lifeflow.device;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DeviceChannelRepository extends JpaRepository<DeviceChannel, Long> {
    List<DeviceChannel> findByDeviceId(Long deviceId);
    Optional<DeviceChannel> findByDeviceIdAndMetricKey(Long deviceId, String metricKey);
}
