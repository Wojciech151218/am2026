package com.example.myapplication.data.repository

import com.example.myapplication.BuildConfig
import com.example.myapplication.data.remote.OpenWeatherApiService
import com.example.myapplication.domain.model.WeatherInfo
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class WeatherRepository(
    private val apiService: OpenWeatherApiService
) {
    suspend fun getWeather(lat: Double, lng: Double): Result<WeatherInfo> {
        if (BuildConfig.OPEN_WEATHER_API_KEY.isBlank()) {
            return Result.failure(IllegalStateException("Weather API key missing."))
        }

        return withContext(Dispatchers.IO) {
            runCatching {
                val response = apiService.getCurrentWeather(
                    lat = lat,
                    lon = lng,
                    apiKey = BuildConfig.OPEN_WEATHER_API_KEY
                )
                WeatherInfo(
                    temperatureCelsius = response.main.temp,
                    condition = response.weather.firstOrNull()?.main ?: "Unknown"
                )
            }
        }
    }
}
