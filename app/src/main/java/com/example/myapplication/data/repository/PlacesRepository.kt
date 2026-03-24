package com.example.myapplication.data.repository

import android.content.Context
import com.example.myapplication.data.local.FavoritePlaceDao
import com.example.myapplication.data.local.FavoritePlaceEntity
import com.example.myapplication.domain.model.FavoritePlace
import com.google.firebase.FirebaseApp
import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.tasks.await
import kotlinx.coroutines.withContext

class PlacesRepository(
    private val context: Context,
    private val favoritePlaceDao: FavoritePlaceDao
) {
    fun observeFavorites(userId: String): Flow<List<FavoritePlace>> {
        return favoritePlaceDao.observeFavorites(userId).map { entities ->
            entities.map { entity ->
                FavoritePlace(
                    id = entity.id,
                    name = entity.name,
                    lat = entity.lat,
                    lng = entity.lng,
                    savedAt = entity.savedAt
                )
            }
        }
    }

    suspend fun saveFavorite(userId: String, place: FavoritePlace): Result<Unit> {
        val entity = FavoritePlaceEntity(
            place.id,
            userId,
            place.name,
            place.lat,
            place.lng,
            place.savedAt
        )

        return withContext(Dispatchers.IO) {
            runCatching {
                favoritePlaceDao.insert(entity)
                firestoreOrNull()
                    ?.collection("users")
                    ?.document(userId)
                    ?.collection("favorites")
                    ?.document(place.id)
                    ?.set(entity.toRemoteMap())
                    ?.await()
                Unit
            }
        }
    }

    suspend fun deleteFavorite(userId: String, placeId: String): Result<Unit> {
        return withContext(Dispatchers.IO) {
            runCatching {
                favoritePlaceDao.deleteById(placeId, userId)
                firestoreOrNull()
                    ?.collection("users")
                    ?.document(userId)
                    ?.collection("favorites")
                    ?.document(placeId)
                    ?.delete()
                    ?.await()
                Unit
            }
        }
    }

    suspend fun refreshFavorites(userId: String): Result<Unit> {
        return withContext(Dispatchers.IO) {
            runCatching {
                val snapshot = firestoreOrNull()
                    ?.collection("users")
                    ?.document(userId)
                    ?.collection("favorites")
                    ?.get()
                    ?.await()
                    ?: return@runCatching

                val remoteFavorites = snapshot.documents.mapNotNull { document ->
                    val id = document.getString("id") ?: return@mapNotNull null
                    val name = document.getString("name") ?: return@mapNotNull null
                    val lat = document.getDouble("lat") ?: return@mapNotNull null
                    val lng = document.getDouble("lng") ?: return@mapNotNull null
                    val savedAt = document.getLong("savedAt") ?: System.currentTimeMillis()
                    FavoritePlaceEntity(
                        id,
                        userId,
                        name,
                        lat,
                        lng,
                        savedAt
                    )
                }

                favoritePlaceDao.deleteAllForUser(userId)
                if (remoteFavorites.isNotEmpty()) {
                    favoritePlaceDao.insertAll(remoteFavorites)
                }
                Unit
            }
        }
    }

    private fun firestoreOrNull(): FirebaseFirestore? {
        return try {
            if (FirebaseApp.getApps(context).isEmpty()) {
                FirebaseApp.initializeApp(context)
            }
            FirebaseFirestore.getInstance()
        } catch (_: Exception) {
            null
        }
    }
}

private fun FavoritePlaceEntity.toRemoteMap(): Map<String, Any> {
    return mapOf(
        "id" to id,
        "name" to name,
        "lat" to lat,
        "lng" to lng,
        "savedAt" to savedAt
    )
}
