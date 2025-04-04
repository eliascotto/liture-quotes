use litforge_notes_lib::queries;
use litforge_notes_lib::models::{Author, Book, Chapter};
use sqlx::SqlitePool;
use chrono::Utc;

const STARRED_QUOTES_COUNT: usize = 3;
const CHAPTERS_COUNT: usize = 3;

#[cfg(test)]
pub async fn init_db(pool: &SqlitePool) -> Result<(Author, Book), sqlx::Error> {
    let author = queries::insert_author("George R.R. Martin".to_string(), pool).await?;
    let book = queries::insert_book(
        "A Dance with Dragons".to_string(),
        Some(author.id.clone()),
        None,
        pool,
    )
    .await?;
    
    // Quote
    let _ = queries::insert_quote_lite(
        "A reader lives a thousand lives before he dies... The man who never reads lives only one.".to_string(),
        Some(book.id.clone()),
        Some(author.id.clone()),
        Some(0),
        pool,
    )
    .await?;

    // Quote with comment
    let quote_with_comment = queries::insert_quote_lite(
        "These are just examples, add your own quotes to make it yours! You can edit a quote by double clicking on it.".to_string(),
        Some(book.id.clone()),
        Some(author.id.clone()),
        Some(0),
        pool,
    )
    .await?;
    let _ = queries::insert_note_lite(
        "This is a comment. Double click to edit.".to_string(),
        Some(quote_with_comment.id),
        Some(book.id.clone()),
        Some(author.id.clone()),
        pool,
    )
    .await?;

    // Starred quotes - multiple
    for i in 0..STARRED_QUOTES_COUNT {
        let _ = queries::insert_quote_lite(
            format!("{} - This is a starred quote.", i),
            Some(book.id.clone()),
            Some(author.id.clone()),
            Some(1),
            pool,
        )
        .await?;
    }

    // Chapters
    for i in 0..CHAPTERS_COUNT {
        let now = Utc::now().naive_utc();
        let _ = queries::insert_chapter(
            &Chapter {
                id: format!("chapter_{}", i),
                book_id: Some(book.id.clone()),
                title: format!("Chapter {}", i),
                volume_index: i as i64,
                created_at: now,
                updated_at: now,
                deleted_at: None,
                original_id: None,
            },
            pool,
        )
        .await?;
    }

    Ok((author, book))
}

#[sqlx::test(migrations = "../migrations")]
async fn test_get_random_quote(pool: SqlitePool) {
    init_db(&pool).await.unwrap();

    let quote = queries::get_random_quote(&pool).await.unwrap();
    assert!(quote.is_some());
}

#[sqlx::test(migrations = "../migrations")]
async fn test_get_starred_quotes(pool: SqlitePool) {
    init_db(&pool).await.unwrap();

    let quotes = queries::get_starred_quotes(None, None, &pool).await.unwrap();
    assert_eq!(quotes.len(), STARRED_QUOTES_COUNT);
}

#[sqlx::test(migrations = "../migrations")]
async fn test_get_starred_quotes_with_sort_by(pool: SqlitePool) {
    init_db(&pool).await.unwrap();

    let mut quotes = queries::get_starred_quotes(Some("created_at"), Some("desc"), &pool).await.unwrap();
    assert_eq!(quotes.len(), STARRED_QUOTES_COUNT);
    assert_eq!(quotes[0].content, Some("2 - This is a starred quote.".to_string()));

    quotes = queries::get_starred_quotes(Some("created_at"), Some("asc"), &pool).await.unwrap();
    assert_eq!(quotes[0].content, Some("0 - This is a starred quote.".to_string()));
}

#[sqlx::test(migrations = "../migrations")]
async fn test_get_author_by_name(pool: SqlitePool) {
    init_db(&pool).await.unwrap();

    let author = queries::get_author_by_name("George R.R. Martin".to_string(), &pool).await.unwrap();
    assert_eq!(author.name, "George R.R. Martin");
}

#[sqlx::test(migrations = "../migrations")]
async fn test_get_book_by_id(pool: SqlitePool) {
    let (_, book) = init_db(&pool).await.unwrap();

    let book = queries::get_book_by_id(book.id, &pool).await.unwrap();
    assert_eq!(book.title, "A Dance with Dragons");
}

#[sqlx::test(migrations = "../migrations")]
async fn test_get_chapters_by_book(pool: SqlitePool) {
    let (_, book) = init_db(&pool).await.unwrap();

    let chapters = queries::get_chapters_by_book(&book.id, &pool).await.unwrap();
    assert_eq!(chapters.len(), CHAPTERS_COUNT);
}

#[sqlx::test(migrations = "../migrations")]
async fn test_update_author_name(pool: SqlitePool) {
    let (author, _) = init_db(&pool).await.unwrap();

    let author = queries::update_author_name(&author.id, "Lucas Tester", &pool).await.unwrap();
    assert_eq!(author.name, "Lucas Tester");
}

#[sqlx::test(migrations = "../migrations")]
async fn test_get_books(pool: SqlitePool) {
    init_db(&pool).await.unwrap();

    let books = queries::get_books(&pool).await.unwrap();
    assert_eq!(books.len(), 1);
    assert_eq!(books[0].title, "A Dance with Dragons");
}

#[sqlx::test(migrations = "../migrations")]
async fn test_get_authors(pool: SqlitePool) {
    init_db(&pool).await.unwrap();

    let authors = queries::get_authors(&pool).await.unwrap();
    assert_eq!(authors.len(), 1);
    assert_eq!(authors[0].name, "George R.R. Martin");
}

#[sqlx::test(migrations = "../migrations")]
async fn test_get_all_books_by_author(pool: SqlitePool) {
    let (author, _) = init_db(&pool).await.unwrap();

    let books = queries::get_all_books_by_author(author.id, &pool).await.unwrap();
    assert_eq!(books.len(), 1);
    assert_eq!(books[0].title, "A Dance with Dragons");
}

#[sqlx::test(migrations = "../migrations")]
async fn test_get_all_quotes_by_book_id(pool: SqlitePool) {
    let (_, book) = init_db(&pool).await.unwrap();

    let quotes = queries::get_all_quotes_by_book_id(&book.id, None, None, &pool).await.unwrap();
    assert_eq!(quotes.len(), 5);
}

#[sqlx::test(migrations = "../migrations")]
async fn test_update_quote_content(pool: SqlitePool) {
    let (_, book) = init_db(&pool).await.unwrap();
    let quote = queries::get_all_quotes_by_book_id(&book.id, None, None, &pool).await.unwrap()[0].clone();

    let quote = queries::update_quote_content(&quote.id, "New content", &pool).await.unwrap();
    assert_eq!(quote.content, Some("New content".to_string()));
}
