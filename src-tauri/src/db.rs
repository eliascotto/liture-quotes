use crate::dbconn::*;
use crate::sqlschema::*;
use chrono::NaiveDateTime;
use serde_json::Value;
use std::fs::File;
use std::io::{self, Read};
use std::path::Path;
use sqlx::Row;
use uuid::Uuid;
use sqlx::sqlite::SqliteRow;

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

/// Get author by name
pub async fn get_author_by_name(author_name: String) -> Result<Author, sqlx::Error> {
    sqlx::query_as::<_, Author>("SELECT * FROM author WHERE name = ?")
        .bind(author_name)
        .fetch_one(get_pool())
        .await
}

/// Get book by ID
pub async fn get_book_by_id(id: String) -> Result<Book, sqlx::Error> {
    sqlx::query_as::<_, Book>("SELECT * FROM book WHERE id = ?")
        .bind(id)
        .fetch_one(get_pool())
        .await
}

/// Insert a new author
pub async fn insert_author(author_name: String) -> Result<Author, sqlx::Error> {
    // First insert the author
    sqlx::query("INSERT OR IGNORE INTO author (id, name) VALUES (?, ?)")
        .bind(Uuid::new_v4().to_string())
        .bind(author_name.clone())
        .execute(get_pool())
        .await?;

    // Then get the author (whether it was just inserted or already existed)
    get_author_by_name(author_name).await
}

/// Insert a new book
pub async fn insert_book(
    book_title: String,
    author_id: Option<String>,
) -> Result<Book, sqlx::Error> {
    let inserted = sqlx::query_as::<_, Book>(
        "INSERT OR IGNORE INTO book (id, title, author_id) VALUES (?, ?, ?) RETURNING *"
        )
        .bind(Uuid::new_v4().to_string())
        .bind(book_title)
        .bind(author_id)
        .fetch_one(get_pool())
        .await?;

    Ok(inserted)
}

pub async fn insert_quote(quote: &Quote) -> Result<Quote, sqlx::Error> {
    let inserted = sqlx::query_as::<_, Quote>(
        "INSERT OR IGNORE INTO quote 
            (id, book_id, author_id, chapter, chapter_progress, content, starred) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
            RETURNING *"
        )
        .bind(quote.id.clone())
        .bind(quote.book_id.clone())
        .bind(quote.author_id.clone())
        .bind(quote.chapter.clone())
        .bind(quote.chapter_progress)
        .bind(quote.content.clone())
        .bind(quote.starred)
        .fetch_one(get_pool())
        .await?;

   Ok(inserted)
}

/// Get all books
pub async fn get_books() -> Result<Vec<Book>, sqlx::Error> {
    sqlx::query_as::<_, Book>(
        "SELECT id, title, author_id, publication_date, created_at, updated_at, deleted_at
         FROM book
         WHERE deleted_at IS NULL
         ORDER BY title COLLATE NOCASE",
    )
    .fetch_all(get_pool())
    .await
}

/// Get all authors
pub async fn get_authors() -> Result<Vec<Author>, sqlx::Error> {
    sqlx::query_as::<_, Author>(
        "SELECT *
         FROM author
         WHERE deleted_at IS NULL
         ORDER BY name COLLATE NOCASE",
    )
    .fetch_all(get_pool())
    .await
}

/// Get all books by author
pub async fn get_all_books_by_author(author_id: String) -> Result<Vec<Book>, sqlx::Error> {
    sqlx::query_as::<_, Book>(
        "SELECT id, title, author_id, publication_date, created_at, updated_at, deleted_at
         FROM book
         WHERE author_id = ? AND deleted_at IS NULL 
         ORDER BY title COLLATE NOCASE",
    )
    .bind(author_id)
    .fetch_all(get_pool())
    .await
}

/// Get all quotes by book ID
pub async fn get_all_quotes_by_book_id(
    book_id: &str,
    sort_by: Option<&str>,
    sort_order: Option<&str>,
) -> Result<Vec<Quote>, sqlx::Error> {
    let order = sort_order.unwrap_or("ASC");
    let order_clause = if order.to_uppercase() == "DESC" {
        "DESC"
    } else {
        "ASC"
    };

    let sql = match sort_by {
        Some("date_created") => format!(
            "SELECT * FROM quote WHERE book_id = ? AND deleted_at IS NULL ORDER BY created_at {}",
            order_clause
        ),
        Some("date_modified") => format!(
            "SELECT * FROM quote WHERE book_id = ? AND deleted_at IS NULL ORDER BY updated_at {}",
            order_clause
        ),
        Some("chapter") => format!(
            "SELECT * FROM quote WHERE book_id = ? AND deleted_at IS NULL ORDER BY chapter {}",
            order_clause
        ),
        Some("chapter_progress") => format!(
            "SELECT * FROM quote WHERE book_id = ? AND deleted_at IS NULL ORDER BY chapter_progress {}",
            order_clause
        ),
        Some("starred") => format!(
            "SELECT * FROM quote WHERE book_id = ? AND deleted_at IS NULL ORDER BY starred {}",
            order_clause
        ),
        _ => "SELECT * FROM quote WHERE book_id = ? AND deleted_at IS NULL ORDER BY updated_at DESC".to_string(),
    };

    sqlx::query_as(&sql)
        .bind(book_id)
        .fetch_all(get_pool())
        .await
}

/// Find notes using full-text search
pub async fn find_quotes(search: &str) -> Result<Vec<QuoteFts>, sqlx::Error> {
    sqlx::query_as::<_, QuoteFts>(
        r#"SELECT q.id, q.content, b.title as "book", a.name as "author"
           FROM quote_fts q
           LEFT JOIN book b ON b.id = q.book
           LEFT JOIN author a ON a.id = q.author
           WHERE q.content MATCH ?"#,
    )
    .bind(search)
    .fetch_all(get_pool())
    .await
}

