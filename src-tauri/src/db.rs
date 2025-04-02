use sqlx::migrate::MigrateDatabase; // required for database_exists and create_database
use sqlx::sqlite::SqlitePoolOptions;
use sqlx::{Sqlite, SqlitePool, Transaction};
use std::fs;
use std::sync::OnceLock;
use tauri::Manager; // required for tauri::AppHandle

use crate::queries;

static DB_POOL: OnceLock<SqlitePool> = OnceLock::new();

pub async fn init_pool(app: tauri::AppHandle) -> Result<(), sqlx::Error> {
    let mut initialized = false;
    let app_dir = app
        .path()
        .app_data_dir()
        .expect("Failed to get app data directory");

    log::info!("App data directory: {}", app_dir.display());

    // Create the app config directory if it doesn't exist
    if !app_dir.exists() {
        fs::create_dir_all(&app_dir).expect("Failed to create database directory");
    }

    let db_path = app_dir.join("main.db");
    let db_url = format!("sqlite:{}", db_path.display());

    // Check if database exists, if not create it
    if !sqlx::Sqlite::database_exists(&db_url).await? {
        sqlx::Sqlite::create_database(&db_url).await?;
        initialized = true;
    }

    // SQLite will create the database file if it doesn't exist
    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect(&db_url)
        .await?;

    if initialized {
        sqlx::migrate!("../migrations").run(&pool).await?;
        queries::init_db(&pool).await?;
    }

    DB_POOL.set(pool).expect("Failed to set database pool");
    Ok(())
}

pub fn get_pool() -> &'static SqlitePool {
    DB_POOL.get().expect("Database pool not initialized")
}

pub async fn close_pool() {
    if let Some(pool) = DB_POOL.get() {
        pool.close().await;
    }
}

/// Returns a new database transaction (rollback/commit)
pub async fn new_tx() -> Result<Transaction<'static, Sqlite>, String> {
    match get_pool().begin().await {
        Ok(t) => Ok(t),
        Err(e) => return Err(format!("Error creating new db transaction: {e}")),
    }
}
