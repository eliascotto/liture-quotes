pub mod db;
pub mod import;
pub mod menu;
mod models;
pub mod queries;
mod utils;

use models::*;

// Create a separate module for the Tauri commands
pub mod commands {
    use super::*;
    use crate::db::get_pool;

    #[tauri::command]
    pub async fn fetch_books_authors() -> Result<Library, String> {
        let pool = get_pool();
        let books = queries::get_books(pool)
            .await
            .map_err(|e| format!("Error fetching books {}", e))?;

        let authors = queries::get_authors(pool)
            .await
            .map_err(|e| format!("Error fetching authors {}", e))?;

        Ok(Library { books, authors })
    }

    #[tauri::command]
    pub async fn fetch_books_by_author(author_id: String) -> Result<Vec<Book>, String> {
        queries::get_all_books_by_author(author_id, get_pool())
            .await
            .map_err(|e| format!("Error fetching books {}", e))
    }

    #[tauri::command]
    pub async fn get_all_quotes(
        book_id: &str,
        sort_by: Option<&str>,
        sort_order: Option<&str>,
    ) -> Result<Vec<Quote>, String> {
        queries::get_all_quotes_by_book_id(book_id, sort_by, sort_order, get_pool())
            .await
            .map_err(|e| format!("Error fetching notes {}", e))
    }

    #[tauri::command]
    pub async fn search_notes(search: &str) -> Result<Vec<QuoteFts>, String> {
        queries::find_quotes(search, get_pool())
            .await
            .map_err(|e| format!("Error fetching notes {}", e))
    }

    #[tauri::command]
    pub async fn search_books_by_title(search: &str) -> Result<Vec<Book>, String> {
        queries::find_books_by_title(search, get_pool())
            .await
            .map_err(|e| format!("Error searching books {}", e))
    }

    #[tauri::command]
    pub async fn search_authors_by_name(search: &str) -> Result<Vec<Author>, String> {
        queries::find_authors_by_name(search, get_pool())
            .await
            .map_err(|e| format!("Error searching authors {}", e))
    }

    #[tauri::command]
    pub async fn create_author(name: &str) -> Result<Author, String> {
        debug_print!("Creating author {}", name);
        if name.len() < 2 {
            return Err("Invalid author name".to_string());
        }

        let pool = get_pool();
        let mut tx = pool.begin().await.map_err(|e| e.to_string())?;

        let result = match queries::get_author_by_name(name.to_string(), &mut *tx).await {
            Ok(_) => Err(format!("Author {name} already present")),
            Err(_) => queries::insert_author(name.to_string(), &mut *tx)
                .await
                .map_err(|e| format!("Error creating author: {}", e)),
        }?;

        tx.commit().await.map_err(|e| e.to_string())?;
        Ok(result)
    }

    #[tauri::command]
    pub async fn create_book(title: &str, author_id: String) -> Result<Book, String> {
        if title.len() < 2 {
            return Err("Invalid book title".to_string());
        }

        let pool = get_pool();
        let mut tx = pool.begin().await.map_err(|e| e.to_string())?;

        // Insert the book
        let book = queries::insert_book(title.to_string(), Some(author_id), None, &mut *tx)
            .await
            .map_err(|e| format!("Error creating book: {}", e))?;

        tx.commit().await.map_err(|e| e.to_string())?;
        Ok(book)
    }

    #[tauri::command]
    pub async fn create_quote(book_id: &str, content: &str) -> Result<Quote, String> {
        if content.trim().is_empty() {
            return Err("Note content cannot be empty".to_string());
        }

        let pool = get_pool();
        let mut tx = pool.begin().await.map_err(|e| e.to_string())?;

        // Get the book to ensure it exists and to get the author_id
        let book = queries::get_book_by_id(book_id.to_string(), &mut *tx)
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
            imported_at: None,
            deleted_at: None,
            original_id: None,
        };

        let result = queries::insert_quote(&quote, &mut *tx)
            .await
            .map_err(|e| e.to_string())?;

