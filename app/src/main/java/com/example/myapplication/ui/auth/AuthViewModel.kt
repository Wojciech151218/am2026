package com.example.myapplication.ui.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.example.myapplication.data.repository.AuthRepository
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class AuthUiState(
    val isLoading: Boolean = false,
    val isAuthenticated: Boolean = false
)

class AuthViewModel(
    private val authRepository: AuthRepository
) : ViewModel() {
    private val _uiState = MutableStateFlow(
        AuthUiState(isAuthenticated = authRepository.isSignedIn())
    )
    val uiState: StateFlow<AuthUiState> = _uiState.asStateFlow()

    private val _messages = MutableSharedFlow<String>()
    val messages: SharedFlow<String> = _messages.asSharedFlow()

    fun login(email: String, password: String) {
        submit(email, password) { normalizedEmail, normalizedPassword ->
            authRepository.login(normalizedEmail, normalizedPassword)
        }
    }

    fun register(email: String, password: String) {
        submit(email, password) { normalizedEmail, normalizedPassword ->
            authRepository.register(normalizedEmail, normalizedPassword)
        }
    }

    private fun submit(
        email: String,
        password: String,
        action: suspend (String, String) -> Result<Unit>
    ) {
        val normalizedEmail = email.trim()
        if (normalizedEmail.isBlank() || password.isBlank()) {
            emitMessage("Email and password are required.")
            return
        }
        if (password.length < 6) {
            emitMessage("Password must be at least 6 characters.")
            return
        }

        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            val result = action(normalizedEmail, password)
            result.fold(
                onSuccess = {
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            isAuthenticated = true
                        )
                    }
                },
                onFailure = { error ->
                    _uiState.update { it.copy(isLoading = false) }
                    emitMessage(error.message ?: "Authentication failed.")
                }
            )
        }
    }

    private fun emitMessage(message: String) {
        viewModelScope.launch {
            _messages.emit(message)
        }
    }
}

class AuthViewModelFactory(
    private val authRepository: AuthRepository
) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        return AuthViewModel(authRepository) as T
    }
}
