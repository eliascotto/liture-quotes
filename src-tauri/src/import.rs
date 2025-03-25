use crate::db;
use crate::queries;
use crate::models;
use chrono::NaiveDateTime;
use serde_json::Value;
use std::collections::HashMap;
use std::fs::File;
use std::io::{self, Read};
use std::path::Path;
use tauri::AppHandle;
use tauri_plugin_dialog::{DialogExt, FileDialogBuilder};
use tauri::Manager;
use sqlx::{sqlite::SqlitePool, Row};
use serde::{Serialize, Deserialize};
use anyhow::Result;
use sqlx::FromRow;
use chrono::Utc;
use uuid::Uuid;

pub async fn import_dialog(app: &AppHandle) -> Result<String, String> {
    // Create a future that resolves when the file dialog completes
    let (tx, rx) = tokio::sync::oneshot::channel();

    let window = app.get_window("main").ok_or("No main window found")?;
    
    let dialog = FileDialogBuilder::new(app.dialog().clone())
        .set_parent(&window)
        .add_filter("KoboReader", &["sqlite"]);

    
    dialog.pick_file(move |file_path| {
        let result = match file_path {
            Some(path) => Ok(path.to_string()),
            None => Err("No file selected".to_string()),
        };
        // Send the result through the channel (ignore send errors if receiver is dropped)
        let _ = tx.send(result);
    });
    
    // Await the result from the channel
    rx.await.map_err(|_| "Dialog channel error".to_string())?
}

fn read_file(path: &str) -> io::Result<String> {
    let path = Path::new(path);
    let mut file = File::open(path)?;
    let mut contents = String::new();

    file.read_to_string(&mut contents)?;
    Ok(contents)
}

fn read_json(path: &str) -> io::Result<Value> {
    let contents = read_file(path)?;
    let json: Value = serde_json::from_str(&contents)?;
    Ok(json)
}

