use chrono::NaiveDateTime;
// SQLITE tables

#[derive(Debug, serde::Serialize, serde::Deserialize, Clone, sqlx::FromRow)]
pub struct Author {
    pub id: String,
    pub name: String,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
    pub deleted_at: Option<NaiveDateTime>,
    pub original_id: Option<String>,
}

#[derive(Debug, serde::Serialize, serde::Deserialize, Clone, sqlx::FromRow)]
pub struct Book {
    pub id: String,
    pub author_id: Option<String>,
    pub title: String,
    pub publication_year: Option<String>,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
    pub deleted_at: Option<NaiveDateTime>,
    pub original_id: Option<String>,
}

#[derive(Debug, serde::Serialize, serde::Deserialize, Clone, sqlx::FromRow)]
pub struct Quote {
    pub id: String,
    pub book_id: Option<String>,
    pub author_id: Option<String>,
    pub chapter_id: Option<String>,
    pub chapter_progress: Option<f64>,
    pub content: Option<String>,
    pub starred: Option<i64>,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
    pub imported_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub original_id: Option<String>,
}

#[derive(Debug, serde::Serialize, serde::Deserialize, Clone, sqlx::FromRow)]
pub struct Chapter {
    pub id: String,
    pub book_id: Option<String>,
    pub title: String,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
    pub deleted_at: Option<NaiveDateTime>,
    pub original_id: Option<String>,
    pub volume_index: i64,
}

#[derive(Debug, serde::Serialize, serde::Deserialize, Clone, sqlx::FromRow)]
pub struct Note {
    pub id: String,
    pub book_id: Option<String>,
    pub author_id: Option<String>,
    pub quote_id: Option<String>,
    pub content: Option<String>,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
    pub deleted_at: Option<NaiveDateTime>,
}

#[derive(Debug, serde::Serialize, serde::Deserialize, Clone, sqlx::FromRow)]
pub struct Tag {
    pub id: String,
    pub name: String,
    pub color: Option<String>,
}

#[derive(Debug, serde::Serialize, serde::Deserialize, Clone, sqlx::FromRow)]
pub struct QuoteTag {
    pub quote_id: String,
    pub tag_id: String,
}

#[derive(Debug, serde::Serialize, serde::Deserialize, Clone, sqlx::FromRow)]
pub struct QuoteFts {
    pub id: String,
    pub content: Option<String>,
    pub chapter: Option<String>,
    pub chapter_progress: Option<f64>,
    pub starred: Option<i64>,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
    pub deleted_at: Option<NaiveDateTime>,
    pub imported_at: Option<NaiveDateTime>,
    pub original_id: Option<String>,
    pub book_id: Option<String>,
    pub author_id: Option<String>,
    pub book_title: Option<String>,
    pub author_name: Option<String>,
}

// Metaschema

#[derive(Debug, serde::Serialize)]
pub struct Library {
    pub books: Vec<Book>,
    pub authors: Vec<Author>,
}

#[derive(Debug, serde::Serialize, Clone, sqlx::FromRow)]
pub struct StarredQuote {
    pub id: String,
    pub book_id: Option<String>,
    pub book_title: Option<String>,
    pub author_id: Option<String>,
    pub author_name: Option<String>,
    pub content: Option<String>,
    pub starred: Option<i64>,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

#[derive(Debug, serde::Serialize, serde::Deserialize, Clone, sqlx::FromRow)]
pub struct RandomQuote {
    pub book_id: Option<String>,
    pub book_title: Option<String>,
    pub author_id: Option<String>,
    pub author_name: Option<String>,
    pub content: Option<String>,
}

#[derive(Debug, serde::Serialize, serde::Deserialize, Clone, sqlx::FromRow)]
pub struct QuoteWithTags {
    pub id: String,
    pub book_id: Option<String>,
    pub author_id: Option<String>,
    pub chapter_id: Option<String>,
    pub chapter_progress: Option<f64>,
    pub content: Option<String>,
    pub starred: Option<i64>,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
    pub imported_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub original_id: Option<String>,
    pub tags: Vec<Tag>,
}

#[derive(Debug, serde::Serialize, serde::Deserialize, Clone, sqlx::FromRow)]
pub struct QuoteWithTagsRedux {
    pub id: String,
    pub book_id: Option<String>,
    pub book_title: Option<String>,
    pub author_id: Option<String>,
    pub author_name: Option<String>,
    pub content: Option<String>,
    pub starred: Option<i64>,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
    pub tags: Vec<Tag>,
}
