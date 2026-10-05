package com.lifeflow.mobile.mqtt

import android.content.Context
import android.util.Log
import com.google.gson.Gson
import com.lifeflow.mobile.LifeFlowApplication
import com.lifeflow.mobile.data.db.SyncQueueEntity
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import org.eclipse.paho.client.mqttv3.*
import org.eclipse.paho.client.mqttv3.persist.MemoryPersistence
import java.util.UUID

class MqttGatewayPublisher(
    private val context: Context,
    private val brokerUri: String = "tcp://10.0.2.2:1883", // 10.0.2.2 maps to host machine in Android Emulator
    private val deviceId: String = "PHONE-GW-01"
) {

    private val gson = Gson()
    private val coroutineScope = CoroutineScope(Dispatchers.IO)
    private var mqttClient: MqttAsyncClient? = null
    private var isConnected = false
    private var sequenceNumber = 1L

    fun connect() {
        try {
            mqttClient = MqttAsyncClient(brokerUri, "LifeFlowMobile-$deviceId", MemoryPersistence())
            val options = MqttConnectOptions().apply {
                isAutomaticReconnect = true
                isCleanSession = true
                connectionTimeout = 10
            }

            mqttClient?.connect(options, null, object : IMqttActionListener {
                override fun onSuccess(asyncActionToken: IMqttToken?) {
                    isConnected = true
                    Log.i("LifeFlowMqtt", "Connected to local MQTT broker: $brokerUri")
                    drainOfflineQueue()
                }

                override fun onFailure(asyncActionToken: IMqttToken?, exception: Throwable?) {
                    isConnected = false
                    Log.w("LifeFlowMqtt", "MQTT broker connection failed; switching to offline Room queue: ${exception?.message}")
                }
            })
        } catch (e: Exception) {
            isConnected = false
            Log.e("LifeFlowMqtt", "Error initializing MQTT client", e)
        }
    }

    fun publishGps(latitude: Double, longitude: Double, speedKmh: Float, bearing: Float, accuracy: Float) {
        val topic = "lifeflow/mobile/$deviceId/gps"
        val payload = mapOf(
            "eventId" to UUID.randomUUID().toString(),
            "deviceId" to deviceId,
            "deviceType" to "ANDROID_SMARTPHONE",
            "observationType" to "GPS_COORDINATES",
            "latitude" to latitude,
            "longitude" to longitude,
            "speedKmh" to speedKmh,
            "bearing" to bearing,
            "accuracyMeters" to accuracy,
            "provenance" to "HARDWARE_FUSED_LOCATION_PROVIDER",
            "sequenceNumber" to sequenceNumber++,
            "timestamp" to System.currentTimeMillis()
        )
        dispatchOrQueue(topic, payload)
    }

    fun publishMotion(accelX: Float, accelY: Float, accelZ: Float, magnitude: Float, state: String) {
        val topic = "lifeflow/mobile/$deviceId/motion"
        val payload = mapOf(
            "eventId" to UUID.randomUUID().toString(),
            "deviceId" to deviceId,
            "deviceType" to "ANDROID_SMARTPHONE",
            "observationType" to "MOTION_TELEMETRY",
            "accelX" to accelX,
            "accelY" to accelY,
            "accelZ" to accelZ,
            "totalMagnitude" to magnitude,
            "motionState" to state,
            "provenance" to "HARDWARE_IMU_ACCELEROMETER",
            "sequenceNumber" to sequenceNumber++,
            "timestamp" to System.currentTimeMillis()
        )
        dispatchOrQueue(topic, payload)
    }

    fun publishDeviceState(batteryPct: Int, isCharging: Boolean, networkType: String) {
        val topic = "lifeflow/mobile/$deviceId/device"
        val payload = mapOf(
            "eventId" to UUID.randomUUID().toString(),
            "deviceId" to deviceId,
            "batteryPct" to batteryPct,
            "isCharging" to isCharging,
            "networkType" to networkType,
            "sequenceNumber" to sequenceNumber++,
            "timestamp" to System.currentTimeMillis()
        )
        dispatchOrQueue(topic, payload)
    }

    private fun dispatchOrQueue(topic: String, payload: Map<String, Any>) {
        val jsonStr = gson.toJson(payload)
        if (isConnected && mqttClient?.isConnected == true) {
            try {
                val message = MqttMessage(jsonStr.toByteArray(Charsets.UTF_8)).apply { qos = 1 }
                mqttClient?.publish(topic, message)
            } catch (e: Exception) {
                queueLocally(topic, jsonStr)
            }
        } else {
            queueLocally(topic, jsonStr)
        }
    }

    private fun queueLocally(topic: String, payloadJson: String) {
        coroutineScope.launch {
            try {
                val queueEntity = SyncQueueEntity(
                    queueId = UUID.randomUUID().toString(),
                    topic = topic,
                    payloadJson = payloadJson,
                    sequenceNumber = sequenceNumber
                )
                LifeFlowApplication.instance.database.sensorDao().enqueueSyncItem(queueEntity)
            } catch (e: Exception) {
                Log.e("LifeFlowMqtt", "Failed to queue offline telemetry", e)
            }
        }
    }

    private fun drainOfflineQueue() {
        coroutineScope.launch {
            try {
                val dao = LifeFlowApplication.instance.database.sensorDao()
                val pending = dao.getPendingSyncQueue()
                for (item in pending) {
                    val message = MqttMessage(item.payloadJson.toByteArray(Charsets.UTF_8)).apply { qos = 1 }
                    mqttClient?.publish(item.topic, message)
                    dao.markItemSynced(item.id)
                }
                if (pending.isNotEmpty()) {
                    Log.i("LifeFlowMqtt", "Successfully synchronized ${pending.size} offline buffered telemetry events.")
                }
            } catch (e: Exception) {
                Log.e("LifeFlowMqtt", "Error draining offline queue", e)
            }
        }
    }
}
