pub mod db;
pub mod dbconn;
mod sqlschema;

use once_cell::sync::Lazy;
use serde::Serialize;
use sqlschema::*;
use sqlx::sqlite::SqliteRow;
use sqlx::Row;

#[derive(Debug, serde::Serialize)]
pub struct DataFields {
    pub books: Vec<Book>,
    pub authors: Vec<Author>,
}

#[derive(Debug, Serialize)]
pub struct StarredQuote {
    pub id: String,
    pub content: String,
    pub book_id: String,
    pub book_title: String,
    pub author_id: String,
    pub author_name: String,
    pub starred: Option<i64>,
    pub created_at: String,
    pub updated_at: String,
    pub deleted_at: Option<String>,
}

pub async fn import_books(path: &str) -> Result<String, String> {
    db::import_books(path).await
}

pub async fn import_notes(path: &str) -> Result<String, String> {
    db::import_quotes(path).await
}

// Store the debug flag directly, initialized only once
static IS_DEBUG: Lazy<bool> = Lazy::new(|| {
    std::env::var("TAURI_ENV_DEBUG")
        .unwrap_or("false".to_string())
        .parse::<bool>()
        .unwrap_or(false)
});

// Macro for debug_print with parameterized strings
macro_rules! debug_print {
    ($($arg:tt)*) => {
        if *IS_DEBUG {
            println!("DEBUG: {}", format!($($arg)*));
        }
    };
}

// Create a separate module for the Tauri commands
pub mod commands {
    use super::*;

    #[tauri::command]
    pub async fn fetch_all() -> Result<DataFields, String> {
        let books = db::get_books()
            .await
            .map_err(|e| format!("Error fetching books {}", e))?;

        let authors = db::get_authors()
            .await
            .map_err(|e| format!("Error fetching authors {}", e))?;

        Ok(DataFields { books, authors })
    }

    #[tauri::command]
    pub async fn fetch_books_by_author(author_id: String) -> Result<Vec<Book>, String> {
        db::get_all_books_by_author(author_id)
            .await
            .map_err(|e| format!("Error fetching books {}", e))
    }

    #[tauri::command]
    pub async fn fetch_book_notes(
        book_id: &str,
        sort_by: Option<&str>,
        sort_order: Option<&str>,
    ) -> Result<Vec<Quote>, String> {
        db::get_all_quotes_by_book_id(book_id, sort_by, sort_order)
            .await
            .map_err(|e| format!("Error fetching notes {}", e))
    }

    #[tauri::command]
    pub async fn search_notes(search: &str) -> Result<Vec<QuoteFts>, String> {
        db::find_quotes(search)
            .await
            .map_err(|e| format!("Error fetching notes {}", e))
    }

    #[tauri::command]
    pub async fn search_books_by_title(search: &str) -> Result<Vec<Book>, String> {
        db::find_books_by_title(search)
            .await
            .map_err(|e| format!("Error searching books {}", e))
    }

    #[tauri::command]
    pub async fn search_authors_by_name(search: &str) -> Result<Vec<Author>, String> {
        db::find_authors_by_name(search)
            .await
            .map_err(|e| format!("Error searching authors {}", e))
    }

    #[tauri::command]
    pub async fn new_author(name: &str) -> Result<Author, String> {
        if name.len() < 2 {
            return Err("Invalid author name".to_string());
        }

        match db::get_author_by_name(name.to_string()).await {
            Ok(_) => Err(format!("Author {name} already present")),
            Err(_) => db::insert_author(name.to_string())
                .await
                .map_err(|e| format!("Error creating author {}", e)),
        }
    }

    #[tauri::command]
    pub async fn new_book(title: &str, author_id: String) -> Result<Book, String> {
        if title.len() < 2 {
            return Err("Invalid book title".to_string());
        }

        // Generate a unique ID for the book
        use uuid::Uuid;
        let book_id = Uuid::new_v4().to_string();

        // Insert the book
        db::insert_book(book_id.clone(), title.to_string(), Some(author_id))
            .await
            .map_err(|e| format!("Error creating book: {}", e))?;

        // Get the book to return
        db::get_book_by_id(book_id)
            .await
            .map_err(|e| format!("Error retrieving created book: {}", e))
    }

    #[tauri::command]
    pub async fn hide_note(quote_id: &str) -> Result<Quote, String> {
        db::delete_quote(quote_id).await.map_err(|e| e.to_string())?;

        db::get_quote_by_id(quote_id)
            .await
            .map_err(|e| format!("Error getting note with id {}: {}", quote_id, e))
    }

