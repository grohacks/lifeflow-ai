package com.lifeflow.routing;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

public class HaversineRouterTest {

    private HaversineRouter router;

    @BeforeEach
    public void setUp() {
        router = new HaversineRouter();
    }

    @Test
    public void testDistanceCalculation() {
        double lat1 = 40.7128;
        double lon1 = -74.0060;
        double lat2 = 40.7306;
        double lon2 = -73.9352;

        double distanceKm = router.calculateDistanceKm(lat1, lon1, lat2, lon2);
        assertTrue(distanceKm > 5.0 && distanceKm < 15.0, "Distance should be approx 6-10 km with detour factor");
    }

    @Test
    public void testEtaCalculationWithDetourAndTraffic() {
        double distanceKm = 10.0;
        double speedKmh = 45.0;
        double trafficMultiplier = 1.5; // Heavy congestion

        int etaSeconds = router.calculateEtaSeconds(distanceKm, speedKmh, trafficMultiplier);
        // (10 / 45) * 3600 * 1.5 = 1200 seconds (20 minutes)
        assertTrue(etaSeconds >= 1150 && etaSeconds <= 1250, "ETA should be ~1200 seconds");
    }

    @Test
    public void testIdenticalCoordinatesZeroDistance() {
        double lat = 37.7749;
        double lon = -122.4194;

        double distance = router.calculateDistanceKm(lat, lon, lat, lon);
        assertEquals(0.0, distance, 0.001);

        int eta = router.calculateEtaSeconds(distance, 45.0, 1.0);
        assertEquals(0, eta);
    }

    @Test
    public void testRouteInterpolation() {
        List<double[]> route = router.generateInterpolatedRoute(37.77, -122.41, 37.79, -122.39, 5);
        assertEquals(6, route.size());
        assertEquals(37.77, route.get(0)[0], 0.001);
        assertEquals(37.79, route.get(5)[0], 0.001);
    }
}
