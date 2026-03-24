package com.example.myapplication.ui.map

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.example.myapplication.data.repository.AuthRepository
import com.example.myapplication.data.repository.PlacesRepository
import com.example.myapplication.data.repository.WeatherRepository
import com.example.myapplication.domain.model.FavoritePlace
import com.example.myapplication.domain.model.LocationPoint
import com.example.myapplication.domain.model.WeatherInfo
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.util.UUID

data class MapUiState(
    val isLoadingLocation: Boolean = false,
    val currentLocation: LocationPoint? = null,
    val selectedLocation: LocationPoint? = null,
    val favorites: List<FavoritePlace> = emptyList(),
    val weatherInfo: WeatherInfo? = null,
    val weatherStatus: String = "",
    val isDeviceMoving: Boolean = false
)

class MapViewModel(
    private val authRepository: AuthRepository,
    private val placesRepository: PlacesRepository,
    private val weatherRepository: WeatherRepository
) : ViewModel() {
    private val userId = authRepository.currentUserId()

    private val _uiState = MutableStateFlow(MapUiState())
    val uiState: StateFlow<MapUiState> = _uiState.asStateFlow()

    private val _messages = MutableSharedFlow<String>()
    val messages: SharedFlow<String> = _messages.asSharedFlow()

    init {
        observeFavorites()
        refreshFavorites()
    }

    fun setLocationLoading(isLoading: Boolean) {
        _uiState.update { it.copy(isLoadingLocation = isLoading) }
    }

    fun onCurrentLocationReceived(lat: Double, lng: Double) {
        val point = LocationPoint(lat = lat, lng = lng, label = "Current location")
        _uiState.update {
            it.copy(
                isLoadingLocation = false,
                currentLocation = point,
                selectedLocation = it.selectedLocation ?: point
            )
        }
        fetchWeatherFor(point)
    }

    fun onMapTapped(lat: Double, lng: Double) {
        val point = LocationPoint(lat = lat, lng = lng, label = "Selected location")
        _uiState.update { it.copy(selectedLocation = point) }
        fetchWeatherFor(point)
    }

    fun onMotionChanged(isMoving: Boolean) {
        _uiState.update { it.copy(isDeviceMoving = isMoving) }
    }

    fun saveSelectedPlace() {
        val activeUserId = userId
        val location = _uiState.value.selectedLocation ?: _uiState.value.currentLocation

        if (activeUserId == null) {
            emitMessage("Please log in again to save places.")
            return
        }
        if (location == null) {
            emitMessage("Select a point on the map first.")
            return
        }

        val favoritePlace = FavoritePlace(
            id = UUID.randomUUID().toString(),
            name = buildPlaceName(location),
            lat = location.lat,
            lng = location.lng,
            savedAt = System.currentTimeMillis()
        )

        viewModelScope.launch {
            val result = placesRepository.saveFavorite(activeUserId, favoritePlace)
            result.onSuccess {
                emitMessage("Place saved to favorites.")
            }.onFailure { error ->
                emitMessage(error.message ?: "Could not save place.")
            }
        }
    }

    fun buildShareText(): String {
        val location = _uiState.value.selectedLocation ?: _uiState.value.currentLocation
        if (location == null) return "No location selected yet."

        val weatherText = _uiState.value.weatherInfo?.let { info ->
            " Weather: ${info.temperatureCelsius.toInt()}°C and ${info.condition}."
        }.orEmpty()

        return buildString {
            append("SmartTrip location: ")
            append(location.lat)
            append(", ")
            append(location.lng)
            append(".")
            append(weatherText)
        }
    }

    fun refreshFavorites() {
        val activeUserId = userId ?: return
        viewModelScope.launch {
            placesRepository.refreshFavorites(activeUserId)
        }
    }

    private fun observeFavorites() {
        val activeUserId = userId ?: return
        viewModelScope.launch {
            placesRepository.observeFavorites(activeUserId).collect { favorites ->
                _uiState.update { it.copy(favorites = favorites) }
            }
        }
    }

    private fun fetchWeatherFor(location: LocationPoint) {
        viewModelScope.launch {
            _uiState.update {
                it.copy(
                    weatherInfo = null,
                    weatherStatus = "Loading weather..."
                )
            }

            val result = weatherRepository.getWeather(location.lat, location.lng)
            result.fold(
                onSuccess = { weatherInfo ->
                    _uiState.update {
                        it.copy(
                            weatherInfo = weatherInfo,
                            weatherStatus = "Weather updated"
                        )
                    }
                },
                onFailure = { error ->
                    _uiState.update {
                        it.copy(
                            weatherInfo = null,
                            weatherStatus = error.message ?: "Weather unavailable."
                        )
                    }
                }
            )
        }
    }

    private fun buildPlaceName(location: LocationPoint): String {
        return "${location.label} (${String.format("%.4f", location.lat)}, ${String.format("%.4f", location.lng)})"
    }

    private fun emitMessage(message: String) {
        viewModelScope.launch {
            _messages.emit(message)
        }
    }
}

class MapViewModelFactory(
    private val authRepository: AuthRepository,
    private val placesRepository: PlacesRepository,
    private val weatherRepository: WeatherRepository
) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        return MapViewModel(authRepository, placesRepository, weatherRepository) as T
    }
}