/// Find books by title
pub async fn find_books_by_title(search: &str) -> Result<Vec<Book>, sqlx::Error> {
    let search_pattern = format!("%{}%", search);
    sqlx::query_as::<_, Book>(
        "SELECT id, title, author_id, publication_date, created_at, updated_at, deleted_at
         FROM book
         WHERE title LIKE ? 
         ORDER BY title",
    )
    .bind(search_pattern)
    .fetch_all(get_pool())
    .await
}

/// Find authors by name
pub async fn find_authors_by_name(search: &str) -> Result<Vec<Author>, sqlx::Error> {
    let search_pattern = format!("%{}%", search);
    sqlx::query_as::<_, Author>(
        "SELECT *
         FROM author
         WHERE name LIKE ? 
         ORDER BY name",
    )
    .bind(search_pattern)
    .fetch_all(get_pool())
    .await
}

/// Get note by ID
pub async fn get_quote_by_id(id: &str) -> Result<Quote, sqlx::Error> {
    sqlx::query_as::<_, Quote>("SELECT * FROM quote WHERE id = ? AND deleted_at IS NULL")
        .bind(id)
        .fetch_one(get_pool())
        .await
}

/// Set note as hidden
pub async fn delete_quote(note_id: &str) -> Result<(), sqlx::Error> {
    sqlx::query("UPDATE quote SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?")
        .bind(note_id)
        .execute(get_pool())
        .await?;
    Ok(())
}

/// Set book as deleted
pub async fn delete_book(book_id: &str) -> Result<(), sqlx::Error> {
    sqlx::query("UPDATE book SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?")
        .bind(book_id)
        .execute(get_pool())
        .await?;
    Ok(())
}

/// Set author as deleted
pub async fn delete_author(author_id: String) -> Result<(), sqlx::Error> {
    // First mark the author as deleted
    sqlx::query("UPDATE author SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?")
        .bind(author_id.clone())
        .execute(get_pool())
        .await?;

    // Then mark all books by this author as deleted
    sqlx::query("UPDATE book SET deleted_at = CURRENT_TIMESTAMP WHERE author_id = ?")
        .bind(author_id)
        .execute(get_pool())
        .await?;

    Ok(())
}

/// Get quote starred status
pub async fn get_quote_starred(quote_id: &str) -> Result<i64, sqlx::Error> {
    let result = sqlx::query("SELECT starred FROM quote WHERE id = ?")
        .bind(quote_id)
        .fetch_one(get_pool())
        .await?;

    Ok(result.get("starred"))
}

/// Set quote starred status
pub async fn set_quote_starred(quote_id: &str, starred: i64) -> Result<Quote, sqlx::Error> {
    let updated = sqlx::query_as::<_, Quote>(
            "UPDATE quote SET starred = ? WHERE id = ? RETURNING *"
        )
        .bind(starred)
        .bind(quote_id)
        .fetch_one(get_pool())
        .await?;

    Ok(updated)
}

/// Update note
pub async fn update_quote(quote: &Quote) -> Result<Quote, sqlx::Error> {
    let updated = sqlx::query_as::<_, Quote>(
            "UPDATE quote SET content = ? WHERE id = ? RETURNING *"
        )
        .bind(quote.content.clone())
        .bind(quote.id.clone())
        .fetch_one(get_pool())
        .await?;

    Ok(updated)
}

/// Get random quote
pub async fn get_random_quote() -> Result<Option<(String, String, String)>, sqlx::Error> {
    let result = sqlx::query(
        "SELECT q.content, b.title, a.name 
         FROM quote q
         JOIN book b ON q.book_id = b.id
         JOIN author a ON b.author_id = a.id
         WHERE q.deleted_at IS NULL 
         AND q.content IS NOT NULL 
         AND q.content != ''
         AND b.deleted_at IS NULL
         AND a.deleted_at IS NULL
         ORDER BY RANDOM()
         LIMIT 1"
    )
    .fetch_optional(get_pool())
    .await?;

    Ok(result.map(|row| (
        row.get("content"), 
        row.get("title"), 
        row.get("name")
    )))
}

/// Import books from JSON
pub async fn import_books(path: &str) -> Result<String, String> {
    let books_values = read_json(path).map_err(|e| format!("Error reading JSON: {}", e))?;

    let books_vec = books_values
        .as_array()
        .ok_or("JSON file doesn't contain a valid array")?;

    let mut books = Vec::new();
    for bk in books_vec.iter() {
        let b = parse_book(bk).map_err(|e| format!("Failed to parse JSON => {}", e))?;
        books.push(b);
    }

    let pool = get_pool();
    let tx = pool.begin().await.map_err(|e| e.to_string())?;

    for book in books.iter() {
        let author_id = match &book.author {
            Some(book_author) => {
                let author = insert_author(book_author.clone())
                    .await
                    .map_err(|e| format!("Error creating Author => {}", e))?;
                Some(author.id)
            }
            None => None,
        };

        insert_book( book.title.clone(), author_id)
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
        let note = parse_quote(note_value).map_err(|e| format!("Failed to parse JSON => {}", e))?;
        quotes.push(note);
    }

    let pool = get_pool();
    let mut tx = pool.begin().await.map_err(|e| e.to_string())?;

    for quote in quotes.iter() {
        let book = get_book_by_id(quote.book_id.clone().unwrap())
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

        let n = Quote {
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

pub async fn get_starred_quotes() -> Result<Vec<StarredQuote>, sqlx::Error> {
    sqlx::query(
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
        .fetch_all(get_pool())
        .await
}
