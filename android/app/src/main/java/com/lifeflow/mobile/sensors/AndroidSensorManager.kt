package com.lifeflow.mobile.sensors

import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlin.math.sqrt

enum class SensorAvailability {
    AVAILABLE,
    NOT_AVAILABLE,
    DISABLED,
    ERROR
}

data class MotionTelemetry(
    val accelX: Float = 0f,
    val accelY: Float = 0f,
    val accelZ: Float = 0f,
    val totalMagnitude: Float = 9.8f,
    val gyroX: Float = 0f,
    val gyroY: Float = 0f,
    val gyroZ: Float = 0f,
    val motionState: String = "STATIONARY", // STATIONARY, MOVING, HIGH_ACCELERATION_BRAKING
    val accelStatus: SensorAvailability = SensorAvailability.AVAILABLE,
    val gyroStatus: SensorAvailability = SensorAvailability.AVAILABLE,
    val timestamp: Long = System.currentTimeMillis()
)

class AndroidSensorManager(context: Context) : SensorEventListener {

    private val sensorManager = context.getSystemService(Context.SENSOR_SERVICE) as SensorManager
    private val accelerometer = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)
    private val gyroscope = sensorManager.getDefaultSensor(Sensor.TYPE_GYROSCOPE)

    private val _motionState = MutableStateFlow(MotionTelemetry())
    val motionState: StateFlow<MotionTelemetry> = _motionState

    fun startListening() {
        val accelAvailable = if (accelerometer != null) {
            sensorManager.registerListener(this, accelerometer, SensorManager.SENSOR_DELAY_NORMAL)
            SensorAvailability.AVAILABLE
        } else {
            SensorAvailability.NOT_AVAILABLE
        }

        val gyroAvailable = if (gyroscope != null) {
            sensorManager.registerListener(this, gyroscope, SensorManager.SENSOR_DELAY_NORMAL)
            SensorAvailability.AVAILABLE
        } else {
            SensorAvailability.NOT_AVAILABLE
        }

        _motionState.value = _motionState.value.copy(
            accelStatus = accelAvailable,
            gyroStatus = gyroAvailable
        )
    }

    fun stopListening() {
        sensorManager.unregisterListener(this)
    }

    override fun onSensorChanged(event: SensorEvent) {
        val current = _motionState.value
        when (event.sensor.type) {
            Sensor.TYPE_ACCELEROMETER -> {
                val x = event.values[0]
                val y = event.values[1]
                val z = event.values[2]
                val mag = sqrt((x * x + y * y + z * z).toDouble()).toFloat()

                val state = when {
                    mag > 15.0f -> "HIGH_ACCELERATION_BRAKING"
                    mag > 10.5f || mag < 8.5f -> "MOVING"
                    else -> "STATIONARY"
                }

                _motionState.value = current.copy(
                    accelX = x,
                    accelY = y,
                    accelZ = z,
                    totalMagnitude = mag,
                    motionState = state,
                    timestamp = System.currentTimeMillis()
                )
            }
            Sensor.TYPE_GYROSCOPE -> {
                _motionState.value = current.copy(
                    gyroX = event.values[0],
                    gyroY = event.values[1],
                    gyroZ = event.values[2],
                    timestamp = System.currentTimeMillis()
                )
            }
        }
    }

    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {
        // Track accuracy changes
    }
}