fn parse_datetime(s: &str) -> Result<NaiveDateTime, chrono::format::ParseError> {
    let formats = [
        "%Y-%m-%dT%H:%M:%S%.3f",    // For "2020-11-22T10:11:42.000"
        "%Y-%m-%dT%H:%M:%SZ",       // For "2020-11-22T10:11:42Z"
        "%Y-%m-%d %H:%M:%S",        // For "2020-11-22 10:11:42"
    ];
    
    for &fmt in &formats {
        if let Ok(dt) = NaiveDateTime::parse_from_str(s, fmt) {
            return Ok(dt);
        }
    }
    
    NaiveDateTime::parse_from_str(s, formats[0])
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Book {
    volume_id: String,
    title: String,
    author: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Chapter {
    content_id: String,
    book_id: String,
    book_title: String,
    title: String,
    volume_index: i64,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct BookItem {
    volume_id: String,
    text: Option<String>,
    annotation: Option<String>,
    date_created: String,
    date_modified: Option<String>,
    chapter_progress: f64,
    book_title: String,
    chapter: String,
    bookmark_id: String,
    item_type: String,
}

const QUERY_BOOKS_AUTHORS: &str = r#"
    SELECT DISTINCT
        b.VolumeID as volume_id,
        c.Title as title,
        c.Attribution as author
    FROM
        Bookmark b
        INNER JOIN content c ON b.VolumeID = c.ContentID
    ORDER BY
        c.Title;
"#;

const QUERY_CHAPTERS: &str = r#"
    SELECT DISTINCT
    	c.ContentID as content_id,
    	c.BookID as book_id,
    	c.Booktitle as book_title,
        c.Title as title,
        c.VolumeIndex as volume_index
    FROM
        content c
    WHERE c.BookID = ?
    ORDER BY c.VolumeIndex;
"#;

const QUERY_ITEMS_V175: &str = r#"
    SELECT 
        b.VolumeID as volume_id,
        c.ContentID as content_id,
        b.Text as text, 
        b.Annotation as annotation, 
        b.DateCreated as date_created, 
        b.DateModified as date_modified, 
        b.ChapterProgress as chapter_progress,
        c.BookTitle as book_title, 
        c.Title as chapter, 
        b.BookmarkID as bookmark_id,
        b.Type as item_type
    FROM Bookmark b INNER JOIN content c
    ON b.VolumeID = c.BookID 
    GROUP BY b.DateCreated 
    ORDER BY b.ChapterProgress ASC, b.DateCreated ASC;
"#;

const QUERY_ITEMS_V174: &str = r#"
    SELECT 
        b.VolumeID as volume_id,
        c.ContentID as content_id,
        b.Text as text, 
        b.Annotation as annotation, 
        b.DateCreated as date_created, 
        b.DateModified as date_modified,
        b.ChapterProgress as chapter_progress, 
        c.BookTitle as book_title, 
        c.Title as chapter, 
        b.BookmarkID as bookmark_id,
        b.Type as item_type
    FROM Bookmark b LEFT JOIN content c
    ON b.ContentID = c.ContentID 
    GROUP BY b.DateCreated 
    ORDER BY b.ChapterProgress ASC, b.DateCreated ASC;
"#;

pub async fn import_kobo(path: &str) -> Result<String, String> {
    if !Path::new(path).exists() {
        return Err("Database file not found".to_string());
    }

    let db_conn = SqlitePool::connect(&format!("sqlite:{}", path))
        .await
        .expect("Failed to connect to database");

    // Kobo has changed the database saving format between versions,
    // so we need to use two different queries to fetch the data.
    // Currently supported versions are: 174, 175.
    let db_version: i32 = sqlx::query("SELECT version FROM DbVersion;")
        .fetch_one(&db_conn)
        .await
        .expect("Failed to get database version")
        .get(0);

    // Fetch all the books with their authors first.
    let books = sqlx::query_as::<_, Book>(QUERY_BOOKS_AUTHORS)
        .fetch_all(&db_conn)
        .await
        .expect("Failed to fetch books");

    let mut chapters = HashMap::new();

    // Loop through all books and fetch their chapters.
    for book in books.iter() {
        let book_chapters = sqlx::query_as::<_, Chapter>(QUERY_CHAPTERS)
            .bind(book.volume_id.clone())
            .fetch_all(&db_conn)
            .await
            .expect("Failed to fetch chapters");
        chapters.insert(book.volume_id.clone(), book_chapters);
    }

    // Fetch all the highlights/notes.
    let items = if db_version >= 175 {
        sqlx::query_as::<_, BookItem>(QUERY_ITEMS_V175)
            .fetch_all(&db_conn)
            .await
            .expect("Failed to fetch items")
    } else {
        sqlx::query_as::<_, BookItem>(QUERY_ITEMS_V174)
            .fetch_all(&db_conn)
            .await
            .expect("Failed to fetch items")
    };

    db_conn.close().await;

    let pool = db::get_pool();
    let mut tx = pool.begin().await.map_err(|e| e.to_string())?;

    let mut chapters_id_map = HashMap::new();
    let mut books_id_map = HashMap::new();
    let mut authors_id_map = HashMap::new();
    let mut imported_books = 0;
    let mut imported_quotes = 0;

    for book in books.iter() {
        // Skip if book already exists
        if let Ok(existing_book) = queries::get_book_by_original_id(book.volume_id.clone(), &mut *tx).await {
            books_id_map.insert(book.volume_id.clone(), existing_book.id.clone());
            continue;
        }

        // Author
        let author_id = match book.author.clone() {
            Some(book_author) => {
                let author = match queries::get_author_by_name(book_author.clone(), &mut *tx).await {
                    Ok(existing_author) => existing_author,
                    Err(_) => {
                        queries::insert_author(book_author.clone(), &mut *tx)
                            .await
                            .map_err(|e| format!("Error creating Author => {}", e))?
                    }
                };
                Some(author.id)
            },
            None => None,
        };

        authors_id_map.insert(book.volume_id.clone(), author_id.clone());

        // Book
        let db_book = queries::insert_book(
            book.title.clone(),
            author_id.clone(),
            Some(book.volume_id.clone()),
            &mut *tx,
        )
        .await
        .map_err(|e| format!("Error creating Book => {}", e))?;

        imported_books += 1;
        books_id_map.insert(db_book.original_id.clone().unwrap(), db_book.id.clone());

        // Chapters
        let book_chapters = chapters.get(&book.volume_id).unwrap();
        let now = Utc::now().naive_utc();
        for chapter in book_chapters.iter() {
            // Skip if chapter already exists
            if let Ok(existing_chapter) = queries::get_chapter_by_original_id(chapter.content_id.clone(), &mut *tx).await {
                chapters_id_map.insert(chapter.content_id.clone(), existing_chapter.id.clone());
                continue;
            }

            let chapter = models::Chapter {
                id: Uuid::new_v4().to_string(),
                book_id: Some(db_book.id.clone()),
                title: chapter.title.clone(),
                volume_index: chapter.volume_index,
                original_id: Some(chapter.content_id.clone()),
                created_at: now,
                updated_at: now,
                deleted_at: None,
            };
            
            let chapter = queries::insert_chapter(&chapter, &mut *tx)
                .await
                .map_err(|e| format!("Error creating Chapter => {}", e))?;
            chapters_id_map.insert(chapter.original_id.clone().unwrap(), chapter.id.clone());
        }
    }

    for item in items.iter() {
        // Skip if quote already exists
        if let Ok(_) = queries::get_quote_by_original_id(item.bookmark_id.clone(), &mut *tx).await {
            continue;
        }

        let book_id = books_id_map.get(&item.volume_id)
            .cloned()
            .unwrap_or_else(|| item.volume_id.clone());
        let author_id = authors_id_map.get(&item.volume_id).unwrap().clone();

        let created_at = parse_datetime(&item.date_created).map_err(|e| format!("Error parsing datetime => {}", e))?;
        let updated_at = match item.date_modified.clone() {
            Some(date_modified) => parse_datetime(&date_modified).map_err(|e| format!("Error parsing datetime => {}", e))?,
            None => created_at,
        };

        let quote = models::Quote {
            id: item.bookmark_id.clone(),
            book_id: Some(book_id.clone()),
            author_id: author_id.clone(),
            chapter: Some(chapters_id_map.get(&item.chapter)
                .cloned()
                .unwrap_or_else(|| item.chapter.clone())),
            chapter_progress: Some(item.chapter_progress),
            content: item.text.clone(),
            starred: Some(0),
            created_at,
            updated_at,
            deleted_at: None,
            original_id: Some(item.bookmark_id.clone()),
        };

        let db_quote = queries::insert_quote(&quote, &mut *tx)
            .await
            .map_err(|e| format!("Error creating Quote => {}", e))?;

        imported_quotes += 1;

        if item.item_type == "highlight" && item.text.is_some() {
            // Note
            let note = models::Note {
                id: Uuid::new_v4().to_string(),
                book_id: Some(book_id.clone()),
                author_id: author_id,
                quote_id: Some(db_quote.id.clone()),
                content: item.text.clone(),
                created_at,
                updated_at,
                deleted_at: None,
            };

            queries::insert_note(&note, &mut *tx)
                .await
                .map_err(|e| format!("Error creating Note => {}", e))?;
        }
    }

    tx.commit().await.map_err(|e| e.to_string())?;

    Ok(format!("Imported successfully {} new books and {} new quotes", imported_books, imported_quotes))
}

/// Import books from JSON
pub async fn import_books(path: &str) -> Result<String, String> {
    let books_values = read_json(path).map_err(|e| format!("Error reading JSON: {}", e))?;

    let books_vec = books_values
        .as_array()
        .ok_or("JSON file doesn't contain a valid array")?;

    let mut books = Vec::new();
    for bk in books_vec.iter() {
        let b = models::parse_book(bk).map_err(|e| format!("Failed to parse JSON => {}", e))?;
        books.push(b);
    }

    let pool = db::get_pool();
    let mut tx = pool.begin().await.map_err(|e| e.to_string())?;

    for book in books.iter() {
        let author_id = match &book.author {
            Some(book_author) => {
                let author = queries::insert_author(book_author.clone(), &mut *tx)
                    .await
                    .map_err(|e| format!("Error creating Author => {}", e))?;
                Some(author.id)
            }
            None => None,
        };

        queries::insert_book(book.title.clone(), author_id, None, &mut *tx)
            .await
            .map_err(|e| format!("Error creating Book => {}", e))?;
    }

    tx.commit().await.map_err(|e| e.to_string())?;
    Ok("Books imported correctly".into())
}

/// Import quotes from JSON
pub async fn import_quotes(path: &str) -> Result<String, String> {
    let quotes_values = read_json(path).map_err(|e| format!("Error reading JSON: {}", e))?;

    let quotes_vec = quotes_values
        .as_array()
        .ok_or("JSON file doesn't contain a valid array")?;

    let mut quotes = Vec::new();
    for note_value in quotes_vec.iter() {
        let note = models::parse_quote(note_value).map_err(|e| format!("Failed to parse JSON => {}", e))?;
        quotes.push(note);
    }

    let pool = db::get_pool();
    let mut tx = pool.begin().await.map_err(|e| e.to_string())?;

    for quote in quotes.iter() {
        let book = queries::get_book_by_id(quote.book_id.clone().unwrap(), &mut *tx)
            .await
            .map_err(|e| {
                format!(
                    "Book not found with id \"{}\" => {}",
                    quote.book_id.clone().unwrap(),
                    e
                )
            })?;

        let created_at =
            NaiveDateTime::parse_from_str(quote.created_at.as_str(), "%Y-%m-%d %H:%M:%S").unwrap();
        let updated_at =
            NaiveDateTime::parse_from_str(quote.updated_at.as_str(), "%Y-%m-%d %H:%M:%S").unwrap();

        let n = models::Quote {
            id: quote.id.clone(),
            book_id: Some(book.id),
            author_id: book.author_id,
            chapter: quote.chapter.clone(),
            chapter_progress: quote.chapter_progress,
            content: quote.text.clone(),
            starred: Some(0),
            created_at: created_at,
            updated_at: updated_at,
            deleted_at: None,
            original_id: Some(quote.id.clone()),
        };

        sqlx::query("INSERT OR IGNORE INTO quote 
             (id, book_id, author_id, chapter, chapter_progress, content, starred, created_at, updated_at, deleted_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
            .bind(n.id.clone())
            .bind(n.book_id.clone())
            .bind(n.author_id.clone())
            .bind(n.chapter.clone())
            .bind(n.chapter_progress)
            .bind(n.content.clone())
            .bind(n.starred)
            .bind(n.created_at)
            .bind(n.updated_at)
            .bind(n.deleted_at)
            .execute(&mut *tx)
            .await
            .map_err(|e| format!("Error creating quote => {}\n{:#?}", e, quote))?;
    }

    // Optimize FTS after bulk notes insertion
    sqlx::query("INSERT INTO quote_fts(quote_fts) VALUES('optimize')")
        .execute(&mut *tx)
        .await
        .map_err(|e| format!("Error optimizing fts: {}", e))?;

    tx.commit().await.map_err(|e| e.to_string())?;
    Ok("Notes imported correctly".into())
}
