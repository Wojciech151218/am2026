package com.example.myapplication.data.local;

import androidx.room.Database;
import androidx.room.RoomDatabase;

@Database(
        entities = {FavoritePlaceEntity.class},
        version = 1,
        exportSchema = false
)
public abstract class SmartTripDatabase extends RoomDatabase {
    public abstract FavoritePlaceDao favoritePlaceDao();
}
