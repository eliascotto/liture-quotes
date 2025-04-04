use crate::models::*;
use sqlx::{Executor, Row, Sqlite, SqlitePool};
use uuid::Uuid;

/// Format the order and sort by clauses for db queries with sorting.
/// Uses default values if not provided.
fn extract_order_clauses(sort_by: Option<&str>, order: Option<&str>) -> (String, String) {
    let order_clause = if order.unwrap_or("DESC").to_uppercase() == "DESC" {
        "DESC"
    } else {
        "ASC"
    };

    let sort_by_clause = match sort_by {
        Some("date_created") => "created_at",
        Some("date_modified") => "updated_at",
        Some("chapter") => "chapter_id",
        Some("chapter_progress") => "chapter_progress",
        Some("starred") => "starred",
        _ => "updated_at",
    };

    (order_clause.to_string(), sort_by_clause.to_string())
}

// Insert a new quote with some default values
pub async fn insert_quote_lite(
    content: String,
    book_id: Option<String>,
    author_id: Option<String>,
    starred: Option<i64>,
    pool: &SqlitePool,
) -> Result<Quote, sqlx::Error> {
    let now = chrono::Local::now().naive_utc();
    let quote = insert_quote(
        &Quote {
            id: Uuid::new_v4().to_string(),
            content: Some(content),
            book_id: book_id,
            author_id: author_id,
            chapter_id: None,
            chapter_progress: None,
            starred: starred,
            created_at: now,
            updated_at: now,
            imported_at: Some(now),
            deleted_at: None,
            original_id: None,
        },
        pool,
    )
    .await?;

    Ok(quote)
}

// Insert a new note with some default values
pub async fn insert_note_lite(
    content: String,
    quote_id: Option<String>,
    book_id: Option<String>,
    author_id: Option<String>,
    pool: &SqlitePool,
) -> Result<Note, sqlx::Error> {
    let now = chrono::Local::now().naive_utc();
    let note = insert_note(
        &Note {
            id: Uuid::new_v4().to_string(),
            content: Some(content),
            quote_id: quote_id,
            book_id: book_id,
            author_id: author_id,
            created_at: now,
            updated_at: now,
            deleted_at: None,
        },
        pool,
    )
    .await?;

    Ok(note)
}

/// Get author by name
pub async fn get_author_by_name<'e, E>(
    author_name: String,
    executor: E,
) -> Result<Author, sqlx::Error>
where
    E: Executor<'e, Database = Sqlite>,
{
    sqlx::query_as::<_, Author>("SELECT * FROM author WHERE name = ?")
        .bind(author_name)
        .fetch_one(executor)
        .await
}

/// Get book by ID
pub async fn get_book_by_id<'e, E>(id: String, executor: E) -> Result<Book, sqlx::Error>
where
    E: Executor<'e, Database = Sqlite>,
{
    sqlx::query_as::<_, Book>("SELECT * FROM book WHERE id = ?")
        .bind(id)
        .fetch_one(executor)
        .await
}

/// Insert a new author
pub async fn insert_author<'e, E>(author_name: String, executor: E) -> Result<Author, sqlx::Error>
where
    E: Executor<'e, Database = Sqlite>,
{
    let author = sqlx::query_as::<_, Author>(
        "INSERT OR IGNORE INTO author (id, name) VALUES (?, ?) RETURNING *",
    )
    .bind(Uuid::new_v4().to_string())
    .bind(author_name.clone())
    .fetch_one(executor)
    .await?;

    Ok(author)
}

/// Insert a new book
pub async fn insert_book_with_defaults<'e, E>(
    book_title: String,
    author_id: Option<String>,
    original_id: Option<String>,
    executor: E,
) -> Result<Book, sqlx::Error>
where
    E: Executor<'e, Database = Sqlite>,
{
    sqlx::query_as::<_, Book>(
        "INSERT OR IGNORE INTO book (id, title, author_id, original_id) VALUES (?, ?, ?, ?) RETURNING *",
    )
    .bind(Uuid::new_v4().to_string())
    .bind(book_title)
    .bind(author_id)
    .bind(original_id)
    .fetch_one(executor)
    .await
}

