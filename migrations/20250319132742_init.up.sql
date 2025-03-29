CREATE TABLE IF NOT EXISTS author (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP,
    original_id TEXT
);

CREATE TABLE IF NOT EXISTS book (
    id TEXT PRIMARY KEY NOT NULL,
    author_id TEXT,
    title TEXT NOT NULL,
    publication_date TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP,
    original_id TEXT,
    FOREIGN KEY (author_id) REFERENCES author(id)
);

CREATE TABLE IF NOT EXISTS quote (
    id TEXT PRIMARY KEY NOT NULL,
    book_id TEXT,
    author_id TEXT,
    chapter TEXT,
    chapter_progress REAL,
    content TEXT,
    starred INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    imported_at TIMESTAMP,
    deleted_at TIMESTAMP,
    original_id TEXT,
    FOREIGN KEY (book_id) REFERENCES book(id)
);

CREATE TABLE IF NOT EXISTS chapter (
    id TEXT PRIMARY KEY NOT NULL,
    book_id TEXT,
    title TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP,
    original_id TEXT,
    volume_index INTEGER,
    FOREIGN KEY (book_id) REFERENCES book(id)
);

CREATE TABLE IF NOT EXISTS note (
    id TEXT PRIMARY KEY NOT NULL,
    book_id TEXT,
    author_id TEXT,
    quote_id TEXT,
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP,
    FOREIGN KEY (book_id) REFERENCES book(id),
    FOREIGN KEY (author_id) REFERENCES author(id),
    FOREIGN KEY (quote_id) REFERENCES quote(id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_book_author_id ON book(author_id);
CREATE INDEX IF NOT EXISTS idx_quote_book_id ON quote(book_id);

-- Create FTS table for quote full-text search
CREATE VIRTUAL TABLE quote_fts USING fts5(
    id UNINDEXED,      -- Links back to quote table
    content,           -- Searchable quote text
    book_title,        -- Searchable book title
    author_name        -- Searchable author name
);

-- Before update: Delete old FTS entry
DROP TRIGGER IF EXISTS quote_fts_before_update;
CREATE TRIGGER quote_fts_before_update BEFORE UPDATE ON quote BEGIN
    DELETE FROM quote_fts WHERE id = old.id;
END;

-- Before delete: Delete FTS entry
DROP TRIGGER IF EXISTS quote_fts_before_delete;
CREATE TRIGGER quote_fts_before_delete BEFORE DELETE ON quote BEGIN
    DELETE FROM quote_fts WHERE id = old.id;
END;

-- After update: Insert new FTS entry
DROP TRIGGER IF EXISTS quote_fts_after_update;
CREATE TRIGGER quote_fts_after_update AFTER UPDATE ON quote BEGIN
    INSERT INTO quote_fts(id, content, book_title, author_name)
    SELECT new.id, new.content, b.title, a.name
    FROM book b, author a
    WHERE b.id = new.book_id AND a.id = new.author_id;
END;

-- After insert: Insert new FTS entry
DROP TRIGGER IF EXISTS quote_fts_after_insert;
CREATE TRIGGER quote_fts_after_insert AFTER INSERT ON quote BEGIN
    INSERT INTO quote_fts(id, content, book_title, author_name)
    SELECT new.id, new.content, b.title, a.name
    FROM book b, author a
    WHERE b.id = new.book_id AND a.id = new.author_id;
END;
