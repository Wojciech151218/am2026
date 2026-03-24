package com.example.myapplication.data.remote

import retrofit2.http.GET
import retrofit2.http.Query

interface OpenWeatherApiService {
    @GET("weather")
    suspend fun getCurrentWeather(
        @Query("lat") lat: Double,
        @Query("lon") lon: Double,
        @Query("appid") apiKey: String,
        @Query("units") units: String = "metric"
    ): OpenWeatherResponse
}

data class OpenWeatherResponse(
    val main: MainDto,
    val weather: List<WeatherDto>
)

data class MainDto(
    val temp: Double
)

data class WeatherDto(
    val main: String,
    val description: String
)
