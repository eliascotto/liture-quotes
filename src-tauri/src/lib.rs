pub mod db;
mod dbconn;
mod sqlschema;
use sqlschema::*;
use serde::Serialize;

#[derive(Debug, serde::Serialize)]
pub struct DataFields {
    pub books: Vec<Book>,
    pub authors: Vec<Author>,
}

#[derive(Debug, Serialize)]
pub struct StarredNote {
    pub id: String,
    pub content: String,
    pub book_id: String,
    pub book_title: String,
    pub author_id: i32,
    pub author_name: String,
    pub starred: i32,
    pub date_created: String,
    pub date_modified: String,
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

    let books = match db::get_books(&conn) {
        Ok(b) => b,
        Err(e) => return Err(format!("Error fetching books {}", e)),
    };

    let authors = match db::get_authors(&conn) {
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

fn new_book_impl(title: &str, author_id: i32) -> Result<Book, String> {
    if title.len() < 2 {
        return Err("Invalid book title".to_string());
    }

    let mut conn = db::new_conn()?;
    let tx = db::new_tx(&mut conn)?;

    // Generate a unique ID for the book
    use uuid::Uuid;
    let book_id = Uuid::new_v4().to_string();

    // Insert the book
    match db::insert_book(&tx, book_id.clone(), title.to_string(), Some(author_id)) {
        Ok(_) => {},
        Err(e) => {
            let _ = tx.rollback();
            return Err(format!("Error creating book: {}", e));
        }
    }

    // Get the book to return
    let book = match db::get_book_by_id(&tx, book_id) {
        Ok(b) => b,
        Err(e) => {
            let _ = tx.rollback();
            return Err(format!("Error retrieving created book: {}", e));
        }
    };

    let _ = tx.commit();
    Ok(book)
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

fn new_note_impl(book_id: &str, content: &str) -> Result<Note, String> {
    if content.trim().is_empty() {
        return Err("Note content cannot be empty".to_string());
    }

    let mut conn = db::new_conn()?;
    let tx = db::new_tx(&mut conn)?;

    // Get the book to ensure it exists and to get the author_id
    let book = match db::get_book_by_id(&tx, book_id.to_string()) {
        Ok(b) => b,
        Err(e) => {
            let _ = tx.rollback();
            return Err(format!("Book not found: {}", e));
        }
    };

    // Generate a unique ID for the note
    use uuid::Uuid;
    let note_id = Uuid::new_v4().to_string();
    
    // Get current timestamp
    use chrono::Utc;
    let now = Utc::now().to_rfc3339();

    // Create the note
    let note = Note {
        id: note_id,
        book_id: Some(book.id),
        author_id: book.author_id,
        date_created: Some(now.clone()),
        date_modified: Some(now),
        note_type: "note".to_string(),
        chapter: None,
        chapter_progress: None,
        content: Some(content.to_string()),
        annotations: None,
        hidden: 0,
        starred: 0,
    };

    // Insert the note
    let created_note = match db::insert_note(&tx, &note) {
        Ok(n) => n,
        Err(e) => {
            let _ = tx.rollback();
            return Err(format!("Error creating note: {}", e));
        }
    };

    let _ = tx.commit();
    Ok(created_note)
}

// Add this function to the implementation section
fn get_random_quote_impl() -> Result<Option<(String, String, String)>, String> {
    let conn = db::new_conn()?;
    db::get_random_quote(&conn).map_err(|e| e.to_string())
}

fn fetch_starred_notes_impl() -> Result<Vec<StarredNote>, String> {
    let conn = db::new_conn()?;
    
    let sql = "
        SELECT 
            n.id,
            n.content,
            n.book_id,
            b.title as book_title,
            b.author_id,
            a.name as author_name,
            n.starred,
            n.date_created,
            n.date_modified
        FROM Notes n
        JOIN Books b ON n.book_id = b.id
        JOIN Authors a ON b.author_id = a.id
        WHERE n.starred = 1
        AND n.hidden = 0
        AND b.deleted = 0
        AND a.deleted = 0
        ORDER BY n.date_modified DESC
    ";
    
    let mut stmt = conn.prepare(sql).map_err(|e| e.to_string())?;
    let notes = stmt
        .query_map([], |row| {
            Ok(StarredNote {
                id: row.get(0)?,
                content: row.get(1)?,
                book_id: row.get(2)?,
                book_title: row.get(3)?,
                author_id: row.get(4)?,
                author_name: row.get(5)?,
                starred: row.get(6)?,
                date_created: row.get(7)?,
                date_modified: row.get(8)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    
    Ok(notes)
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
    pub fn new_book(title: &str, author_id: i32) -> Result<Book, String> {
        new_book_impl(title, author_id)
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

    #[tauri::command]
    pub fn new_note(book_id: &str, content: &str) -> Result<Note, String> {
        new_note_impl(book_id, content)
    }

    #[tauri::command]
    pub fn set_note_starred(note_id: &str, starred: u8) -> Result<(), String> {
        let conn = db::new_conn()?;
        db::set_note_starred(&conn, note_id, starred).map_err(|e| e.to_string())
    }

    #[tauri::command]
    pub fn set_book_deleted(book_id: &str) -> Result<(), String> {
        let conn = db::new_conn()?;
        db::set_book_deleted(&conn, book_id).map_err(|e| e.to_string())
    }

    #[tauri::command]
    pub fn set_author_deleted(author_id: i32) -> Result<(), String> {
        let conn = db::new_conn()?;
        db::set_author_deleted(&conn, author_id).map_err(|e| e.to_string())
    }

    #[tauri::command]
    pub fn get_random_quote() -> Result<Option<(String, String, String)>, String> {
        get_random_quote_impl()
    }

    #[tauri::command]
    pub fn fetch_starred_notes() -> Result<Vec<StarredNote>, String> {
        fetch_starred_notes_impl()
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

// match litforge_notes_lib::import_books("/Users/elia/dev/books_list.json") {
//     Ok(s) => println!("{}", s),
//     Err(e) => println!("{}", e),
// }

// match litforge_notes_lib::import_notes("/Users/elia/dev/notes.json") {
//     Ok(s) => println!("{}", s),
//     Err(e) => println!("{}", e),
// }
