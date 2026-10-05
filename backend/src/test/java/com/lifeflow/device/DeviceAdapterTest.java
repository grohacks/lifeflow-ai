package com.lifeflow.device;

import com.lifeflow.device.adapters.SimulatedMedicalDeviceAdapters;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

public class DeviceAdapterTest {

    @Test
    public void testSimulatedTemperatureAdapter() {
        SimulatedMedicalDeviceAdapters.SimulatedTemperatureAdapter adapter =
                new SimulatedMedicalDeviceAdapters.SimulatedTemperatureAdapter();

        assertEquals("DEV-TEMP-001", adapter.getDeviceUid());
        assertEquals("TEMPERATURE", adapter.getDeviceType());
        assertEquals("CONNECTED", adapter.getStatus());

        List<DeviceDtos.ObservationEventDto> obsList = adapter.generateObservations("CASE-001", 1L, "CORR-01");
        assertNotNull(obsList);
        assertEquals(1, obsList.size());

        DeviceDtos.ObservationEventDto obs = obsList.get(0);
        assertEquals("TEMPERATURE", obs.getMetric());
        assertEquals("°C", obs.getUnit());
        assertEquals(37.1, obs.getValue(), 0.1);
        assertEquals("GOOD", obs.getQuality());
    }

    @Test
    public void testSimulatedBPAdapterCalculatesMAP() {
        SimulatedMedicalDeviceAdapters.SimulatedBPAdapter adapter =
                new SimulatedMedicalDeviceAdapters.SimulatedBPAdapter();

        List<DeviceDtos.ObservationEventDto> obsList = adapter.generateObservations("CASE-001", 2L, "CORR-02");
        assertEquals(3, obsList.size());

        boolean foundSys = obsList.stream().anyMatch(o -> "SYSTOLIC_BP".equals(o.getMetric()) && o.getValue() == 110.0);
        boolean foundDia = obsList.stream().anyMatch(o -> "DIASTOLIC_BP".equals(o.getMetric()) && o.getValue() == 70.0);
        boolean foundMap = obsList.stream().anyMatch(o -> "MAP".equals(o.getMetric()) && o.getValue() > 80.0 && o.getValue() < 85.0);

        assertTrue(foundSys);
        assertTrue(foundDia);
        assertTrue(foundMap);
    }

    @Test
    public void testSimulatedVentilatorAdapterMultiChannel() {
        SimulatedMedicalDeviceAdapters.SimulatedVentilatorAdapter adapter =
                new SimulatedMedicalDeviceAdapters.SimulatedVentilatorAdapter();

        List<DeviceDtos.ObservationEventDto> obsList = adapter.generateObservations("CASE-001", 3L, "CORR-03");
        assertEquals(3, obsList.size());

        assertTrue(obsList.stream().anyMatch(o -> "VENT_FIO2".equals(o.getMetric()) && o.getValue() == 40.0));
        assertTrue(obsList.stream().anyMatch(o -> "VENT_PEEP".equals(o.getMetric()) && o.getValue() == 5.0));
        assertTrue(obsList.stream().anyMatch(o -> "VENT_TIDAL_VOLUME".equals(o.getMetric()) && o.getValue() == 450.0));
    }
}
