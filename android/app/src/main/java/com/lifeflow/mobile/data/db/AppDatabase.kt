package com.lifeflow.mobile.data.db

import androidx.room.*

@Dao
interface SensorDao {
    @Insert
    suspend fun insertSensorEvent(event: SensorEventEntity)

    @Insert
    suspend fun insertGpsEvent(event: GpsEventEntity)

    @Insert
    suspend fun enqueueSyncItem(item: SyncQueueEntity)

    @Query("SELECT * FROM sync_queue WHERE status = 'QUEUED' ORDER BY id ASC LIMIT 50")
    suspend fun getPendingSyncQueue(): List<SyncQueueEntity>

    @Query("UPDATE sync_queue SET status = 'SYNCED' WHERE id = :id")
    suspend fun markItemSynced(id: Long)

    @Query("SELECT COUNT(*) FROM sync_queue WHERE status = 'QUEUED'")
    suspend fun getPendingQueueCount(): Int

    @Query("DELETE FROM sensor_events WHERE isSynced = 1 AND timestamp < :olderThanTimestamp")
    suspend fun purgeSyncedEvents(olderThanTimestamp: Long)
}

@Database(
    entities = [SensorEventEntity::class, GpsEventEntity::class, SyncQueueEntity::class],
    version = 1,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun sensorDao(): SensorDao
}
