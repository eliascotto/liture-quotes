use crate::db::*;
use crate::models::*;
use sqlx::Row;
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
        Some("chapter") => "chapter",
        Some("chapter_progress") => "chapter_progress",
        Some("starred") => "starred",
        _ => "updated_at",
    };

    (order_clause.to_string(), sort_by_clause.to_string())
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
        "INSERT OR IGNORE INTO book (id, title, author_id) VALUES (?, ?, ?) RETURNING *",
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
            RETURNING *",
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

pub async fn insert_chapter(chapter: &Chapter) -> Result<Chapter, sqlx::Error> {
    let inserted = sqlx::query_as::<_, Chapter>(
        "INSERT OR IGNORE INTO chapter (id, book_id, title, volume_index) VALUES (?, ?, ?, ?)",
    )
    .bind(chapter.id.clone())
    .bind(chapter.book_id.clone())
    .bind(chapter.title.clone())
    .bind(chapter.volume_index)
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
    let (order_clause, sort_by_clause) = extract_order_clauses(sort_by, Some(order));

    let sql = format!(
        "SELECT * FROM quote WHERE book_id = ? AND deleted_at IS NULL ORDER BY {} {}",
        sort_by_clause, order_clause
    );

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
    let updated = sqlx::query_as::<_, Quote>("UPDATE quote SET starred = ?  RETURNING *")
        .bind(starred)
        .bind(quote_id)
        .fetch_one(get_pool())
        .await?;

    Ok(updated)
}

/// Toggle quote starred status
pub async fn toggle_quote_starred(quote_id: &str) -> Result<Quote, sqlx::Error> {
    let updated = sqlx::query_as::<_, Quote>(
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
    .fetch_one(get_pool())
    .await?;

    Ok(updated)
}

/// Update note
pub async fn update_quote_content(id: &str, content: &str) -> Result<Quote, sqlx::Error> {
    let updated =
        sqlx::query_as::<_, Quote>("UPDATE quote SET content = ? WHERE id = ? RETURNING *")
            .bind(content)
            .bind(id)
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
         LIMIT 1",
    )
    .fetch_optional(get_pool())
    .await?;

    Ok(result.map(|row| (row.get("content"), row.get("title"), row.get("name"))))
}

pub async fn get_starred_quotes(
    sort_by: Option<&str>,
    sort_order: Option<&str>,
) -> Result<Vec<StarredQuote>, sqlx::Error> {
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
        .fetch_all(get_pool())
        .await
}
