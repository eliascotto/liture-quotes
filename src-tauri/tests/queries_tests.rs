use chrono::Utc;
use litforge_notes_lib::models::{Author, Book, Chapter, Note, Quote};
use litforge_notes_lib::queries;
use sqlx::SqlitePool;
use std::time::{SystemTime, UNIX_EPOCH};
use uuid::Uuid;
const STARRED_QUOTES_COUNT: usize = 3;
const CHAPTERS_COUNT: usize = 3;

fn generate_random_string(length: usize) -> String {
    let n = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs();
    let mut s = String::with_capacity(length);
    for i in 0..length {
        s.push((48 + (n >> i & 15)) as u8 as char); // '0' to '9', 'a' to 'f'
    }
    s
}
#[derive(Debug, Clone)]
struct TestData {
    author: Author,
    book: Book,
    quote: Quote,
    note: Note,
    chapter: Chapter,
}

#[cfg(test)]
async fn init_db(pool: &SqlitePool) -> Result<TestData, sqlx::Error> {
    let author = queries::insert_author("George R.R. Martin".to_string(), pool).await?;
    let book = queries::insert_book_with_defaults(
        "A Dance with Dragons".to_string(),
        Some(author.id.clone()),
        Some(generate_random_string(10)),
        pool,
    )
    .await?;

    // Chapters
    let mut chapters = Vec::new();
    for i in 0..CHAPTERS_COUNT {
        let now = Utc::now().naive_utc();
        let chapter = queries::insert_chapter(
            &Chapter {
                id: format!("chapter_{}", i),
                book_id: Some(book.id.clone()),
                title: format!("Chapter {}", i),
                volume_index: i as i64,
                created_at: now,
                updated_at: now,
                deleted_at: None,
                original_id: Some(generate_random_string(10)),
            },
            pool,
        )
        .await?;
        chapters.push(chapter);
    }

    let now = Utc::now().naive_utc();
    // Quote
    let quote = queries::insert_quote(
        &Quote {
            id: Uuid::new_v4().to_string(),
            book_id: Some(book.id.clone()),
            content: Some("A reader lives a thousand lives before he dies... The man who never reads lives only one.".to_string()),
            created_at: now,
            updated_at: now,
            deleted_at: None,
            original_id: Some(generate_random_string(10)),
            author_id: Some(author.id.clone()),
            chapter_id: Some(chapters[0].id.clone()),
            chapter_progress: None,
            starred: Some(0),
            imported_at: Some(now),
        },
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
    let note = queries::insert_note_lite(
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

    Ok(TestData {
        author,
        book,
        quote,
        note,
        chapter: chapters[0].clone(),
    })
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

    let quotes = queries::get_starred_quotes(None, None, &pool)
        .await
        .unwrap();
    assert_eq!(quotes.len(), STARRED_QUOTES_COUNT);
}

#[sqlx::test(migrations = "../migrations")]
async fn test_get_starred_quotes_with_sort_by(pool: SqlitePool) {
    init_db(&pool).await.unwrap();

    let mut quotes = queries::get_starred_quotes(Some("created_at"), Some("desc"), &pool)
        .await
        .unwrap();
    assert_eq!(quotes.len(), STARRED_QUOTES_COUNT);
    assert_eq!(
        quotes[0].content,
        Some("2 - This is a starred quote.".to_string())
    );

    quotes = queries::get_starred_quotes(Some("created_at"), Some("asc"), &pool)
        .await
        .unwrap();
    assert_eq!(
        quotes[0].content,
        Some("0 - This is a starred quote.".to_string())
    );
}

#[sqlx::test(migrations = "../migrations")]
async fn test_get_author_by_name(pool: SqlitePool) {
    init_db(&pool).await.unwrap();

    let author = queries::get_author_by_name("George R.R. Martin".to_string(), &pool)
        .await
        .unwrap();
    assert_eq!(author.name, "George R.R. Martin");
}

#[sqlx::test(migrations = "../migrations")]
async fn test_get_book_by_id(pool: SqlitePool) {
    let test_data = init_db(&pool).await.unwrap();

    let book = queries::get_book_by_id(test_data.book.id, &pool)
        .await
        .unwrap();
    assert_eq!(book.title, "A Dance with Dragons");
}

#[sqlx::test(migrations = "../migrations")]
async fn test_get_chapters_by_book(pool: SqlitePool) {
    let test_data = init_db(&pool).await.unwrap();

    let chapters = queries::get_chapters_by_book(&test_data.book.id, &pool)
        .await
        .unwrap();
    assert_eq!(chapters.len(), CHAPTERS_COUNT);
}

#[sqlx::test(migrations = "../migrations")]
async fn test_update_author_name(pool: SqlitePool) {
    let test_data = init_db(&pool).await.unwrap();

    let author = queries::update_author_name(&test_data.author.id, "Lucas Tester", &pool)
        .await
        .unwrap();
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
    let test_data = init_db(&pool).await.unwrap();

    let books = queries::get_all_books_by_author(test_data.author.id, &pool)
        .await
        .unwrap();
    assert_eq!(books.len(), 1);
    assert_eq!(books[0].title, "A Dance with Dragons");
}

#[sqlx::test(migrations = "../migrations")]
async fn test_get_all_quotes_by_book_id(pool: SqlitePool) {
    let test_data = init_db(&pool).await.unwrap();

    let quotes = queries::get_all_quotes_by_book_id(&test_data.book.id, None, None, &pool)
        .await
        .unwrap();
    assert_eq!(quotes.len(), 5);
}

#[sqlx::test(migrations = "../migrations")]
async fn test_update_quote_content(pool: SqlitePool) {
    let test_data = init_db(&pool).await.unwrap();

    let quote = queries::update_quote_content(&test_data.quote.id, "New content", &pool)
        .await
        .unwrap();
    assert_eq!(quote.content, Some("New content".to_string()));
}

#[sqlx::test(migrations = "../migrations")]
async fn test_get_quote_by_book_and_content(pool: SqlitePool) {
    let test_data = init_db(&pool).await.unwrap();

    let quote = queries::get_quote_by_book_and_content(
        test_data.book.id,
        "A reader lives a thousand lives before he dies... The man who never reads lives only one."
            .to_string(),
        &pool,
    )
    .await
    .unwrap();
    assert_eq!(quote.content, Some("A reader lives a thousand lives before he dies... The man who never reads lives only one.".to_string()));
}

#[sqlx::test(migrations = "../migrations")]
async fn test_get_quote_by_original_id(pool: SqlitePool) {
    let test_data = init_db(&pool).await.unwrap();

    let quote = queries::get_quote_by_original_id(test_data.book.original_id.unwrap(), &pool)
        .await
        .unwrap();
    assert_eq!(quote.content, Some("A reader lives a thousand lives before he dies... The man who never reads lives only one.".to_string()));
}

#[sqlx::test(migrations = "../migrations")]
async fn test_get_book_by_original_id(pool: SqlitePool) {
    let test_data = init_db(&pool).await.unwrap();

    let book = queries::get_book_by_original_id(test_data.book.original_id.unwrap(), &pool)
        .await
        .unwrap();
    assert_eq!(book.title, "A Dance with Dragons");
}

#[sqlx::test(migrations = "../migrations")]
async fn test_get_chapter_by_original_id(pool: SqlitePool) {
    let test_data = init_db(&pool).await.unwrap();

    let chapter =
        queries::get_chapter_by_original_id(test_data.chapter.original_id.unwrap(), &pool)
            .await
            .unwrap();
    assert_eq!(chapter.title, "Chapter 0");
}

#[sqlx::test(migrations = "../migrations")]
async fn test_get_quote_by_id(pool: SqlitePool) {
    let test_data = init_db(&pool).await.unwrap();

    let quote = queries::get_quote_by_id(&test_data.quote.id, &pool)
        .await
        .unwrap();
    assert_eq!(quote.content, Some("A reader lives a thousand lives before he dies... The man who never reads lives only one.".to_string()));
}

#[sqlx::test(migrations = "../migrations")]
fn test_delete_quote(pool: SqlitePool) {
    let test_data = init_db(&pool).await.unwrap();

    let _ = queries::delete_quote(&test_data.quote.id, &pool).await.unwrap();
    let quote = queries::get_quote_by_id(&test_data.quote.id, &pool).await;
    assert!(quote.is_err());
}
