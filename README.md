# SmartTrip Companion

Minimal native Android app in Kotlin using MVVM, XML layouts, Google Maps, Firebase Auth, Firestore, Room, Retrofit, coroutines, and sensors.

## Features

- Email/password authentication with Firebase
- Protected map and favorites features after login
- Google Map with current location and tap-to-select marker
- Save favorite places locally with Room and sync per user to Firestore
- Weather lookup with OpenWeather based on the selected location
- Accelerometer-based motion hint on the map screen
- Share selected coordinates with Android Share Intent
- Fragment transitions, button press animation, custom launcher icon, and custom marker icon

## Project Structure

- `app/src/main/java/com/example/myapplication/ui`
- `app/src/main/java/com/example/myapplication/data`
- `app/src/main/java/com/example/myapplication/domain`
- `app/src/main/java/com/example/myapplication/utils`

## Setup

### 1. Firebase

1. Create a Firebase project.
2. Add an Android app with package name `com.example.myapplication`.
3. Download `google-services.json`.
4. Place it in `app/google-services.json`.
5. In Firebase Console:
   - Enable Authentication
   - Turn on Email/Password sign-in
   - Create Firestore Database in test mode or with your own rules

Suggested Firestore structure:

- `users/{uid}/favorites/{favoriteId}`

Each favorite document stores:

- `id`
- `name`
- `lat`
- `lng`
- `savedAt`

### 2. Google Maps API Key

Add this to `local.properties`:

```properties
MAPS_API_KEY=your_google_maps_key
```

Enable:

- Maps SDK for Android

### 3. OpenWeather API Key

Add this to `local.properties`:

```properties
OPEN_WEATHER_API_KEY=your_openweather_key
```

Create a key at [OpenWeather](https://openweathermap.org/api).

## Build

```bash
./gradlew :app:assembleDebug
```

## Notes

- The app uses balanced power location requests instead of frequent GPS updates.
- Sensor listeners are active only while the map screen is in the foreground.
- Firebase-dependent features require valid project configuration to work at runtime.
# am2026