pub async fn insert_quote<'e, E>(quote: &Quote, executor: E) -> Result<Quote, sqlx::Error>
where
    E: Executor<'e, Database = Sqlite>,
{
    sqlx::query_as::<_, Quote>(
        "INSERT OR IGNORE INTO quote 
            (
                id,
                book_id,
                author_id,
                chapter_id,
                chapter_progress,
                content,
                starred,
                created_at,
                updated_at,
                imported_at,
                deleted_at,
                original_id
            ) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            RETURNING *",
    )
    .bind(quote.id.clone())
    .bind(quote.book_id.clone())
    .bind(quote.author_id.clone())
    .bind(quote.chapter_id.clone())
    .bind(quote.chapter_progress)
    .bind(quote.content.clone())
    .bind(quote.starred)
    .bind(quote.created_at)
    .bind(quote.updated_at)
    .bind(quote.imported_at)
    .bind(quote.deleted_at)
    .bind(quote.original_id.clone())
    .fetch_one(executor)
    .await
}

pub async fn insert_chapter<'e, E>(chapter: &Chapter, executor: E) -> Result<Chapter, sqlx::Error>
where
    E: Executor<'e, Database = Sqlite>,
{
    sqlx::query_as::<_, Chapter>(
        "INSERT OR IGNORE INTO chapter
        (id, book_id, title, volume_index, original_id) 
        VALUES (?, ?, ?, ?, ?) 
        RETURNING *",
    )
    .bind(chapter.id.clone())
    .bind(chapter.book_id.clone())
    .bind(chapter.title.clone())
    .bind(chapter.volume_index)
    .bind(chapter.original_id.clone())
    .fetch_one(executor)
    .await
}

pub async fn get_chapters_by_book<'e, E>(
    book_id: &str,
    executor: E,
) -> Result<Vec<Chapter>, sqlx::Error>
where
    E: Executor<'e, Database = Sqlite>,
{
    sqlx::query_as::<_, Chapter>("SELECT * FROM chapter WHERE book_id = ? AND deleted_at IS NULL")
        .bind(book_id)
        .fetch_all(executor)
        .await
}

pub async fn fetch_notes_by_book<'e, E>(
    book_id: &str,
    executor: E,
) -> Result<Vec<Note>, sqlx::Error>
where
    E: Executor<'e, Database = Sqlite>,
{
    sqlx::query_as::<_, Note>("SELECT * FROM note WHERE book_id = ? AND deleted_at IS NULL")
        .bind(book_id)
        .fetch_all(executor)
        .await
}

pub async fn insert_note<'e, E>(note: &Note, executor: E) -> Result<Note, sqlx::Error>
where
    E: Executor<'e, Database = Sqlite>,
{
    sqlx::query_as::<_, Note>(
        "INSERT OR IGNORE INTO note 
        (id, book_id, author_id, quote_id, content, created_at, updated_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
        RETURNING *",
    )
    .bind(note.id.clone())
    .bind(note.book_id.clone())
    .bind(note.author_id.clone())
    .bind(note.quote_id.clone())
    .bind(note.content.clone())
    .bind(note.created_at)
    .bind(note.updated_at)
    .fetch_one(executor)
    .await
}

pub async fn update_note<'e, E>(
    note_id: &str,
    content: &str,
    executor: E,
) -> Result<Note, sqlx::Error>
where
    E: Executor<'e, Database = Sqlite>,
{
    sqlx::query_as::<_, Note>(
        "UPDATE note 
        SET content = ?1, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?2
        RETURNING *",
    )
    .bind(content)
    .bind(note_id)
    .fetch_one(executor)
    .await
}

pub async fn update_author_name<'e, E>(
    author_id: &str,
    author_name: &str,
    executor: E,
) -> Result<Author, sqlx::Error>
where
    E: Executor<'e, Database = Sqlite>,
{
    sqlx::query_as::<_, Author>("UPDATE author SET name = ?1 WHERE id = ?2 RETURNING *")
        .bind(author_name)
        .bind(author_id)
        .fetch_one(executor)
        .await
}

/// Get all books
pub async fn get_books<'e, E>(executor: E) -> Result<Vec<Book>, sqlx::Error>
where
    E: Executor<'e, Database = Sqlite>,
{
    sqlx::query_as::<_, Book>(
        "SELECT *
         FROM book
         WHERE deleted_at IS NULL
         ORDER BY title COLLATE NOCASE",
    )
    .fetch_all(executor)
    .await
}

