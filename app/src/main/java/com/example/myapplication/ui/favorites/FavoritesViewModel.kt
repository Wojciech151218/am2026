package com.example.myapplication.ui.favorites

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.example.myapplication.data.repository.AuthRepository
import com.example.myapplication.data.repository.PlacesRepository
import com.example.myapplication.domain.model.FavoritePlace
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class FavoritesUiState(
    val favorites: List<FavoritePlace> = emptyList()
)

class FavoritesViewModel(
    authRepository: AuthRepository,
    private val placesRepository: PlacesRepository
) : ViewModel() {
    private val userId = authRepository.currentUserId()

    private val _uiState = MutableStateFlow(FavoritesUiState())
    val uiState: StateFlow<FavoritesUiState> = _uiState.asStateFlow()

    private val _messages = MutableSharedFlow<String>()
    val messages: SharedFlow<String> = _messages.asSharedFlow()

    init {
        observeFavorites()
        refreshFavorites()
    }

    fun deleteFavorite(placeId: String) {
        val activeUserId = userId ?: return
        viewModelScope.launch {
            val result = placesRepository.deleteFavorite(activeUserId, placeId)
            result.onFailure { error ->
                emitMessage(error.message ?: "Could not delete the place.")
            }
        }
    }

    private fun refreshFavorites() {
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

    private fun emitMessage(message: String) {
        viewModelScope.launch {
            _messages.emit(message)
        }
    }
}

class FavoritesViewModelFactory(
    private val authRepository: AuthRepository,
    private val placesRepository: PlacesRepository
) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        return FavoritesViewModel(authRepository, placesRepository) as T
    }
}
