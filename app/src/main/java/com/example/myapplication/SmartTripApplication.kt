package com.example.myapplication

import android.app.Application
import com.google.firebase.FirebaseApp

class SmartTripApplication : Application() {
    lateinit var appContainer: AppContainer
        private set

    override fun onCreate() {
        super.onCreate()
        FirebaseApp.initializeApp(this)
        appContainer = AppContainer(this)
    }
}
