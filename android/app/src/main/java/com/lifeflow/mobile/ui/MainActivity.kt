package com.lifeflow.mobile.ui

import android.Manifest
import android.content.pm.PackageManager
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import com.lifeflow.mobile.LifeFlowApplication
import com.lifeflow.mobile.location.LocationTracker
import com.lifeflow.mobile.mqtt.MqttGatewayPublisher
import com.lifeflow.mobile.sensors.AndroidSensorManager
import com.lifeflow.mobile.state.DeviceHealthMonitor
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {

    private lateinit var sensorManager: AndroidSensorManager
    private lateinit var locationTracker: LocationTracker
    private lateinit var healthMonitor: DeviceHealthMonitor
    private lateinit var mqttPublisher: MqttGatewayPublisher

    private val requestPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        if (permissions[Manifest.permission.ACCESS_FINE_LOCATION] == true) {
            locationTracker.startTracking()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        sensorManager = AndroidSensorManager(this)
        locationTracker = LocationTracker(this)
        healthMonitor = DeviceHealthMonitor(this)
        mqttPublisher = MqttGatewayPublisher(this)

        checkPermissionsAndStart()

        // Continuous MQTT Dispatch Loop
        lifecycleScope.launch {
            while (isActive) {
                delay(1000)
                val gps = locationTracker.gpsState.value
                val motion = sensorManager.motionState.value
                val health = healthMonitor.healthState.value

                if (gps.isTracking) {
                    mqttPublisher.publishGps(gps.latitude, gps.longitude, gps.speedKmh, gps.bearing, gps.accuracyMeters)
                }
                mqttPublisher.publishMotion(motion.accelX, motion.accelY, motion.accelZ, motion.totalMagnitude, motion.motionState)
                mqttPublisher.publishDeviceState(health.batteryPct, health.isCharging, health.networkType)
            }
        }

        setContent {
            MaterialTheme(colorScheme = darkColorScheme()) {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = Color(0xFF090D13)
                ) {
                    SensorGatewayScreen(sensorManager, locationTracker, healthMonitor)
                }
            }
        }
    }

    private fun checkPermissionsAndStart() {
        val permissions = arrayOf(
            Manifest.permission.ACCESS_FINE_LOCATION,
            Manifest.permission.ACCESS_COARSE_LOCATION,
            Manifest.permission.CAMERA
        )

        val needed = permissions.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }

        if (needed.isEmpty()) {
            locationTracker.startTracking()
        } else {
            requestPermissionLauncher.launch(needed.toTypedArray())
        }

        sensorManager.startListening()
        healthMonitor.startMonitoring()
        mqttPublisher.connect()
    }

    override fun onDestroy() {
        super.onDestroy()
        sensorManager.stopListening()
        locationTracker.stopTracking()
        healthMonitor.stopMonitoring()
    }
}

@Composable
fun SensorGatewayScreen(
    sensors: AndroidSensorManager,
    location: LocationTracker,
    health: DeviceHealthMonitor
) {
    val motion by sensors.motionState.collectAsState()
    val gps by location.gpsState.collectAsState()
    val deviceHealth by health.healthState.collectAsState()
    var offlineQueueCount by remember { mutableIntStateOf(0) }

    LaunchedEffect(Unit) {
        while (true) {
            offlineQueueCount = LifeFlowApplication.instance.database.sensorDao().getPendingQueueCount()
            delay(2000)
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // App Header
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(
                text = "LifeFlow AI Mobile Gateway",
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold,
                color = Color(0xFF58A6FF)
            )
        }

        // NON-MEDICAL DISCLAIMER CARD
        Card(
            colors = CardDefaults.cardColors(containerColor = Color(0xFF2D1F08)),
            modifier = Modifier.fillMaxWidth()
        ) {
            Row(
                modifier = Modifier.padding(12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = Icons.Default.Warning,
                    contentDescription = "Medical Disclaimer",
                    tint = Color(0xFFD29922),
                    modifier = Modifier.size(24.dp)
                )
                Spacer(modifier = Modifier.width(12.dp))
                Text(
                    text = "HARDWARE SENSING GATEWAY ONLY • NOT A MEDICAL DEVICE\nProvides vehicle kinematics, GPS, and camera intake. Does not measure ECG, SpO2, or NIBP without external physical medical hardware.",
                    fontSize = 11.sp,
                    color = Color(0xFFD29922),
                    lineHeight = 14.sp,
                    fontWeight = FontWeight.SemiBold
                )
            }
        }

        // GPS Telemetry Card
        Card(
            colors = CardDefaults.cardColors(containerColor = Color(0xFF161B22)),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text("REAL GPS TELEMETRY", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color(0xFF8B949E))
                Spacer(modifier = Modifier.height(8.dp))
                Text("Latitude: ${gps.latitude}", color = Color.White)
                Text("Longitude: ${gps.longitude}", color = Color.White)
                Text("Speed: ${"%.1f".format(gps.speedKmh)} km/h", color = Color(0xFF58A6FF), fontWeight = FontWeight.Bold)
                Text("Bearing: ${"%.1f".format(gps.bearing)}° | Accuracy: ${"%.1f".format(gps.accuracyMeters)} m", color = Color(0xFF8B949E), fontSize = 12.sp)
            }
        }

        // Inertial Motion Telemetry Card
        Card(
            colors = CardDefaults.cardColors(containerColor = Color(0xFF161B22)),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text("HARDWARE IMU & MOTION STATE", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color(0xFF8B949E))
                Spacer(modifier = Modifier.height(8.dp))
                Text("Motion State: ${motion.motionState}", color = Color(0xFF3FB950), fontWeight = FontWeight.Bold)
                Text("Accel Magnitude: ${"%.2f".format(motion.totalMagnitude)} m/s²", color = Color.White)
                Text("Axes: X=${"%.2f".format(motion.accelX)} Y=${"%.2f".format(motion.accelY)} Z=${"%.2f".format(motion.accelZ)}", color = Color(0xFF8B949E), fontSize = 12.sp)
            }
        }

        // Device & Network State Card
        Card(
            colors = CardDefaults.cardColors(containerColor = Color(0xFF161B22)),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text("DEVICE STATUS & OFFLINE BUFFER", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color(0xFF8B949E))
                Spacer(modifier = Modifier.height(8.dp))
                Text("Battery: ${deviceHealth.batteryPct}% ${if (deviceHealth.isCharging) "(Charging)" else ""}", color = Color.White)
                Text("Network: ${deviceHealth.networkType} (${if (deviceHealth.isOnline) "ONLINE" else "OFFLINE"})", color = Color.White)
                Text("Offline Buffered Queue: $offlineQueueCount records", color = Color(0xFFBC8CFF), fontWeight = FontWeight.Bold)
            }
        }
    }
}
