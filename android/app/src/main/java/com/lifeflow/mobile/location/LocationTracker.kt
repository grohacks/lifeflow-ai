package com.lifeflow.mobile.location

import android.annotation.SuppressLint
import android.content.Context
import android.location.Location
import com.google.android.gms.location.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

data class GpsTelemetry(
    val latitude: Double = 0.0,
    val longitude: Double = 0.0,
    val altitude: Double = 0.0,
    val speedKmh: Float = 0f,
    val bearing: Float = 0f,
    val accuracyMeters: Float = 999f,
    val isTracking: Boolean = false,
    val timestamp: Long = System.currentTimeMillis()
)

class LocationTracker(context: Context) {

    private val fusedLocationClient = LocationServices.getFusedLocationProviderClient(context)
    private val _gpsState = MutableStateFlow(GpsTelemetry())
    val gpsState: StateFlow<GpsTelemetry> = _gpsState

    private val locationCallback = object : LocationCallback() {
        override fun onLocationResult(result: LocationResult) {
            val location: Location = result.lastLocation ?: return
            _gpsState.value = GpsTelemetry(
                latitude = location.latitude,
                longitude = location.longitude,
                altitude = location.altitude,
                speedKmh = location.speed * 3.6f, // convert m/s to km/h
                bearing = location.bearing,
                accuracyMeters = location.accuracy,
                isTracking = true,
                timestamp = location.time
            )
        }
    }

    @SuppressLint("MissingPermission")
    fun startTracking() {
        val locationRequest = LocationRequest.Builder(
            Priority.PRIORITY_HIGH_ACCURACY, 1000L
        ).setMinUpdateIntervalMillis(500L).build()

        try {
            fusedLocationClient.requestLocationUpdates(
                locationRequest,
                locationCallback,
                null
            )
        } catch (e: SecurityException) {
            _gpsState.value = _gpsState.value.copy(isTracking = false)
        }
    }

    fun stopTracking() {
        fusedLocationClient.removeLocationUpdates(locationCallback)
        _gpsState.value = _gpsState.value.copy(isTracking = false)
    }
}