/// Get all authors
pub async fn get_authors<'e, E>(executor: E) -> Result<Vec<Author>, sqlx::Error>
where
    E: Executor<'e, Database = Sqlite>,
{
    sqlx::query_as::<_, Author>(
        "SELECT *
         FROM author
         WHERE deleted_at IS NULL
         ORDER BY name COLLATE NOCASE",
    )
    .fetch_all(executor)
    .await
}

/// Get all books by author
pub async fn get_all_books_by_author<'e, E>(
    author_id: String,
    executor: E,
) -> Result<Vec<Book>, sqlx::Error>
where
    E: Executor<'e, Database = Sqlite>,
{
    sqlx::query_as::<_, Book>(
        "SELECT *
         FROM book
         WHERE author_id = ? AND deleted_at IS NULL 
         ORDER BY title COLLATE NOCASE",
    )
    .bind(author_id)
    .fetch_all(executor)
    .await
}

/// Get all quotes by book ID
pub async fn get_all_quotes_by_book_id<'e, E>(
    book_id: &str,
    sort_by: Option<&str>,
    sort_order: Option<&str>,
    executor: E,
) -> Result<Vec<Quote>, sqlx::Error>
where
    E: Executor<'e, Database = Sqlite>,
{
    let order = sort_order.unwrap_or("ASC");
    let (order_clause, sort_by_clause) = extract_order_clauses(sort_by, Some(order));

    let sql = format!(
        "SELECT * FROM quote WHERE book_id = ? AND deleted_at IS NULL ORDER BY {} {}",
        sort_by_clause, order_clause
    );

    sqlx::query_as(&sql).bind(book_id).fetch_all(executor).await
}

/// Find notes using full-text search
pub async fn find_quotes<'e, E>(search: &str, executor: E) -> Result<Vec<QuoteFts>, sqlx::Error>
where
    E: Executor<'e, Database = Sqlite>,
{
    sqlx::query_as::<_, QuoteFts>(
        r#"SELECT 
                q.id, 
                q.content,
                q.chapter_id,
                q.chapter_progress,
                q.starred,
                q.created_at,
                q.updated_at,
                q.deleted_at,
                q.imported_at,
                q.original_id,
                q.book_id,
                q.author_id,
                fts.book_title,
                fts.author_name
            FROM quote_fts fts
            JOIN quote q ON q.id = fts.id
            WHERE fts.content LIKE ?;"#,
    )
    .bind(format!("%{}%", search))
    .fetch_all(executor)
    .await
}

pub async fn find_quotes_by_book_title<'e, E>(
    search: &str,
    book_title: &str,
    executor: E,
) -> Result<Vec<QuoteFts>, sqlx::Error>
where
    E: Executor<'e, Database = Sqlite>,
{
    sqlx::query_as::<_, QuoteFts>(
        r#"SELECT 
                q.id, 
                q.content,
                q.chapter_id,
                q.chapter_progress,
                q.starred,
                q.created_at,
                q.updated_at,
                q.deleted_at,
                q.imported_at,
                q.original_id,
                q.book_id,
                q.author_id,
                fts.book_title,
                fts.author_name
            FROM quote_fts fts
            JOIN quote q ON q.id = fts.id
            WHERE fts.content MATCH ? AND fts.book_title = ?;"#,
    )
    .bind(search)
    .bind(book_title)
    .fetch_all(executor)
    .await
}

pub async fn find_quotes_by_author_name<'e, E>(
    search: &str,
    author_name: &str,
    executor: E,
) -> Result<Vec<QuoteFts>, sqlx::Error>
where
    E: Executor<'e, Database = Sqlite>,
{
    sqlx::query_as::<_, QuoteFts>(
        r#"SELECT 
                q.id, 
                q.content,
                q.chapter_id,
                q.chapter_progress,
                q.starred,
                q.created_at,
                q.updated_at,
                q.deleted_at,
                q.imported_at,
                q.original_id,
                q.book_id,
                q.author_id,
                fts.book_title, 
                fts.author_name
            FROM quote_fts fts
            JOIN quote q ON q.id = fts.id
            WHERE fts.content MATCH ? AND fts.author_name = ?;"#,
    )
    .bind(search)
    .bind(author_name)
    .fetch_all(executor)
    .await
}

