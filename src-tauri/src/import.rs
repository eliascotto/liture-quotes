use crate::db;
use crate::models;
use crate::queries;
use crate::utils::is_dev;

use anyhow::Result;
use chrono::{NaiveDateTime, Utc};
use regex::Regex;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use sqlx::{sqlite::SqlitePool, FromRow, Row};
use std::collections::HashMap;
use std::fs::File;
use std::io::{self, BufRead, BufReader, Read};
use std::path::Path;
use tauri::{AppHandle, Manager};
use tauri_plugin_dialog::{DialogExt, FileDialogBuilder};
use uuid::Uuid;

/// The type of import.
///
/// * `Kobo` - Import from Kobo.
/// * `Clippings` - Import from clippings.
pub enum ImportType {
    Kobo,
    Clippings,
}

/// Open a file dialog and return the path of the selected file.
///
/// # Arguments
///
/// * `app` - The app handle.
/// * `import_type` - The type of import.
///
/// # Returns
///
/// `Result<String, String>` - The path of the selected file or an error.
pub async fn import_dialog(app: &AppHandle, import_type: ImportType) -> Result<String, String> {
    // Create a future that resolves when the file dialog completes
    let (tx, rx) = tokio::sync::oneshot::channel();

    let window = app.get_window("main").ok_or("No main window found")?;

    let (dialog_name, dialog_extension) = match import_type {
        ImportType::Kobo => ("KoboReader", &["sqlite"]),
        ImportType::Clippings => ("Clippings", &["txt"]),
    };

    let dialog = FileDialogBuilder::new(app.dialog().clone())
        .set_parent(&window)
        .add_filter(dialog_name, dialog_extension);

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
        "%Y-%m-%dT%H:%M:%S%.3f",   // For "2020-11-22T10:11:42.000"
        "%Y-%m-%dT%H:%M:%SZ",      // For "2020-11-22T10:11:42Z"
        "%Y-%m-%d %H:%M:%S",       // For "2020-11-22 10:11:42"
        "%A, %e %B %Y %H:%M:%S",   // For "Saturday, 26 March 2016 14:59:39"
        "%A, %B %d, %Y, %I:%M %p", // For "Saturday, March 26, 2016, 02:59 PM"
    ];

    for &fmt in &formats {
        if let Ok(dt) = NaiveDateTime::parse_from_str(s, fmt) {
            return Ok(dt);
        }
    }

    NaiveDateTime::parse_from_str(s, formats[0])
}

#[derive(Debug)]
pub enum ImportError {
    IoError(io::Error),
    DbError(sqlx::Error, String),
    InvalidFormat(String),
}

impl From<io::Error> for ImportError {
    fn from(err: io::Error) -> Self {
        ImportError::IoError(err)
    }
}

impl From<sqlx::Error> for ImportError {
    fn from(err: sqlx::Error) -> Self {
        ImportError::DbError(err, "Failed to execute query".to_string())
    }
}

