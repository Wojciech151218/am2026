package com.example.myapplication.data.repository

import android.content.Context
import com.google.firebase.FirebaseApp
import com.google.firebase.auth.FirebaseAuth
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.tasks.await
import kotlinx.coroutines.withContext

class AuthRepository(private val context: Context) {
    fun isSignedIn(): Boolean {
        return firebaseAuthOrNull()?.currentUser != null
    }

    fun currentUserId(): String? {
        return firebaseAuthOrNull()?.currentUser?.uid
    }

    suspend fun login(email: String, password: String): Result<Unit> {
        return withContext(Dispatchers.IO) {
            runCatching {
                val auth = firebaseAuthOrNull() ?: error("Firebase is not configured yet.")
                auth.signInWithEmailAndPassword(email, password).await()
                Unit
            }
        }
    }

    suspend fun register(email: String, password: String): Result<Unit> {
        return withContext(Dispatchers.IO) {
            runCatching {
                val auth = firebaseAuthOrNull() ?: error("Firebase is not configured yet.")
                auth.createUserWithEmailAndPassword(email, password).await()
                Unit
            }
        }
    }

    fun logout() {
        firebaseAuthOrNull()?.signOut()
    }

    private fun firebaseAuthOrNull(): FirebaseAuth? {
        return try {
            if (FirebaseApp.getApps(context).isEmpty()) {
                FirebaseApp.initializeApp(context)
            }
            FirebaseAuth.getInstance()
        } catch (_: Exception) {
            null
        }
    }
}
