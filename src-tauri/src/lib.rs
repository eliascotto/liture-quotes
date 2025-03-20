pub mod db;
pub mod dbconn;
mod sqlschema;

use once_cell::sync::Lazy;
use serde::Serialize;
use sqlschema::*;

#[derive(Debug, serde::Serialize)]
pub struct DataFields {
    pub books: Vec<Book>,
    pub authors: Vec<Author>,
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
    pub async fn create_author(name: &str) -> Result<Author, String> {
        debug_print!("Creating author {}", name);
        if name.len() < 2 {
            return Err("Invalid author name".to_string());
        }

        match db::get_author_by_name(name.to_string()).await {
            Ok(_) => Err(format!("Author {name} already present")),
            Err(_) => db::insert_author(name.to_string())
                .await
                .map_err(|e| format!("Error creating author: {}", e)),
        }
    }

    #[tauri::command]
    pub async fn create_book(title: &str, author_id: String) -> Result<Book, String> {
        if title.len() < 2 {
            return Err("Invalid book title".to_string());
        }

        // Insert the book
        let new_book = db::insert_book(title.to_string(), Some(author_id))
            .await
            .map_err(|e| format!("Error creating book: {}", e))?;

        // Get the book to return
        Ok(new_book)
    }

    #[tauri::command]
    pub async fn toggle_quote_starred(quote_id: &str) -> Result<Quote, String> {
        let starred = db::get_quote_starred(quote_id)
            .await
            .map_err(|e| format!("Error extracting note with id {}: {}", quote_id, e))?;

        db::set_quote_starred(quote_id, 1 - starred)
            .await
            .map_err(|e| e.to_string())
    }

    #[tauri::command]
    pub async fn create_quote(book_id: &str, content: &str) -> Result<Quote, String> {
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

        db::insert_quote(&quote).await.map_err(|e| e.to_string())
    }

    #[tauri::command]
    pub async fn update_quote(quote: Quote) -> Result<Quote, String> {
        debug_print!("Updating quote {}", quote.id);
        db::update_quote(&quote).await.map_err(|e| e.to_string())
    }

    #[tauri::command]
    pub async fn set_quote_starred(note_id: &str, starred: i64) -> Result<(), String> {
        let _ = db::set_quote_starred(note_id, starred)
            .await
            .map_err(|e| e.to_string());
        Ok(())
    }

    #[tauri::command]
    pub async fn delete_book(book_id: &str) -> Result<(), String> {
        db::delete_book(book_id)
            .await
            .map_err(|e| e.to_string())
    }

    #[tauri::command]
    pub async fn delete_author(author_id: String) -> Result<(), String> {
        db::delete_author(author_id)
            .await
            .map_err(|e| e.to_string())
    }

    #[tauri::command]
    pub async fn get_random_quote() -> Result<Option<(String, String, String)>, String> {
        db::get_random_quote().await.map_err(|e| e.to_string())
    }

    #[tauri::command]
    pub async fn get_starred_quotes() -> Result<Vec<StarredQuote>, String> {
        db::get_starred_quotes().await.map_err(|e| e.to_string())
    }
}

// Re-export the commands for convenience
pub use commands::*;
