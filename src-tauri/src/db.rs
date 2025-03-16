use crate::dbconn::*;
use crate::sqlschema::*;
use rusqlite::Transaction;
use serde_json::Value;
use std::fs::File;
use std::io::{self, Read};
use std::path::Path;

const DB_PATH: &str = "../database/database.sqlite";

/// Returns a new database connection
pub fn new_conn() -> Result<DbConn, String> {
    match DbConn::new(DB_PATH) {
        Ok(conn) => Ok(conn),
        Err(e) => return Err(format!("Error connecting to database: {}", e)),
    }
}

/// Returns a new database transaction (rollback/commit)
pub fn new_tx(conn: &mut DbConn) -> Result<Transaction, String> {
    match conn.transaction() {
        Ok(t) => Ok(t),
        Err(e) => return Err(format!("Error creating new db transaction: {e}")),
    }
}

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

pub fn get_author_by_name(conn: &Transaction, author_name: String) -> rusqlite::Result<Author> {
    let sql = "SELECT id, name, photo, goodreads_url FROM Authors WHERE name = ?";
    conn.query_row(sql, rusqlite::params![author_name], |row| {
        Ok(Author {
            id: row.get(0)?,
            name: row.get(1)?,
            photo: row.get(2)?,
            goodreads_url: row.get(3)?,
        })
    })
}

pub fn get_book_by_id(tx: &Transaction, id: String) -> rusqlite::Result<Book> {
    let sql = "SELECT id, title, author_id, publication_date FROM Books WHERE id = ?";
    tx.query_row(sql, rusqlite::params![id], |row| {
        Ok(Book {
            id: row.get(0)?,
            title: row.get(1)?,
            author_id: row.get(2)?,
            publication_date: row.get(3)?,
        })
    })
}

/// Returns a new Note extracted from query result.
fn note_from_row(row: &rusqlite::Row) -> rusqlite::Result<Note> {
    Ok(Note {
        id: row.get(0)?,
        book_id: row.get(1)?,
        author_id: row.get(2)?,
        date_created: row.get(3)?,
        date_modified: row.get(4)?,
        note_type: row.get(5)?,
        chapter: row.get(6)?,
        chapter_progress: row.get(7)?,
        content: row.get(8)?,
        annotations: row.get(9)?,
        hidden: row.get(10)?,
        starred: row.get(11)?,
    })
}

/// Returns a new Book extracted from query result.
fn book_from_row(row: &rusqlite::Row) -> rusqlite::Result<Book> {
    Ok(Book {
        id: row.get(0)?,
        title: row.get(1)?,
        author_id: row.get(2)?,
        publication_date: row.get(3)?,
    })
}

pub fn insert_author(tx: &Transaction, author_name: String) -> rusqlite::Result<Author> {
    let sql = "INSERT OR IGNORE INTO Authors (name) VALUES (?)";
    let mut stmt = tx.prepare(sql)?;
    stmt.execute(rusqlite::params![author_name])?;
    get_author_by_name(tx, author_name)
}

pub fn insert_book(
    tx: &Transaction,
    book_id: String,
    book_title: String,
    author_id: Option<i32>,
) -> rusqlite::Result<usize> {
    let sql = "INSERT OR IGNORE INTO Books (id, title, author_id) VALUES (?, ?, ?)";
    let mut stmt = tx.prepare(sql)?;
    stmt.execute(rusqlite::params![book_id, book_title, author_id])
}

pub fn import_books(path: &str) -> Result<String, String> {
    let books_values = match read_json(path) {
        Ok(b) => b,
        Err(e) => return Err(format!("Error reading JSON: {}", e)),
    };

    let mut conn = match DbConn::new(DB_PATH) {
        Ok(conn) => conn,
        Err(e) => return Err(format!("Error connecting to database: {}", e)),
    };

    let books_vec = match books_values.as_array() {
        Some(vec) => vec,
        None => return Err("JSON file doesn't contain a valid array".into()),
    };

    let mut books: Vec<BookJson> = Vec::new();
    for bk in books_vec.iter() {
        let b = match parse_book(bk) {
            Ok(b) => b,
            Err(e) => return Err(format!("Failed to parse JSON => {}", e)),
        };
        books.push(b);
    }

    let tx = match conn.transaction() {
        Ok(t) => t,
        Err(e) => return Err(format!("Error creating new db transaction: {e}")),
    };
    for book in books.iter() {
        let author_id = match book.author.clone() {
            Some(book_author) => {
                let author = match insert_author(&tx, book_author) {
                    Ok(a) => a,
                    Err(e) => {
                        let _ = tx.rollback();
                        return Err(format!("Error creating Author => {}", e));
                    }
                };
                Some(author.id)
            }
            None => None,
        };

        match insert_book(&tx, book.id.clone(), book.title.clone(), author_id) {
            Ok(_) => {}
            Err(e) => {
                let _ = tx.rollback();
                return Err(format!("Error creating Book => {}", e));
            }
        }
    }
    let _ = tx.commit();

    Ok("Books imported correctly".into())
}

