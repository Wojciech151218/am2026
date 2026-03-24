package com.example.myapplication

import android.content.Context
import androidx.room.Room
import com.example.myapplication.data.local.SmartTripDatabase
import com.example.myapplication.data.remote.OpenWeatherApiService
import com.example.myapplication.data.repository.AuthRepository
import com.example.myapplication.data.repository.PlacesRepository
import com.example.myapplication.data.repository.WeatherRepository
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

class AppContainer(context: Context) {
    private val appContext = context.applicationContext

    private val loggingInterceptor = HttpLoggingInterceptor().apply {
        level = HttpLoggingInterceptor.Level.BASIC
    }

    private val okHttpClient = OkHttpClient.Builder()
        .addInterceptor(loggingInterceptor)
        .build()

    private val retrofit = Retrofit.Builder()
        .baseUrl("https://api.openweathermap.org/data/2.5/")
        .client(okHttpClient)
        .addConverterFactory(GsonConverterFactory.create())
        .build()

    private val database = Room.databaseBuilder(
        appContext,
        SmartTripDatabase::class.java,
        "smarttrip.db"
    ).fallbackToDestructiveMigration().build()

    val authRepository = AuthRepository(appContext)
    val placesRepository = PlacesRepository(
        context = appContext,
        favoritePlaceDao = database.favoritePlaceDao()
    )
    val weatherRepository = WeatherRepository(
        apiService = retrofit.create(OpenWeatherApiService::class.java)
    )
}