/// Find books by title
pub async fn find_books_by_title<'e, E>(search: &str, executor: E) -> Result<Vec<Book>, sqlx::Error>
where
    E: Executor<'e, Database = Sqlite>,
{
    let search_pattern = format!("%{}%", search);
    sqlx::query_as::<_, Book>(
        "SELECT *
         FROM book
         WHERE title LIKE ? 
         ORDER BY title",
    )
    .bind(search_pattern)
    .fetch_all(executor)
    .await
}

/// Find authors by name
pub async fn find_authors_by_name<'e, E>(
    search: &str,
    executor: E,
) -> Result<Vec<Author>, sqlx::Error>
where
    E: Executor<'e, Database = Sqlite>,
{
    let search_pattern = format!("%{}%", search);
    sqlx::query_as::<_, Author>(
        "SELECT *
         FROM author
         WHERE name LIKE ? 
         ORDER BY name",
    )
    .bind(search_pattern)
    .fetch_all(executor)
    .await
}

/// Get quote by ID
pub async fn get_quote_by_id<'e, E>(id: &str, executor: E) -> Result<Quote, sqlx::Error>
where
    E: Executor<'e, Database = Sqlite>,
{
    sqlx::query_as::<_, Quote>("SELECT * FROM quote WHERE id = ? AND deleted_at IS NULL")
        .bind(id)
        .fetch_one(executor)
        .await
}

/// Set quote as hidden
pub async fn delete_quote<'e, E>(quote_id: &str, executor: E) -> Result<(), sqlx::Error>
where
    E: Executor<'e, Database = Sqlite>,
{
    sqlx::query("UPDATE quote SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?")
        .bind(quote_id)
        .execute(executor)
        .await?;
    Ok(())
}

/// Set book as deleted
pub async fn delete_book<'e, E>(book_id: &str, executor: E) -> Result<(), sqlx::Error>
where
    E: Executor<'e, Database = Sqlite>,
{
    sqlx::query("UPDATE book SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?")
        .bind(book_id)
        .execute(executor)
        .await?;
    Ok(())
}

/// Set author as deleted
pub async fn delete_author<'e, E>(author_id: String, executor: E) -> Result<(), sqlx::Error>
where
    E: Executor<'e, Database = Sqlite>,
{
    sqlx::query("UPDATE author SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?")
        .bind(author_id.clone())
        .execute(executor)
        .await?;

    Ok(())
}

pub async fn delete_author_books<'e, E>(author_id: String, executor: E) -> Result<(), sqlx::Error>
where
    E: Executor<'e, Database = Sqlite>,
{
    sqlx::query("UPDATE book SET deleted_at = CURRENT_TIMESTAMP WHERE author_id = ?")
        .bind(author_id)
        .execute(executor)
        .await?;

    Ok(())
}

/// Get quote starred status
pub async fn get_quote_starred<'e, E>(quote_id: &str, executor: E) -> Result<i64, sqlx::Error>
where
    E: Executor<'e, Database = Sqlite>,
{
    sqlx::query("SELECT starred FROM quote WHERE id = ?")
        .bind(quote_id)
        .fetch_one(executor)
        .await
        .map(|row| row.get("starred"))
}

/// Set quote starred status
pub async fn set_quote_starred<'e, E>(
    quote_id: &str,
    starred: i64,
    executor: E,
) -> Result<Quote, sqlx::Error>
where
    E: Executor<'e, Database = Sqlite>,
{
    sqlx::query_as::<_, Quote>("UPDATE quote SET starred = ? WHERE id = ? RETURNING *")
        .bind(starred)
        .bind(quote_id)
        .fetch_one(executor)
        .await
}

/// Toggle quote starred status
pub async fn toggle_quote_starred<'e, E>(quote_id: &str, executor: E) -> Result<Quote, sqlx::Error>
where
    E: Executor<'e, Database = Sqlite>,
{
    sqlx::query_as::<_, Quote>(
        "UPDATE quote
            SET starred = CASE starred
                WHEN 0 THEN 1
                WHEN 1 THEN 0
                ELSE CASE WHEN starred IS NULL THEN 1 ELSE 0 END
            END
            WHERE id = ?
            RETURNING *",
    )
    .bind(quote_id)
    .fetch_one(executor)
    .await
}