pub fn insert_note(tx: &Transaction, note: &Note) -> rusqlite::Result<Note> {
    let mut stmt = tx.prepare(
        "INSERT OR IGNORE INTO Notes 
        (id, book_id, date_created, date_modified, type, chapter, chapter_progress, content, annotations) 
        VALUES 
        (?, ?, ?, ?, ?, ?, ?, ?, ?)"
    )?;
    stmt.execute(rusqlite::params![
        note.id,
        note.book_id,
        note.date_created,
        note.date_modified,
        note.note_type,
        note.chapter,
        note.chapter_progress,
        note.content,
        note.annotations
    ])?;

    tx.query_row(
        "SELECT * FROM Notes WHERE id = ?",
        rusqlite::params![note.id],
        note_from_row,
    )
}

pub fn import_notes(path: &str) -> Result<String, String> {
    let notes_values = match read_json(path) {
        Ok(b) => b,
        Err(e) => return Err(format!("Error reading JSON: {}", e)),
    };

    let mut conn = match DbConn::new(DB_PATH) {
        Ok(conn) => conn,
        Err(e) => return Err(format!("Error connecting to database: {}", e)),
    };

    let notes_vec = match notes_values.as_array() {
        Some(vec) => vec,
        None => return Err("JSON file doesn't contain a valid array".into()),
    };

    let mut notes: Vec<NoteJson> = Vec::new();
    for bk in notes_vec.iter() {
        let b = match parse_note(bk) {
            Ok(b) => b,
            Err(e) => return Err(format!("Failed to parse JSON => {}", e)),
        };
        notes.push(b);
    }

    let tx = match conn.transaction() {
        Ok(t) => t,
        Err(e) => return Err(format!("Error creating new db transaction: {e}")),
    };
    for note in notes.iter() {
        let book = match get_book_by_id(&tx, note.book_id.clone().unwrap()) {
            Ok(b) => b,
            Err(e) => {
                let _ = tx.rollback();
                return Err(format!(
                    "Book not found with id \"{}\" => {}",
                    note.book_id.clone().unwrap(),
                    e
                ));
            }
        };

        let n = Note {
            id: note.id.clone(),
            book_id: Some(book.id),
            author_id: book.author_id, // already an Option
            date_created: note.datecreated.clone(),
            date_modified: note.datemodified.clone(),
            note_type: note.note_type.clone(),
            chapter: note.chapter.clone(),
            chapter_progress: note.chapter_progress.clone(),
            content: note.text.clone(),
            annotations: note.annotation.clone(),
            hidden: 0,
            starred: 0,
        };
        match insert_note(&tx, &n) {
            Ok(_) => {}
            Err(e) => {
                let _ = tx.rollback();
                return Err(format!("Error creating Note => {}\n{:#?}", e, note));
            }
        }
    }

    // Optimize FTS after bulk notes insertion
    match tx.execute("INSERT INTO Notes_fts(Notes_fts) VALUES('optimize')", ()) {
        Ok(_) => {}
        Err(err) => {
            let _ = tx.rollback();
            return Err(format!("Error optimizing fts: {}", err));
        }
    };
    let _ = tx.commit();

    Ok("Notes imported correctly".into())
}

/// Get all books
pub fn get_books(conn: &DbConn) -> rusqlite::Result<Vec<Book>> {
    let sql = "
        SELECT id, title, author_id, publication_date 
        FROM Books WHERE deleted = 0
        ORDER BY title COLLATE NOCASE";
    let mut stmt = conn.prepare(sql)?;
    let books_iter = stmt.query_map([], |row| {
        Ok(Book {
            id: row.get(0)?,
            title: row.get(1)?,
            author_id: row.get(2)?,
            publication_date: row.get(3)?,
        })
    })?;

    let mut books = Vec::new();
    for book in books_iter {
        books.push(book?);
    }

    Ok(books)
}

