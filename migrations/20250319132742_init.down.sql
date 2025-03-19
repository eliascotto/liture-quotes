-- Drop triggers
DROP TRIGGER IF EXISTS quote_fts_after_insert;
DROP TRIGGER IF EXISTS quote_fts_after_update;
DROP TRIGGER IF EXISTS quote_fts_before_delete;
DROP TRIGGER IF EXISTS quote_fts_before_update;

-- Drop the full-text search virtual table
DROP TABLE IF EXISTS quote_fts;

-- Drop indexes (no IF EXISTS in SQLite)
DROP INDEX IF EXISTS idx_quote_book_id;
DROP INDEX IF EXISTS idx_book_author_id;

-- Drop tables in reverse order (no IF EXISTS in SQLite)
DROP TABLE IF EXISTS note;
DROP TABLE IF EXISTS chapter;
DROP TABLE IF EXISTS quote;
DROP TABLE IF EXISTS book;
DROP TABLE IF EXISTS author;-- Add down migration script here
