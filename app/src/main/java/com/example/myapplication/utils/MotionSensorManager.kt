package com.example.myapplication.utils

import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import kotlin.math.abs

class MotionSensorManager(
    context: Context,
    private val onMotionChanged: (Boolean) -> Unit
) : SensorEventListener {
    private val sensorManager = context.getSystemService(Context.SENSOR_SERVICE) as SensorManager
    private val accelerometer = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)
    private var lastMotionState = false

    fun start() {
        accelerometer?.let { sensor ->
            sensorManager.registerListener(
                this,
                sensor,
                SensorManager.SENSOR_DELAY_UI
            )
        }
    }

    fun stop() {
        sensorManager.unregisterListener(this)
    }

    override fun onSensorChanged(event: SensorEvent?) {
        val values = event?.values ?: return
        val delta = abs(values[0]) + abs(values[1]) + abs(values[2] - SensorManager.GRAVITY_EARTH)
        val isMoving = delta > 5f
        if (isMoving != lastMotionState) {
            lastMotionState = isMoving
            onMotionChanged(isMoving)
        }
    }

    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) = Unit
}