/// Get all authors
pub fn get_authors(conn: &DbConn) -> rusqlite::Result<Vec<Author>> {
    let sql = "
        SELECT id, name, photo, goodreads_url 
        FROM Authors WHERE deleted = 0 
        ORDER BY name COLLATE NOCASE";
    let mut stmt = conn.prepare(sql)?;
    let authors_iter = stmt.query_map([], |row| {
        Ok(Author {
            id: row.get(0)?,
            name: row.get(1)?,
            photo: row.get(2)?,
            goodreads_url: row.get(3)?,
        })
    })?;

    let mut authors = Vec::new();
    for author in authors_iter {
        authors.push(author?);
    }

    Ok(authors)
}

pub fn get_all_books_by_author(conn: &DbConn, author_id: i32) -> rusqlite::Result<Vec<Book>> {
    let mut stmt = conn.prepare("SELECT * FROM Books WHERE author_id = ? AND deleted = 0 ORDER BY title COLLATE NOCASE")?;
    let rows = stmt.query_map([author_id], book_from_row)?;

    let mut books = Vec::new();
    for name_result in rows {
        books.push(name_result?);
    }

    Ok(books)
}

pub fn get_all_notes_by_book_id(conn: &DbConn, book_id: &str) -> rusqlite::Result<Vec<Note>> {
    let mut stmt = conn.prepare("SELECT * FROM Notes WHERE book_id = ? and hidden = 0")?;
    let rows = stmt.query_map([book_id], note_from_row)?;

    let mut notes = Vec::new();
    for name_result in rows {
        notes.push(name_result?);
    }

    Ok(notes)
}

/// Find Notes searching content, using full-text-search
pub fn find_notes(conn: &DbConn, search: &str) -> rusqlite::Result<Vec<NoteFts>> {
    let mut stmt = conn.prepare("SELECT * FROM Notes_fts WHERE content MATCH ?")?;
    let rows = stmt.query_map([search], |row| {
        Ok(NoteFts {
            id: row.get(0)?,
            content: row.get(1)?,
            book: row.get(2)?,
            author: row.get(3)?,
        })
    })?;

    let mut notes = Vec::new();
    for name_result in rows {
        notes.push(name_result?);
    }

    Ok(notes)
}

/// Find Books by title using LIKE query
pub fn find_books_by_title(conn: &DbConn, search: &str) -> rusqlite::Result<Vec<Book>> {
    let search_pattern = format!("%{}%", search);
    let mut stmt = conn.prepare("SELECT * FROM Books WHERE title LIKE ? ORDER BY title")?;
    let rows = stmt.query_map([search_pattern], book_from_row)?;

    let mut books = Vec::new();
    for book_result in rows {
        books.push(book_result?);
    }

    Ok(books)
}

/// Find Authors by name using LIKE query
pub fn find_authors_by_name(conn: &DbConn, search: &str) -> rusqlite::Result<Vec<Author>> {
    let search_pattern = format!("%{}%", search);
    let mut stmt = conn.prepare("SELECT * FROM Authors WHERE name LIKE ? ORDER BY name")?;
    let rows = stmt.query_map([search_pattern], |row| {
        Ok(Author {
            id: row.get(0)?,
            name: row.get(1)?,
            photo: row.get(2)?,
            goodreads_url: row.get(3)?,
        })
    })?;

    let mut authors = Vec::new();
    for author_result in rows {
        authors.push(author_result?);
    }

    Ok(authors)
}

pub fn get_note_by_id(conn: &DbConn, id: &str) -> rusqlite::Result<Note> {
    let sql = "SELECT * FROM Notes WHERE id = ?";
    conn.query_row(sql, rusqlite::params![id], note_from_row)
}

/// Set a Note as hidden
pub fn set_note_hidden(conn: &DbConn, note_id: &str) -> rusqlite::Result<()> {
    let mut stmt = conn.prepare("UPDATE Notes SET hidden = 1 WHERE id = ?")?;
    stmt.execute(rusqlite::params![note_id])?;
    Ok(())
}

/// Mark a book as deleted
pub fn set_book_deleted(conn: &DbConn, book_id: &str) -> rusqlite::Result<()> {
    let mut stmt = conn.prepare("UPDATE Books SET deleted = 1 WHERE id = ?")?;
    stmt.execute(rusqlite::params![book_id])?;
    Ok(())
}

/// Mark an author as deleted
pub fn set_author_deleted(conn: &DbConn, author_id: i32) -> rusqlite::Result<()> {
    // First mark the author as deleted
    let mut stmt = conn.prepare("UPDATE Authors SET deleted = 1 WHERE id = ?")?;
    stmt.execute(rusqlite::params![author_id])?;
    
    // Then mark all books by this author as deleted
    let mut stmt = conn.prepare("UPDATE Books SET deleted = 1 WHERE author_id = ?")?;
    stmt.execute(rusqlite::params![author_id])?;
    
    Ok(())
}

