package com.lifeflow.routing;

import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class HaversineRouter {

    private static final double EARTH_RADIUS_KM = 6371.0;
    private static final double DEFAULT_URBAN_SPEED_KMH = 45.0; // Emergency vehicle average response speed

    public double calculateDistanceKm(double lat1, double lon1, double lat2, double lon2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);

        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                        Math.sin(dLon / 2) * Math.sin(dLon / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        // Multiply by 1.25 urban road detour factor to account for grid-based turns
        return Math.round((EARTH_RADIUS_KM * c * 1.25) * 100.0) / 100.0;
    }

    public int calculateEtaSeconds(double distanceKm, double speedKmh, double trafficMultiplier) {
        double effectiveSpeed = (speedKmh > 5.0) ? speedKmh : DEFAULT_URBAN_SPEED_KMH;
        double hours = distanceKm / effectiveSpeed;
        double totalSeconds = hours * 3600.0 * Math.max(1.0, trafficMultiplier);
        return (int) Math.round(totalSeconds);
    }

    public List<double[]> generateInterpolatedRoute(double lat1, double lon1, double lat2, double lon2, int steps) {
        List<double[]> points = new ArrayList<>();
        for (int i = 0; i <= steps; i++) {
            double fraction = (double) i / steps;
            double lat = lat1 + (lat2 - lat1) * fraction;
            double lon = lon1 + (lon2 - lon1) * fraction;
            points.add(new double[]{lat, lon});
        }
        return points;
    }
}
