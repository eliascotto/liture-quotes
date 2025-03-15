mod db;
mod dbconn;
mod sqlschema;
use sqlschema::*;

#[derive(Debug, serde::Serialize)]
pub struct DataFields {
    pub books: Vec<Book>,
    pub authors: Vec<Author>,
}

pub fn import_books(path: &str) -> Result<String, String> {
    db::import_books(path)
}

pub fn import_notes(path: &str) -> Result<String, String> {
    db::import_notes(path)
}

// Remove the #[tauri::command] attributes from these functions
// They will be called by the command functions in the commands module
fn fetch_all_impl() -> Result<DataFields, String> {
    let conn = db::new_conn()?;

    let books = match db::get_all_books(&conn) {
        Ok(b) => b,
        Err(e) => return Err(format!("Error fetching books {}", e)),
    };

    let authors = match db::get_all_authors(&conn) {
        Ok(b) => b,
        Err(e) => return Err(format!("Error fetching authors {}", e)),
    };

    Ok(DataFields {
        books: books,
        authors: authors,
    })
}

fn fetch_books_by_author_impl(author_id: i32) -> Result<Vec<Book>, String> {
    let conn = db::new_conn()?;

    let books = match db::get_all_books_by_author(&conn, author_id) {
        Ok(b) => b,
        Err(e) => return Err(format!("Error fetching books {}", e)),
    };

    Ok(books)
}

fn fetch_book_notes_impl(book_id: &str) -> Result<Vec<Note>, String> {
    let conn = db::new_conn()?;

    let notes = match db::get_all_notes_by_book_id(&conn, book_id) {
        Ok(b) => b,
        Err(e) => return Err(format!("Error fetching notes {}", e)),
    };

    Ok(notes)
}

fn search_notes_impl(search: &str) -> Result<Vec<NoteFts>, String> {
    let conn = db::new_conn()?;

    let notes = match db::find_notes(&conn, search) {
        Ok(b) => b,
        Err(e) => return Err(format!("Error fetching notes {}", e)),
    };

    Ok(notes)
}

fn search_books_by_title_impl(search: &str) -> Result<Vec<Book>, String> {
    let conn = db::new_conn()?;

    let books = match db::find_books_by_title(&conn, search) {
        Ok(b) => b,
        Err(e) => return Err(format!("Error searching books {}", e)),
    };

    Ok(books)
}

fn search_authors_by_name_impl(search: &str) -> Result<Vec<Author>, String> {
    let conn = db::new_conn()?;

    let authors = match db::find_authors_by_name(&conn, search) {
        Ok(a) => a,
        Err(e) => return Err(format!("Error searching authors {}", e)),
    };

    Ok(authors)
}

fn new_author_impl(name: &str) -> Result<Author, String> {
    if name.len() < 2 {
        return Err("Invalid author name".to_string());
    }

    let mut conn = db::new_conn()?;
    let tx = db::new_tx(&mut conn)?;

    let author;
    match db::get_author_by_name(&tx, name.to_string()) {
        Ok(_) => {
            let _ = tx.rollback();
            return Err(format!("Author {name} already present"));
        }
        Err(_) => {
            author = match db::insert_author(&tx, name.to_string()) {
                Ok(a) => a,
                Err(e) => {
                    let _ = tx.rollback();
                    return Err(format!("Error creating author {}", e));
                }
            };
        }
    }
    let _ = tx.commit();

    Ok(author)
}

fn hide_note_impl(note_id: &str) -> Result<Note, String> {
    let conn = db::new_conn()?;

    let _ = db::set_note_hidden(&conn, note_id);
    match db::get_note_by_id(&conn, note_id) {
        Ok(note) => Ok(note),
        Err(e) => Err(format!("Error getting note with id {}: {}", note_id, e)),
    }
}

fn star_note_impl(note_id: &str) -> Result<Note, String> {
    let conn = db::new_conn()?;

    let starred = match db::get_note_starred(&conn, note_id) {
        Ok(v) => v,
        Err(e) => return Err(format!("Error extracting note with id {}: {}", note_id, e)),
    };
    let _ = db::set_note_starred(&conn, note_id, 1 - starred);
    match db::get_note_by_id(&conn, note_id) {
        Ok(note) => Ok(note),
        Err(e) => Err(format!("Error getting note with id {}: {}", note_id, e)),
    }
}

fn update_note_impl(note: Note) -> Result<Note, String> {
    let conn = db::new_conn()?;

    let _ = db::update_note(&conn, &note);
    match db::get_note_by_id(&conn, note.id.as_str()) {
        Ok(note) => Ok(note),
        Err(e) => Err(format!("Error getting note with id {}: {}", note.id, e)),
    }
}

// Create a separate module for the Tauri commands
pub mod commands {
    use super::*;

    #[tauri::command]
    pub fn fetch_all() -> Result<DataFields, String> {
        fetch_all_impl()
    }

    #[tauri::command]
    pub fn fetch_books_by_author(author_id: i32) -> Result<Vec<Book>, String> {
        fetch_books_by_author_impl(author_id)
    }

    #[tauri::command]
    pub fn fetch_book_notes(book_id: &str) -> Result<Vec<Note>, String> {
        fetch_book_notes_impl(book_id)
    }

    #[tauri::command]
    pub fn search_notes(search: &str) -> Result<Vec<NoteFts>, String> {
        search_notes_impl(search)
    }

    #[tauri::command]
    pub fn search_books_by_title(search: &str) -> Result<Vec<Book>, String> {
        search_books_by_title_impl(search)
    }

    #[tauri::command]
    pub fn search_authors_by_name(search: &str) -> Result<Vec<Author>, String> {
        search_authors_by_name_impl(search)
    }

    #[tauri::command]
    pub fn new_author(name: &str) -> Result<Author, String> {
        new_author_impl(name)
    }

    #[tauri::command]
    pub fn hide_note(note_id: &str) -> Result<Note, String> {
        hide_note_impl(note_id)
    }

    #[tauri::command]
    pub fn star_note(note_id: &str) -> Result<Note, String> {
        star_note_impl(note_id)
    }

    #[tauri::command]
    pub fn update_note(note: Note) -> Result<Note, String> {
        update_note_impl(note)
    }
}

// Re-export the commands for convenience
pub use commands::*;

// #[tauri::command]
// fn new_note(author_id: i32, content: &str) -> Result<Note, String> {
//     let conn = match DbConn::new(DB_PATH) {
//         Ok(conn) => conn,
//         Err(e) => return Err(format!("Error connecting to database: {}", e)),
//     };

//     let n = Note {
//         id: Uuid::new_v4().to_string(),
//         book_id: None,
//         author_id: Some(author_id),
//         date_created: note.datecreated.clone(),
//         date_modified: note.datemodified.clone(),
//         note_type: note.note_type.clone(),
//         chapter: note.chapter.clone(),
//         content: note.text.clone(),
//         annotations: note.annotation.clone(),
//     };
//     let note = match insert_note(&conn, n) {
//         Ok(a) => a,
//         Err(e) => return Err(format!("Error creating note {}", e)),
//     };

//     Ok(note)
// }

// match notes_vault_lib::import_books("/Users/elia/dev/books_list.json") {
//     Ok(s) => println!("{}", s),
//     Err(e) => println!("{}", e),
// }

// match notes_vault_lib::import_notes("/Users/elia/dev/notes.json") {
//     Ok(s) => println!("{}", s),
//     Err(e) => println!("{}", e),
// }
