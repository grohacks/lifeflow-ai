package com.lifeflow.mobile

import android.app.Application
import android.content.Context
import androidx.room.Room
import com.lifeflow.mobile.data.db.AppDatabase

class LifeFlowApplication : Application() {

    lateinit var database: AppDatabase
        private set

    override fun onCreate() {
        super.onCreate()
        instance = this

        database = Room.databaseBuilder(
            applicationContext,
            AppDatabase::class.java,
            "lifeflow_mobile_gateway.db"
        ).fallbackToDestructiveMigration().build()
    }

    companion object {
        lateinit var instance: LifeFlowApplication
            private set

        fun getAppContext(): Context = instance.applicationContext
    }
}