/// Update quote
pub async fn update_quote_content<'e, E>(
    id: &str,
    content: &str,
    executor: E,
) -> Result<Quote, sqlx::Error>
where
    E: Executor<'e, Database = Sqlite>,
{
    sqlx::query_as::<_, Quote>("UPDATE quote SET content = ? WHERE id = ? RETURNING *")
        .bind(content)
        .bind(id)
        .fetch_one(executor)
        .await
}

/// Get random quote
pub async fn get_random_quote<'e, E>(executor: E) -> Result<Option<RandomQuote>, sqlx::Error>
where
    E: Executor<'e, Database = Sqlite>,
{
    sqlx::query_as::<_, RandomQuote>(
        "SELECT 
            q.content, 
            b.title as book_title,
            b.id as book_id,
            a.name as author_name,
            a.id as author_id
         FROM quote q
         JOIN book b ON q.book_id = b.id
         JOIN author a ON b.author_id = a.id
         WHERE q.deleted_at IS NULL 
         AND q.content IS NOT NULL 
         AND q.content != ''
         AND b.deleted_at IS NULL
         AND a.deleted_at IS NULL
         ORDER BY RANDOM()
         LIMIT 1",
    )
    .fetch_optional(executor)
    .await
}

pub async fn get_starred_quotes<'e, E>(
    sort_by: Option<&str>,
    sort_order: Option<&str>,
    executor: E,
) -> Result<Vec<StarredQuote>, sqlx::Error>
where
    E: Executor<'e, Database = Sqlite>,
{
    let (order_clause, sort_by_clause) = extract_order_clauses(sort_by, sort_order);
    let sql = format!(
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
        ORDER BY q.{} {}",
        sort_by_clause, order_clause
    );

    sqlx::query_as::<_, StarredQuote>(&sql)
        .fetch_all(executor)
        .await
}

/// Get book by original ID
pub async fn get_book_by_original_id<'e, E>(
    original_id: String,
    executor: E,
) -> Result<Book, sqlx::Error>
where
    E: Executor<'e, Database = Sqlite>,
{
    sqlx::query_as::<_, Book>("SELECT * FROM book WHERE original_id = ?")
        .bind(original_id)
        .fetch_one(executor)
        .await
}

/// Get chapter by original ID
pub async fn get_chapter_by_original_id<'e, E>(
    original_id: String,
    executor: E,
) -> Result<Chapter, sqlx::Error>
where
    E: Executor<'e, Database = Sqlite>,
{
    sqlx::query_as::<_, Chapter>("SELECT * FROM chapter WHERE original_id = ?")
        .bind(original_id)
        .fetch_one(executor)
        .await
}

/// Get quote by original ID
pub async fn get_quote_by_original_id<'e, E>(
    original_id: String,
    executor: E,
) -> Result<Quote, sqlx::Error>
where
    E: Executor<'e, Database = Sqlite>,
{
    sqlx::query_as::<_, Quote>("SELECT * FROM quote WHERE original_id = ?")
        .bind(original_id)
        .fetch_one(executor)
        .await
}

pub async fn get_quote_by_book_and_content<'e, E>(
    book_id: String,
    content: String,
    executor: E,
) -> Result<Quote, sqlx::Error>
where
    E: Executor<'e, Database = Sqlite>,
{
    sqlx::query_as::<_, Quote>("SELECT * FROM quote WHERE book_id = ? AND content = ?")
        .bind(book_id)
        .bind(content)
        .fetch_one(executor)
        .await
}

/// Update book
pub async fn update_book<'e, E>(book: &Book, executor: E) -> Result<Book, sqlx::Error>
where
    E: Executor<'e, Database = Sqlite>,
{
    sqlx::query_as::<_, Book>(
        "UPDATE book 
        SET title = ?, author_id = ?, publication_year = ?, created_at = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? RETURNING *"
    )
    .bind(book.title.clone())
    .bind(book.author_id.clone())
    .bind(book.publication_year.clone())
    .bind(book.created_at)
    .bind(book.id.clone())
    .fetch_one(executor)
    .await
}
