use sqlx::{SqlitePool, Transaction, Sqlite};
use sqlx::sqlite::SqliteConnectOptions;
use std::sync::OnceLock;
use std::path::Path;
use std::fs;

const DB_PATH: &str = "/Users/elia/dev/litforge/notes/database/notes.db";
static DB_POOL: OnceLock<SqlitePool> = OnceLock::new();

pub async fn init_pool() -> Result<(), sqlx::Error> {
    // Ensure the parent directory exists
    let db_dir = Path::new(DB_PATH).parent().expect("No parent directory");
    fs::create_dir_all(db_dir).expect("Failed to create database directory");
    println!("Database directory exists: {:?}", db_dir.exists());

    // Check if file exists or will be created
    println!("Database file exists before connection: {:?}", Path::new(DB_PATH).exists());

    let options = SqliteConnectOptions::new()
        .filename(Path::new(DB_PATH))
        .create_if_missing(true);

    let pool = SqlitePool::connect_with(options).await?;
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
