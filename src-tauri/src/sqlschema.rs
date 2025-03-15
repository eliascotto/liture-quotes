use serde_json::Value;
use std::error;

// SQLITE tables

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct Author {
    pub id: i32,
    pub name: String,
    pub photo: Option<String>,
    pub goodreads_url: Option<String>,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct Book {
    pub id: String,
    pub title: String,
    pub author_id: Option<i32>,
    pub publication_date: Option<String>,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct Note {
    pub id: String,
    pub book_id: Option<String>,
    pub author_id: Option<i32>,
    pub date_created: Option<String>,
    pub date_modified: Option<String>,
    pub note_type: String,
    pub chapter: Option<String>,
    pub chapter_progress: Option<f64>,
    pub content: Option<String>,
    pub annotations: Option<String>,
    pub hidden: i32,
    pub starred: i32,
}

#[derive(Debug, serde::Serialize)]
pub struct NoteFts {
    pub id: String,
    pub content: Option<String>,
    pub book: String,
    pub author: String,
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
pub struct NoteJson {
    pub id: String,
    pub book_id: Option<String>,
    pub text: Option<String>,
    pub datecreated: Option<String>,
    pub datemodified: Option<String>,
    pub chapter: Option<String>,
    pub chapter_progress: Option<f64>,
    pub note_type: String,
    pub annotation: Option<String>,
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
pub fn parse_note(value: &Value) -> Result<NoteJson, Box<dyn error::Error>> {
    Ok(NoteJson {
        id: value["bookmarkid"]
            .as_str()
            .ok_or("Invalid parameter bookmarkid")?
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
        datecreated: match value["datecreated"].as_str() {
            Some(x) => Some(x.to_string()),
            None => None,
        },
        datemodified: match value["datemodified"].as_str() {
            Some(x) => Some(x.to_string()),
            None => None,
        },
        chapter: match value["chapter"].as_str() {
            Some(x) => Some(x.to_string()),
            None => None,
        },
        chapter_progress: match value["chapterprogress"].as_f64() {
            Some(x) => Some(x),
            None => None,
        },
        note_type: value["kind"]
            .as_str()
            .ok_or("Invalid parameter kind")?
            .to_string(),
    })
}
