use chrono::NaiveDateTime;
use serde_json::Value;
use std::error;

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
    pub publication_date: Option<String>,
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
    pub chapter: Option<String>,
    pub chapter_progress: Option<f64>,
    pub content: Option<String>,
    pub starred: Option<i64>,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
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
    pub note_type: String,
    pub content: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    pub deleted_at: Option<String>,
}

#[derive(Debug, serde::Serialize, serde::Deserialize, Clone, sqlx::FromRow)]
pub struct QuoteFts {
    pub id: String,
    pub content: Option<String>,
    pub book: Option<String>,
    pub author: Option<String>,
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

// JSON data structures for parsing json files as input

#[derive(Debug)]
pub struct BookJson {
    pub id: String,
    pub title: String,
    pub author: Option<String>,
}

// {
//     "volumeid": "file:///mnt/onboard/Books/David Attenborough - La vita sul nostro pianeta. Come sar\u00e0 il futuro\u00bf (Piemme 2020-11).epub",
//     "booktitle": null,
//     "title": "La vita sul nostro pianeta",
//     "author": "David Attenborough",
//     "itemscount": 140
// }
pub fn parse_book(value: &Value) -> Result<BookJson, Box<dyn error::Error>> {
    Ok(BookJson {
        id: value["volumeid"]
            .as_str()
            .ok_or("Invalid parameter volumeid")?
            .to_string(),
        title: value["title"]
            .as_str()
            .ok_or("Invalid parameter title")?
            .to_string(),
        // author can be null
        author: match value["author"].as_str() {
            Some(x) => Some(x.to_string()),
            None => None,
        },
    })
}

#[derive(Debug)]
pub struct QuoteJson {
    pub id: String,
    pub book_id: Option<String>,
    pub text: Option<String>,
    pub chapter: Option<String>,
    pub chapter_progress: Option<f64>,
    pub annotation: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

// {
//     "volumeid": "file:///mnt/onboard/Books/Una nuova storia (non cinica) dell'umanit\u00e0 -- Rutger Bregman -- Varia, 2020 -- Feltrinelli Editore -- 9788807492846 -- 6605a50360fe1cf3df157ec1deef5caf -- Anna\u2019s Archive.epub",
//     "bookmarkid": "166479e7-5a37-497c-a391-7a12b3410c28",
//     "text": ". \u00c8 un fenomeno che si manifesta soprattutto nelle culture occidentali, individualistiche, dove la teoria della patina \u00e8 pi\u00f9 radicata.",
//     "annotation": null,
//     "datecreated": "2012-12-24T20:06:50.000",
//     "datemodified": "2012-12-24T20:06:50Z",
//     "chapterprogress": 0.818414,
//     "booktitle": "Una nuova storia (non cinica) dell'umanit\u00e0",
//     "chapter": "Epilogo. Dieci regole di vita",
//     "author": "Rutger Bregman",
//     "kind": "highlight",
//     "dateformatted": "Monday, 24 December 2012 20:06:50"
//  }
pub fn parse_quote(value: &Value) -> Result<QuoteJson, Box<dyn error::Error>> {
    Ok(QuoteJson {
        id: value["bookmarkid"]
            .as_str()
            .ok_or("Invalid parameter id for quote")?
            .to_string(),
        book_id: match value["volumeid"].as_str() {
            Some(x) => Some(x.to_string()),
            None => None,
        },
        text: match value["text"].as_str() {
            Some(x) => Some(x.to_string()),
            None => None,
        },
        annotation: match value["annotation"].as_str() {
            Some(x) => Some(x.to_string()),
            None => None,
        },
        created_at: value["datecreated"]
            .as_str()
            .ok_or("Invalid parameter created_at for quote")?
            .to_string(),
        updated_at: value["datemodified"]
            .as_str()
            .ok_or("Invalid parameter updated_at for quote")?
            .to_string(),
        chapter: match value["chapter"].as_str() {
            Some(x) => Some(x.to_string()),
            None => None,
        },
        chapter_progress: match value["chapterprogress"].as_f64() {
            Some(x) => Some(x),
            None => None,
        },
    })
}