impl std::fmt::Display for ImportError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ImportError::IoError(e) => write!(f, "{}", e),
            ImportError::DbError(e, msg) => {
                if is_dev() {
                    write!(f, "{}: {}", msg, e)
                } else {
                    write!(f, "{}", msg)
                }
            }
            ImportError::InvalidFormat(msg) => write!(f, "{}", msg),
        }
    }
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
struct Book {
    volume_id: String,
    title: String,
    author: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
struct Chapter {
    content_id: String,
    book_id: String,
    book_title: String,
    title: String,
    volume_index: i64,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
struct BookItem {
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

/// Import books from Kobo.
///
/// # Arguments
///
/// * `str_path` - The path to the Kobo database file.
///
/// # Returns
///
/// `Result<String, String>` - A success message or an error.
pub async fn import_kobo(str_path: &str) -> Result<String, ImportError> {
    let path = Path::new(str_path);
    if !path.exists() || !path.is_file() {
        return Err(ImportError::IoError(io::Error::new(
            io::ErrorKind::NotFound,
            "Database file not found",
        )));
    }

    let kobo_file_db_conn = SqlitePool::connect(&format!("sqlite:{}", str_path))
        .await
        .expect("Failed to connect to database");

    // Kobo has changed the database saving format between versions,
    // so we need to use two different queries to fetch the data.
    // Currently supported versions are: 174, 175.
    let db_version: i32 = sqlx::query("SELECT version FROM DbVersion;")
        .fetch_one(&kobo_file_db_conn)
        .await
        .map_err(|e| ImportError::DbError(e, "Failed to get Kobo database version".to_string()))?
        .get(0);

    // Fetch all the books with their authors first.
    let books = sqlx::query_as::<_, Book>(QUERY_BOOKS_AUTHORS)
        .fetch_all(&kobo_file_db_conn)
        .await
        .map_err(|e| ImportError::DbError(e, "Failed to fetch books".to_string()))?;

    // Map of book id to chapters.
    let mut chapters = HashMap::new();

    // Loop through all books and fetch their chapters.
    for book in books.iter() {
        let book_chapters = sqlx::query_as::<_, Chapter>(QUERY_CHAPTERS)
            .bind(book.volume_id.clone())
            .fetch_all(&kobo_file_db_conn)
            .await
            .map_err(|e| ImportError::DbError(e, "Failed to fetch chapters".to_string()))?;
        chapters.insert(book.volume_id.clone(), book_chapters);
    }

    // Fetch all the highlights/notes.
    let items = if db_version >= 175 {
        sqlx::query_as::<_, BookItem>(QUERY_ITEMS_V175)
            .fetch_all(&kobo_file_db_conn)
            .await
            .map_err(|e| ImportError::DbError(e, "Failed to fetch items".to_string()))?
    } else {
        sqlx::query_as::<_, BookItem>(QUERY_ITEMS_V174)
            .fetch_all(&kobo_file_db_conn)
            .await
            .map_err(|e| ImportError::DbError(e, "Failed to fetch items".to_string()))?
    };

    kobo_file_db_conn.close().await;

    let pool = db::get_pool();
    let mut tx = pool
        .begin()
        .await
        .map_err(|e| ImportError::DbError(e, "Failed to begin transaction".to_string()))?;

    // Map of chapter id to chapter.
    let mut chapters_id_map = HashMap::new();
    // Map of book id to book.
    let mut books_id_map = HashMap::new();
    // Map of author name to author.
    let mut authors_id_map = HashMap::new();
    let mut imported_books = 0;
    let mut imported_quotes = 0;

    for book in books.iter() {
        // Skip if book already exists
        if let Ok(existing_book) =
            queries::get_book_by_original_id(book.volume_id.clone(), &mut *tx).await
        {
            books_id_map.insert(book.volume_id.clone(), existing_book.id.clone());
            continue;
        }

        // Author
        let author_id = match book.author.clone() {
            Some(book_author) => {
                let author = match queries::get_author_by_name(book_author.clone(), &mut *tx).await
                {
                    Ok(existing_author) => existing_author,
                    Err(_) => queries::insert_author(book_author.clone(), &mut *tx)
                        .await
                        .map_err(|e| {
                            ImportError::DbError(e, "Failed to insert author".to_string())
                        })?,
                };
                Some(author.id)
            }
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
        .map_err(|e| ImportError::DbError(e, "Failed to insert book".to_string()))?;

        imported_books += 1;

        books_id_map.insert(book.volume_id.clone(), db_book.id.clone());

        // Chapters
        let book_chapters = chapters.get(&book.volume_id).unwrap();
        let now = Utc::now().naive_utc();
        for chapter in book_chapters.iter() {
            // Skip if chapter already exists
            if let Ok(existing_chapter) =
                queries::get_chapter_by_original_id(chapter.content_id.clone(), &mut *tx).await
            {
                chapters_id_map.insert(chapter.content_id.clone(), existing_chapter.id.clone());
                continue;
            }

            let new_chapter = models::Chapter {
                id: Uuid::new_v4().to_string(),
                book_id: Some(db_book.id.clone()),
                title: chapter.title.clone(),
                volume_index: chapter.volume_index,
                original_id: Some(chapter.content_id.clone()),
                created_at: now,
                updated_at: now,
                deleted_at: None,
            };

            let chapter = queries::insert_chapter(&new_chapter, &mut *tx)
                .await
                .map_err(|e| ImportError::DbError(e, "Failed to insert chapter".to_string()))?;
            chapters_id_map.insert(chapter.original_id.clone().unwrap(), chapter.id.clone());
        }
    }

    for item in items.iter() {
        // Skip if quote already exists
        if let Ok(_) = queries::get_quote_by_original_id(item.bookmark_id.clone(), &mut *tx).await {
            continue;
        }

        let book_id = books_id_map
            .get(&item.volume_id)
            .cloned();
        let author_id = authors_id_map.get(&item.volume_id).unwrap_or(&None).clone();
        let now = Utc::now().naive_utc();

        let created_at = parse_datetime(&item.date_created)
            .map_err(|e| ImportError::InvalidFormat(format!("Error parsing datetime => {}", e)))?;
        let updated_at = match item.date_modified.clone() {
            Some(date_modified) => parse_datetime(&date_modified)
                .map_err(|e| ImportError::InvalidFormat(format!("Error parsing datetime => {}", e)))?,
            None => created_at,
        };

        let quote = models::Quote {
            id: item.bookmark_id.clone(),
            book_id: book_id.clone(),
            author_id: author_id.clone(),
            chapter: Some(
                chapters_id_map
                    .get(&item.chapter)
                    .cloned()
                    .unwrap_or_else(|| item.chapter.clone()),
            ),
            chapter_progress: Some(item.chapter_progress),
            content: item.text.clone(),
            starred: Some(0),
            created_at,
            updated_at,
            imported_at: Some(now),
            deleted_at: None,
            original_id: Some(item.bookmark_id.clone()),
        };

        let db_quote = queries::insert_quote(&quote, &mut *tx)
            .await
            .map_err(|e| ImportError::DbError(e, "Failed to insert quote".to_string()))?;

        imported_quotes += 1;

        if item.item_type == "note" && item.annotation.is_some() {
            // Note
            let note = models::Note {
                id: Uuid::new_v4().to_string(),
                book_id: book_id.clone(),
                author_id: author_id,
                quote_id: Some(db_quote.id.clone()),
                content: item.annotation.clone(),
                created_at,
                updated_at,
                deleted_at: None,
            };

            queries::insert_note(&note, &mut *tx)
                .await
                .map_err(|e| ImportError::DbError(e, "Failed to insert note".to_string()))?;
        }
    }

    tx.commit().await.map_err(|e| ImportError::DbError(e, "Failed to commit transaction".to_string()))?;

    Ok(format!(
        "Imported successfully {} new books and {} new quotes",
        imported_books, imported_quotes
    ))
}

// Define a struct to represent a single clipping entry
#[derive(Debug)]
struct Clipping {
    title: String,
    author: Option<String>,
    added_at: NaiveDateTime,
    metadata: String,
    content: Option<String>, // Absent for bookmarks
}

fn read_clippings_file(path: &str) -> Result<Vec<Clipping>, ImportError> {
    let path = Path::new(path);
    if !path.exists() || !path.is_file() {
        return Err(ImportError::IoError(io::Error::new(
            io::ErrorKind::NotFound,
            "File not found",
        )));
    }

    // Open the file and wrap it in a BufReader for efficiency
    let file = File::open(path).map_err(|e| ImportError::IoError(e))?;
    let mut reader = BufReader::new(file);

    let mut clippings = Vec::new();
    let mut lines = Vec::new();
    let mut buffer = String::new();

    // Check and skip UTF-8 BOM if present, but keep the first line
    reader
        .read_line(&mut buffer)
        .map_err(|e| ImportError::IoError(e))?;
    if buffer.starts_with("\u{feff}") {
        buffer = buffer.trim_start_matches("\u{feff}").to_string();
    }
    if !buffer.trim().is_empty() {
        lines.push(buffer.clone()); // Always keep the first line if it’s not empty
    }
    buffer.clear();

    // Read the file line-by-line
    for line in reader.lines() {
        let line = line.map_err(|e| ImportError::IoError(e))?;
        if line.trim() == "==========" {
            // Process the accumulated lines into a Clipping
            let clipping =
                parse_clipping(&lines).map_err(|e| ImportError::InvalidFormat(e))?;
            clippings.push(clipping);
            lines.clear();
        } else {
            lines.push(line);
        }
    }

    // Handle any remaining lines (in case file ends without delimiter)
    if !lines.is_empty() {
        let clipping =
            parse_clipping(&lines).map_err(|e| ImportError::InvalidFormat(e))?;
        clippings.push(clipping);
    }

    Ok(clippings)
}

// Parse a single clipping from a vector of lines
fn parse_clipping(lines: &[String]) -> Result<Clipping, String> {
    // Parse title and author from first line
    let re_title_author = Regex::new(r"^(.*?)(?:\s*\((.*?)\))?$").unwrap();
    let caps = re_title_author
        .captures(lines[0].trim())
        .ok_or_else(|| format!("Unable to parse line: {}", lines[0]))?;
    let book_title = caps[1].trim().to_string();
    let author = caps.get(2).map(|m| m.as_str().trim().to_string());

    // Parse date from second line
    let re_metadata = Regex::new(r"Added on (.*?)$").unwrap();
    let Some(caps) = re_metadata.captures(lines[1].trim()) else {
        return Err(format!("Invalid date on line {}", lines[1]));
    };
    let date_str = caps[1].trim();
    // Parse date into NaiveDateTime
    let added_at = parse_datetime(date_str).map_err(|e| format!("Error parsing date => {}", e))?;

    let metadata = lines[1].trim().to_string();
    // Line[2] is empty by specification
    let content = if lines.len() > 2 && lines[2].is_empty() {
        Some(lines[3..].join("\n")) // Join content lines if multi-line
    } else {
        None
    };

    Ok(Clipping {
        title: book_title,
        author,
        added_at,
        metadata,
        content,
    })
}

pub async fn import_clippings(path: &str) -> Result<String, ImportError> {
    let clippings = read_clippings_file(path)
        .map_err(|e| e)?;

    let mut books = HashMap::new();
    let mut authors = HashMap::new();
    let mut tx = db::get_pool()
        .begin()
        .await
        .map_err(|e| ImportError::DbError(e, "Failed to begin transaction".to_string()))?;
    let mut imported_books = 0;
    let mut imported_quotes = 0;

    for clipping in clippings.iter() {
        // Create book if it doesn't exist
        if !books.contains_key(&clipping.title) {
            match queries::get_book_by_original_id(clipping.title.clone(), &mut *tx).await {
                Ok(existing_book) => {
                    books.insert(clipping.title.clone(), existing_book.id.clone());
                }
                Err(_) => {
                    let book = queries::insert_book(clipping.title.clone(), None, None, &mut *tx)
                        .await
                        .map_err(|e| ImportError::DbError(e, "Failed to insert book".to_string()))?;
                    books.insert(clipping.title.clone(), book.id.clone());
                    imported_books += 1;
                }
            }
        }

        // Create author if it doesn't exist
        if let Some(author_name) = &clipping.author {
            if !authors.contains_key(author_name) {
                match queries::get_author_by_name(author_name.clone(), &mut *tx).await {
                    Ok(existing_author) => {
                        authors.insert(author_name.clone(), existing_author.id.clone());
                    }
                    Err(_) => {
                        let author = queries::insert_author(author_name.clone(), &mut *tx)
                            .await
                            .map_err(|e| ImportError::DbError(e, "Failed to insert author".to_string()))?;
                        authors.insert(author_name.clone(), author.id.clone());
                    }
                }
            }
        }

        let book_id = books.get(&clipping.title).unwrap();
        let author_id: Option<String> = match &clipping.author {
            Some(author_name) => authors.get(author_name).cloned(),
            None => None,
        };

        if let Some(content) = &clipping.content {
            // Check if the quote already exists by comparing the content and book id
            if let Ok(_) =
                queries::get_quote_by_book_and_content(book_id.clone(), content.clone(), &mut *tx)
                    .await
            {
                continue;
            }

            let quote = models::Quote {
                id: Uuid::new_v4().to_string(),
                book_id: Some(book_id.clone()),
                author_id: author_id,
                chapter: None,
                chapter_progress: None,
                content: clipping.content.clone(),
                starred: Some(0),
                created_at: clipping.added_at,
                updated_at: clipping.added_at,
                imported_at: Some(Utc::now().naive_utc()),
                deleted_at: None,
                original_id: None,
            };

            let _ = queries::insert_quote(&quote, &mut *tx)
                .await
                .map_err(|e| ImportError::DbError(e, "Failed to insert quote".to_string()))?;
            imported_quotes += 1;
        }
    }

    tx.commit().await.map_err(|e| ImportError::DbError(e, "Failed to commit transaction".to_string()))?;
    Ok(format!(
        "Imported successfully {} new books and {} new quotes",
        imported_books, imported_quotes
    ))
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
        let note = models::parse_quote(note_value)
            .map_err(|e| format!("Failed to parse JSON => {}", e))?;
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
            imported_at: None,
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
