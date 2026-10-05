package com.lifeflow.mobile.state

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.os.BatteryManager
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

data class DeviceHealthState(
    val batteryPct: Int = 100,
    val isCharging: Boolean = false,
    val isOnline: Boolean = true,
    val networkType: String = "WIFI", // WIFI, CELLULAR_4G_5G, NONE
    val latencyMs: Int = 15,
    val timestamp: Long = System.currentTimeMillis()
)

class DeviceHealthMonitor(private val context: Context) {

    private val _healthState = MutableStateFlow(DeviceHealthState())
    val healthState: StateFlow<DeviceHealthState> = _healthState

    private val batteryReceiver = object : BroadcastReceiver() {
        override fun onReceive(c: Context?, intent: Intent?) {
            val level = intent?.getIntExtra(BatteryManager.EXTRA_LEVEL, -1) ?: 100
            val scale = intent?.getIntExtra(BatteryManager.EXTRA_SCALE, -1) ?: 100
            val status = intent?.getIntExtra(BatteryManager.EXTRA_STATUS, -1) ?: -1
            val isCharging = status == BatteryManager.BATTERY_STATUS_CHARGING ||
                    status == BatteryManager.BATTERY_STATUS_FULL

            val pct = if (level >= 0 && scale > 0) (level * 100 / scale) else 100

            _healthState.value = _healthState.value.copy(
                batteryPct = pct,
                isCharging = isCharging,
                timestamp = System.currentTimeMillis()
            )
        }
    }

    fun startMonitoring() {
        context.registerReceiver(
            batteryReceiver,
            IntentFilter(Intent.ACTION_BATTERY_CHANGED)
        )
        refreshNetworkState()
    }

    fun stopMonitoring() {
        try {
            context.unregisterReceiver(batteryReceiver)
        } catch (e: Exception) {
            // Receiver not registered
        }
    }

    fun refreshNetworkState() {
        val cm = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val network = cm.activeNetwork
        val caps = cm.getNetworkCapabilities(network)

        val isOnline = caps != null && (
                caps.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) ||
                caps.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) ||
                caps.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET)
        )

        val type = when {
            caps?.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) == true -> "WIFI"
            caps?.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) == true -> "CELLULAR_4G_5G"
            else -> "NONE"
        }

        _healthState.value = _healthState.value.copy(
            isOnline = isOnline,
            networkType = type,
            timestamp = System.currentTimeMillis()
        )
    }
}
