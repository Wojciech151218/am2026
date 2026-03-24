package com.example.myapplication.domain.model

data class FavoritePlace(
    val id: String,
    val name: String,
    val lat: Double,
    val lng: Double,
    val savedAt: Long
)
