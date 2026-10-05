package com.lifeflow.mobile.data.db

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "sensor_events")
data class SensorEventEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val eventId: String,
    val deviceId: String,
    val sensorType: String, // ACCELEROMETER, GYROSCOPE, ORIENTATION, MOTION_STATE
    val x: Float,
    val y: Float,
    val z: Float,
    val magnitude: Float,
    val timestamp: Long,
    val isSynced: Boolean = false
)

@Entity(tableName = "gps_events")
data class GpsEventEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val eventId: String,
    val deviceId: String,
    val latitude: Double,
    val longitude: Double,
    val altitude: Double,
    val speedKmh: Float,
    val bearing: Float,
    val accuracyMeters: Float,
    val timestamp: Long,
    val isSynced: Boolean = false
)

@Entity(tableName = "sync_queue")
data class SyncQueueEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val queueId: String,
    val topic: String,
    val payloadJson: String,
    val sequenceNumber: Long,
    val retryCount: Int = 0,
    val status: String = "QUEUED", // QUEUED, IN_FLIGHT, SYNCED, FAILED
    val createdAt: Long = System.currentTimeMillis()
)
