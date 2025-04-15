use sqlx::migrate::MigrateDatabase; // required for database_exists and create_database
use sqlx::sqlite::SqlitePoolOptions;
use sqlx::{Sqlite, SqlitePool, Transaction};
use sqlx::migrate::MigrateError;
use std::fs;
use std::sync::OnceLock;
use tauri::Manager; // required for tauri::AppHandle
use uuid::Uuid;
use thiserror::Error;

use crate::queries;
use crate::models::Tag;

static DB_POOL: OnceLock<SqlitePool> = OnceLock::new();

#[derive(Error, Debug)]
pub enum DbInitError {
    #[error("Failed to insert author: {0}")]
    AuthorCreation(#[source] sqlx::Error),
    #[error("Failed to insert book: {0}")]
    BookCreation(#[source] sqlx::Error),
    #[error("Failed to insert quote: {0}")]
    QuoteCreation(#[source] sqlx::Error),
    #[error("Failed to insert tag: {0}")]
    TagCreation(#[source] sqlx::Error),
    #[error("Failed to link quote and tag: {0}")]
    QuoteTagLink(#[source] sqlx::Error),
    #[error("Failed to insert note: {0}")]
    NoteCreation(#[source] sqlx::Error),
}

#[derive(Error, Debug)]
pub enum DbError {
    #[error("Database initialization error: {0}")]
    Init(#[from] DbInitError),
    #[error("SQLx error: {0}")]
    Sqlx(#[from] sqlx::Error),
    #[error("Migration error: {0}")]
    Migration(#[from] MigrateError),
    #[error("Failed to create app data directory")]
    DirectoryCreation,
}

pub async fn init_pool(app: tauri::AppHandle) -> Result<(), DbError> {
    let mut initialized = false;
    
    // Get the app data directory
    let app_dir = match app.path().app_data_dir() {
        Ok(dir) => dir,
        Err(e) => {
            log::error!("Failed to get app data directory: {}", e);
            return Err(DbError::DirectoryCreation);
        }
    };

    log::info!("App data directory: {}", app_dir.display());

    // Create the app config directory if it doesn't exist
    if !app_dir.exists() {
        log::info!("Creating app data directory at: {}", app_dir.display());
        match fs::create_dir_all(&app_dir) {
            Ok(_) => log::info!("Successfully created app data directory"),
            Err(e) => {
                log::error!("Failed to create app data directory: {}", e);
                return Err(DbError::DirectoryCreation);
            }
        }
    }

    // Verify directory permissions
    match fs::metadata(&app_dir) {
        Ok(metadata) => {
            if !metadata.is_dir() {
                log::error!("App data path exists but is not a directory");
                return Err(DbError::DirectoryCreation);
            }
            log::info!("App data directory exists and is accessible");
        },
        Err(e) => {
            log::error!("Failed to access app data directory: {}", e);
            return Err(DbError::DirectoryCreation);
        }
    }

    let db_path = app_dir.join("main.db");
    let db_url = format!("sqlite:{}", db_path.display());
    log::info!("Database path: {}", db_path.display());

    // Check if database file exists
    let db_exists = db_path.exists();
    log::info!("Database file exists: {}", db_exists);

    if !db_exists {
        log::info!("Database file does not exist, creating it...");
        // Create an empty file to ensure the database can be created
        match fs::File::create(&db_path) {
            Ok(_) => log::info!("Created empty database file"),
            Err(e) => {
                log::error!("Failed to create empty database file: {}", e);
                return Err(DbError::DirectoryCreation);
            }
        }
        initialized = true;
    } else {
        log::info!("Database file exists, skipping creation");
    }

    // SQLite will create the database file if it doesn't exist
    log::info!("Connecting to database...");
    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect(&db_url)
        .await
        .map_err(|e| {
            log::error!("Failed to connect to database: {}", e);
            e
        })?;
    log::info!("Connected to database successfully");

    // Set the database pool
    match DB_POOL.set(pool.clone()) {
        Ok(_) => log::info!("Database pool set successfully"),
        Err(_) => {
            log::error!("Failed to set database pool");
            return Err(DbError::Sqlx(sqlx::Error::Configuration("Failed to set database pool".into())));
        }
    }

    if initialized {
        log::info!("Running database migrations...");
        sqlx::migrate!("../migrations").run(&pool).await.map_err(|e| {
            log::error!("Failed to run migrations: {}", e);
            e
        })?;
        log::info!("Migrations completed successfully");

        log::info!("Initializing database with defaults...");
        init_db_with_defaults(&pool).await.map_err(|e| {
            log::error!("Failed to initialize database with defaults: {}", e);
            e
        })?;
        log::info!("Database initialized with defaults successfully");
    }

    Ok(())
}

/// Initialize the database with some default data
pub async fn init_db_with_defaults(pool: &SqlitePool) -> Result<(), DbInitError> {
    log::info!("Starting database initialization...");
    
    // Start a transaction to ensure atomicity
    let mut tx = pool.begin().await.map_err(|e| {
        log::error!("Failed to start transaction: {}", e);
        DbInitError::AuthorCreation(e)
    })?;

    // Enable foreign key constraints for this transaction
    sqlx::query("PRAGMA foreign_keys = ON;")
        .execute(&mut *tx)
        .await
        .map_err(|e| {
            log::error!("Failed to enable foreign key constraints: {}", e);
            DbInitError::AuthorCreation(e)
        })?;

    log::info!("Creating author...");
    let author = match queries::insert_author("George R.R. Martin".to_string(), &mut *tx).await {
        Ok(author) => {
            log::info!("Created author with id: {}", author.id);
            author
        },
        Err(e) => {
            log::error!("Failed to create author: {}", e);
            return Err(DbInitError::AuthorCreation(e));
        }
    };

    log::info!("Creating book...");
    let book = match queries::insert_book_with_defaults(
        "A Dance with Dragons".to_string(),
        Some(author.id.clone()),
        None,
        &mut *tx,
    ).await {
        Ok(book) => {
            log::info!("Created book with id: {}", book.id);
            book
        },
        Err(e) => {
            log::error!("Failed to create book: {}", e);
            return Err(DbInitError::BookCreation(e));
        }
    };
    
    log::info!("Creating first quote...");
    let quote = match queries::insert_quote_lite(
        "A reader lives a thousand lives before he dies... The man who never reads lives only one.".to_string(),
        Some(book.id.clone()),
        Some(author.id.clone()),
        Some(0),
        &mut *tx,
    ).await {
        Ok(quote) => {
            log::info!("Created quote with id: {}", quote.id);
            quote
        },
        Err(e) => {
            log::error!("Failed to create quote: {}", e);
            return Err(DbInitError::QuoteCreation(e));
        }
    };

    log::info!("Creating reading tag...");
    let reading_tag = match queries::insert_tag(&Tag {
        id: Uuid::new_v4().to_string(),
        name: "reading".to_string(),
        color: Some("#FF9800".to_string()),
    }, &mut *tx).await {
        Ok(tag) => {
            log::info!("Created reading tag with id: {}", tag.id);
            tag
        },
        Err(e) => {
            log::error!("Failed to create reading tag: {}", e);
            return Err(DbInitError::TagCreation(e));
        }
    };

    log::info!("Creating books tag...");
    let books_tag = match queries::insert_tag(&Tag {
        id: Uuid::new_v4().to_string(),
        name: "books".to_string(),
        color: Some("#3F51B5".to_string()),
    }, &mut *tx).await {
        Ok(tag) => {
            log::info!("Created books tag with id: {}", tag.id);
            tag
        },
        Err(e) => {
            log::error!("Failed to create books tag: {}", e);
            return Err(DbInitError::TagCreation(e));
        }
    };

    log::info!("Linking quote with reading tag...");
    if let Err(e) = queries::insert_quote_tag(&quote.id, &reading_tag.id, &mut *tx).await {
        log::error!("Failed to link quote with reading tag: {}", e);
        return Err(DbInitError::QuoteTagLink(e));
    }

    log::info!("Linking quote with books tag...");
    if let Err(e) = queries::insert_quote_tag(&quote.id, &books_tag.id, &mut *tx).await {
        log::error!("Failed to link quote with books tag: {}", e);
        return Err(DbInitError::QuoteTagLink(e));
    }

    log::info!("Creating second quote with comment...");
    let quote_with_comment = match queries::insert_quote_lite(
        "These are just examples, add your own quotes to make it yours! You can edit a quote by double clicking on it.".to_string(),
        Some(book.id.clone()),
        Some(author.id.clone()),
        Some(0),
        &mut *tx,
    ).await {
        Ok(quote) => {
            log::info!("Created second quote with id: {}", quote.id);
            quote
        },
        Err(e) => {
            log::error!("Failed to create second quote: {}", e);
            return Err(DbInitError::QuoteCreation(e));
        }
    };

    log::info!("Creating note...");
    if let Err(e) = queries::insert_note_lite(
        "This is a comment. Double click to edit.".to_string(),
        Some(quote_with_comment.id),
        Some(book.id),
        Some(author.id),
        &mut *tx,
    ).await {
        log::error!("Failed to create note: {}", e);
        return Err(DbInitError::NoteCreation(e));
    }

    // Commit the transaction
    log::info!("Committing transaction...");
    if let Err(e) = tx.commit().await {
        log::error!("Failed to commit transaction: {}", e);
        return Err(DbInitError::AuthorCreation(e)); // Using AuthorCreation as a general transaction error
    }

    log::info!("Database initialization completed successfully!");
    Ok(())
}

pub fn get_pool() -> &'static SqlitePool {
    match DB_POOL.get() {
        Some(pool) => pool,
        None => {
            log::error!("Database pool not initialized. This is a critical error.");
            panic!("Database pool not initialized. Please restart the application.");
        }
    }
}

pub async fn close_pool() {
    if let Some(pool) = DB_POOL.get() {
        pool.close().await;
    }
}

/// Returns a new database transaction (rollback/commit)
pub async fn new_tx() -> Result<Transaction<'static, Sqlite>, DbError> {
    get_pool().begin().await.map_err(DbError::Sqlx)
}