    #[tauri::command]
    pub async fn star_note(quote_id: &str) -> Result<Quote, String> {
        let starred = db::get_quote_starred(quote_id)
            .await
            .map_err(|e| format!("Error extracting note with id {}: {}", quote_id, e))?;

        db::set_quote_starred(quote_id, 1 - starred)
            .await
            .map_err(|e| e.to_string())?;

        db::get_quote_by_id(quote_id)
            .await
            .map_err(|e| format!("Error getting note with id {}: {}", quote_id, e))
    }

    #[tauri::command]
    pub async fn update_quote(quote: Quote) -> Result<Quote, String> {
        debug_print!("Updating quote {}", quote.id);
        db::update_quote(&quote).await.map_err(|e| e.to_string())?;

        db::get_quote_by_id(quote.id.as_str())
            .await
            .map_err(|e| format!("Error getting quote with id {}: {}", quote.id, e))
    }

    #[tauri::command]
    pub async fn new_quote(book_id: &str, content: &str) -> Result<Quote, String> {
        if content.trim().is_empty() {
            return Err("Note content cannot be empty".to_string());
        }

        // Get the book to ensure it exists and to get the author_id
        let book = db::get_book_by_id(book_id.to_string())
            .await
            .map_err(|e| format!("Book not found: {}", e))?;

        // Generate a unique ID for the note
        use uuid::Uuid;
        let note_id = Uuid::new_v4().to_string();

        // Get current timestamp
        use chrono::Utc;
        let now = Utc::now().naive_utc();

        // Create the note
        let quote = Quote {
            id: note_id,
            book_id: Some(book.id),
            author_id: book.author_id,
            chapter: None,
            chapter_progress: None,
            content: Some(content.to_string()),
            starred: Some(0),
            created_at: now.clone(),
            updated_at: now,
            deleted_at: None,
        };

        // Insert the note
        sqlx::query(
            "INSERT OR IGNORE INTO quote 
             (id, book_id, author_id, chapter, chapter_progress, content, starred) 
             VALUES (?, ?, ?, ?, ?, ?, ?)",
        )
        .bind(quote.id.clone())
        .bind(quote.book_id.clone())
        .bind(quote.author_id.clone())
        .bind(quote.chapter.clone())
        .bind(quote.chapter_progress)
        .bind(quote.content.clone())
        .bind(quote.starred)
        .execute(dbconn::get_pool())
        .await
        .map_err(|e| format!("Error creating note: {}", e))?;

        db::get_quote_by_id(&quote.id)
            .await
            .map_err(|e| format!("Error retrieving created note: {}", e))
    }

    #[tauri::command]
    pub async fn set_quote_starred(note_id: &str, starred: i64) -> Result<(), String> {
        db::set_quote_starred(note_id, starred)
            .await
            .map_err(|e| e.to_string())
    }

    #[tauri::command]
    pub async fn set_book_deleted(book_id: &str) -> Result<(), String> {
        db::set_book_deleted(book_id)
            .await
            .map_err(|e| e.to_string())
    }

    #[tauri::command]
    pub async fn set_author_deleted(author_id: String) -> Result<(), String> {
        db::set_author_deleted(author_id)
            .await
            .map_err(|e| e.to_string())
    }

    #[tauri::command]
    pub async fn get_random_quote() -> Result<Option<(String, String, String)>, String> {
        db::get_random_quote().await.map_err(|e| e.to_string())
    }

    #[tauri::command]
    pub async fn fetch_starred_notes() -> Result<Vec<StarredQuote>, String> {
        let pool = dbconn::get_pool();

        let notes = sqlx::query(
            "SELECT 
                q.id,
                q.content,
                q.book_id,
                b.title as book_title,
                b.author_id,
                a.name as author_name,
                q.starred,
                q.created_at,
                q.updated_at
            FROM quote q
            JOIN book b ON q.book_id = b.id
            JOIN author a ON b.author_id = a.id
            WHERE q.starred = 1
            AND q.deleted_at IS NULL
            AND b.deleted_at IS NULL
            AND a.deleted_at IS NULL
            ORDER BY q.updated_at DESC",
        )
        .map(|row: SqliteRow| StarredQuote {
            id: row.get(0),
            content: row.get(1),
            book_id: row.get(2),
            book_title: row.get(3),
            author_id: row.get(4),
            author_name: row.get(5),
            starred: row.get(6),
            created_at: row.get(7),
            updated_at: row.get(8),
            deleted_at: row.get(9),
        })
        .fetch_all(pool)
        .await
        .map_err(|e| e.to_string())?;

        Ok(notes)
    }
}

// Re-export the commands for convenience
pub use commands::*;