        tx.commit().await.map_err(|e| e.to_string())?;
        Ok(result)
    }

    #[tauri::command]
    pub async fn update_book(book: Book) -> Result<Book, String> {
        debug_print!("Updating book {}", book.id);
        let pool = get_pool();
        let mut tx = pool.begin().await.map_err(|e| e.to_string())?;

        let result = queries::update_book(&book, &mut *tx)
            .await
            .map_err(|e| e.to_string())?;

        tx.commit().await.map_err(|e| e.to_string())?;
        Ok(result)
    }

    #[tauri::command]
    pub async fn update_quote(quote: Quote) -> Result<Quote, String> {
        debug_print!("Updating quote {}", quote.id);
        let pool = get_pool();
        let mut tx = pool.begin().await.map_err(|e| e.to_string())?;

        let result = queries::update_quote_content(
            &quote.id,
            quote.content.as_deref().unwrap_or(""),
            &mut *tx,
        )
        .await
        .map_err(|e| e.to_string())?;

        tx.commit().await.map_err(|e| e.to_string())?;
        Ok(result)
    }

    #[tauri::command]
    pub async fn toggle_quote_starred(quote_id: &str) -> Result<Quote, String> {
        debug_print!("Toggling quote starred status for {}", quote_id);
        let pool = get_pool();
        let mut tx = pool.begin().await.map_err(|e| e.to_string())?;

        let result = queries::toggle_quote_starred(quote_id, &mut *tx)
            .await
            .map_err(|e| e.to_string())?;

        tx.commit().await.map_err(|e| e.to_string())?;
        Ok(result)
    }

    #[tauri::command]
    pub async fn set_quote_starred(note_id: &str, starred: i64) -> Result<(), String> {
        let pool = get_pool();
        let mut tx = pool.begin().await.map_err(|e| e.to_string())?;

        let _ = queries::set_quote_starred(note_id, starred, &mut *tx)
            .await
            .map_err(|e| e.to_string())?;

        tx.commit().await.map_err(|e| e.to_string())?;
        Ok(())
    }

    #[tauri::command]
    pub async fn delete_quote(quote_id: &str) -> Result<(), String> {
        let pool = get_pool();
        let mut tx = pool.begin().await.map_err(|e| e.to_string())?;

        queries::delete_quote(quote_id, &mut *tx)
            .await
            .map_err(|e| e.to_string())?;

        tx.commit().await.map_err(|e| e.to_string())?;
        Ok(())
    }

    #[tauri::command]
    pub async fn delete_book(book_id: &str) -> Result<(), String> {
        let pool = get_pool();
        let mut tx = pool.begin().await.map_err(|e| e.to_string())?;

        queries::delete_book(book_id, &mut *tx)
            .await
            .map_err(|e| e.to_string())?;

        tx.commit().await.map_err(|e| e.to_string())?;
        Ok(())
    }

    #[tauri::command]
    pub async fn delete_author(author_id: String) -> Result<(), String> {
        let pool = get_pool();
        let mut tx = pool.begin().await.map_err(|e| e.to_string())?;

        queries::delete_author_books(author_id.clone(), &mut *tx)
            .await
            .map_err(|e| e.to_string())?;

        queries::delete_author(author_id, &mut *tx)
            .await
            .map_err(|e| e.to_string())?;

        tx.commit().await.map_err(|e| e.to_string())?;
        Ok(())
    }

    #[tauri::command]
    pub async fn get_random_quote() -> Result<Option<(String, String, String)>, String> {
        queries::get_random_quote(get_pool())
            .await
            .map_err(|e| e.to_string())
    }

    #[tauri::command]
    pub async fn get_starred_quotes(
        sort_by: Option<&str>,
        sort_order: Option<&str>,
    ) -> Result<Vec<StarredQuote>, String> {
        queries::get_starred_quotes(sort_by, sort_order, get_pool())
            .await
            .map_err(|e| e.to_string())
    }
}

// Re-export the commands for convenience
pub use commands::*;