/// Get if a Note is starred
pub fn get_note_starred(conn: &DbConn, note_id: &str) -> rusqlite::Result<u8> {
    let sql = "SELECT starred FROM Notes WHERE id = ?";
    conn.query_row(sql, rusqlite::params![note_id], |row| row.get(0))
}

/// Set a Note as starred
pub fn set_note_starred(conn: &DbConn, note_id: &str, starred: u8) -> rusqlite::Result<()> {
    let mut stmt = conn.prepare("UPDATE Notes SET starred = ? WHERE id = ?")?;
    stmt.execute(rusqlite::params![starred, note_id])?;
    Ok(())
}

/// Update a Note. Supported fields: type, content, annotations
pub fn update_note(conn: &DbConn, note: &Note) -> rusqlite::Result<()> {
    let mut stmt = conn.prepare(
        "UPDATE Notes
        SET type = ?, content = ?, annotations = ?
        WHERE id = ?",
    )?;

    stmt.execute(rusqlite::params![
        note.note_type,
        note.content,
        note.annotations,
        note.id
    ])?;

    Ok(())
}

pub fn init_db(conn: &DbConn) -> rusqlite::Result<()> {
    // Check if the deleted column exists in the Authors table
    let mut stmt = conn.prepare("PRAGMA table_info(Authors)")?;
    let column_info = stmt.query_map([], |row| {
        let name: String = row.get(1)?;
        Ok(name)
    })?;
    
    let mut has_deleted_column = false;
    for name in column_info {
        if let Ok(column_name) = name {
            if column_name == "deleted" {
                has_deleted_column = true;
                break;
            }
        }
    }
    
    // Add the deleted column if it doesn't exist
    if !has_deleted_column {
        conn.execute("ALTER TABLE Authors ADD COLUMN deleted INTEGER DEFAULT 0", [])?;
    }
    
    // Check if the deleted column exists in the Books table
    let mut stmt = conn.prepare("PRAGMA table_info(Books)")?;
    let column_info = stmt.query_map([], |row| {
        let name: String = row.get(1)?;
        Ok(name)
    })?;
    
    let mut has_deleted_column = false;
    for name in column_info {
        if let Ok(column_name) = name {
            if column_name == "deleted" {
                has_deleted_column = true;
                break;
            }
        }
    }
    
    // Add the deleted column if it doesn't exist
    if !has_deleted_column {
        conn.execute("ALTER TABLE Books ADD COLUMN deleted INTEGER DEFAULT 0", [])?;
    }

    Ok(())
}

/// Get a book by ID
pub fn get_book(conn: &DbConn, id: &str) -> rusqlite::Result<Book> {
    let mut stmt = conn.prepare("SELECT id, title, author_id, publication_date FROM Books WHERE id = ? AND deleted = 0")?;
    stmt.query_row(rusqlite::params![id], |row| {
        Ok(Book {
            id: row.get(0)?,
            title: row.get(1)?,
            author_id: row.get(2)?,
            publication_date: row.get(3)?,
        })
    })
}

/// Get an author by ID
pub fn get_author(conn: &DbConn, id: i32) -> rusqlite::Result<Author> {
    let mut stmt = conn.prepare("SELECT id, name, photo, goodreads_url FROM Authors WHERE id = ? AND deleted = 0")?;
    stmt.query_row(rusqlite::params![id], |row| {
        Ok(Author {
            id: row.get(0)?,
            name: row.get(1)?,
            photo: row.get(2)?,
            goodreads_url: row.get(3)?,
        })
    })
}

/// Returns a connection to the database
pub fn get_connection() -> rusqlite::Result<DbConn> {
    DbConn::new(DB_PATH)
}

/// Get a random quote from the Notes table
pub fn get_random_quote(conn: &DbConn) -> rusqlite::Result<Option<(String, String, String)>> {
    // Get a random note that's not hidden and has content
    let sql = "
        SELECT n.content, b.title, a.name 
        FROM Notes n
        JOIN Books b ON n.book_id = b.id
        JOIN Authors a ON b.author_id = a.id
        WHERE n.hidden = 0 
        AND n.content IS NOT NULL 
        AND n.content != ''
        AND b.deleted = 0
        AND a.deleted = 0
        ORDER BY RANDOM()
        LIMIT 1
    ";
    
    let mut stmt = conn.prepare(sql)?;
    let mut rows = stmt.query([])?;
    
    if let Some(row) = rows.next()? {
        let content: String = row.get(0)?;
        let book_title: String = row.get(1)?;
        let author_name: String = row.get(2)?;
        
        Ok(Some((content, book_title, author_name)))
    } else {
        Ok(None)
    }
}
