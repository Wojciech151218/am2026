package com.example.myapplication.data.local;

import androidx.annotation.NonNull;
import androidx.room.Entity;
import androidx.room.PrimaryKey;

@Entity(tableName = "favorite_places")
public class FavoritePlaceEntity {
    @PrimaryKey
    @NonNull
    private final String id;
    @NonNull
    private final String userId;
    @NonNull
    private final String name;
    private final double lat;
    private final double lng;
    private final long savedAt;

    public FavoritePlaceEntity(
            @NonNull String id,
            @NonNull String userId,
            @NonNull String name,
            double lat,
            double lng,
            long savedAt
    ) {
        this.id = id;
        this.userId = userId;
        this.name = name;
        this.lat = lat;
        this.lng = lng;
        this.savedAt = savedAt;
    }

    @NonNull
    public String getId() {
        return id;
    }

    @NonNull
    public String getUserId() {
        return userId;
    }

    @NonNull
    public String getName() {
        return name;
    }

    public double getLat() {
        return lat;
    }

    public double getLng() {
        return lng;
    }

    public long getSavedAt() {
        return savedAt;
    }
}
