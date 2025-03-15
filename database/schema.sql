-- Create the Authors table
CREATE TABLE Authors (
    id INTEGER PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    photo TEXT,
    goodreads_url TEXT
);

-- Create the Books table
CREATE TABLE Books (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    author_id INTEGER,
    publication_date TEXT,
    FOREIGN KEY (author_id) REFERENCES Authors(id)
);

-- Create the Notes table
CREATE TABLE Notes (
    id TEXT PRIMARY KEY,
    book_id TEXT,
    author_id INTEGER,
    date_created TEXT NOT NULL,
    date_modified TEXT,
    type TEXT,
    chapter TEXT,
    chapter_progress REAL,
    content TEXT,
    annotations TEXT,
    hidden INTEGER DEFAULT 0,
    starred INTEGER DEFAULT 0,
    FOREIGN KEY (book_id) REFERENCES Books(id)
);

-- Create indexes for performance
CREATE INDEX idx_books_author_id ON Books(author_id);
CREATE INDEX idx_notes_book_id ON Notes(book_id);

-- Full Text Search
CREATE VIRTUAL TABLE Notes_fts USING fts5(id, content, book, author);

-- Triggers for FTS
CREATE TRIGGER Notes_fts_before_update BEFORE UPDATE ON Notes BEGIN
    DELETE FROM Notes_fts WHERE id = old.id;
END;

CREATE TRIGGER Notes_fts_before_delete BEFORE DELETE ON Notes BEGIN
    DELETE FROM Notes_fts WHERE id = old.id;
END;

CREATE TRIGGER Notes_fts_after_update AFTER UPDATE ON Notes BEGIN
    INSERT INTO Notes_fts(id, content, book, author)
    SELECT new.id, new.content, b.title, a.name
    FROM Notes n
    JOIN Books b ON n.book_id = b.id
    JOIN Authors a ON b.author_id = a.id
    WHERE n.id = new.id;
END;

CREATE TRIGGER Notes_fts_after_insert AFTER INSERT ON Notes BEGIN
    INSERT INTO Notes_fts(id, content, book, author)
    SELECT new.id, new.content, b.title, a.name
    FROM Notes n
    JOIN Books b ON n.book_id = b.id
    JOIN Authors a ON b.author_id = a.id
    WHERE n.id = new.id;
END;