package com.example.myapplication.data.local;

import androidx.room.Dao;
import androidx.room.Insert;
import androidx.room.OnConflictStrategy;
import androidx.room.Query;

import java.util.List;

import kotlinx.coroutines.flow.Flow;

@Dao
public interface FavoritePlaceDao {
    @Query("SELECT * FROM favorite_places WHERE userId = :userId ORDER BY savedAt DESC")
    Flow<List<FavoritePlaceEntity>> observeFavorites(String userId);

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void insert(FavoritePlaceEntity place);

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void insertAll(List<FavoritePlaceEntity> places);

    @Query("DELETE FROM favorite_places WHERE id = :placeId AND userId = :userId")
    void deleteById(String placeId, String userId);

    @Query("DELETE FROM favorite_places WHERE userId = :userId")
    void deleteAllForUser(String userId);
}
