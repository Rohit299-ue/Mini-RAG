-- ============================================================================
-- MINI RAG - USEFUL SQL QUERIES
-- ============================================================================
-- This file contains helpful SQL queries for managing and querying your
-- Mini RAG database in Supabase.
-- ============================================================================

-- ============================================================================
-- 1. DATABASE SETUP & VERIFICATION
-- ============================================================================

-- Check if pgvector extension is installed
SELECT * FROM pg_extension WHERE extname = 'vector';

-- Check pgvector version
SELECT extversion FROM pg_extension WHERE extname = 'vector';

-- Verify documents table exists
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_name = 'documents';

-- Check table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'documents'
ORDER BY ordinal_position;

-- List all indexes on documents table
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'documents';


-- ============================================================================
-- 2. DATA INSPECTION
-- ============================================================================

-- Count total documents/chunks
SELECT COUNT(*) as total_chunks FROM documents;

-- Count documents by source
SELECT source, COUNT(*) as chunk_count
FROM documents
GROUP BY source
ORDER BY chunk_count DESC;

-- Count documents by title
SELECT title, COUNT(*) as chunk_count
FROM documents
GROUP BY title
ORDER BY chunk_count DESC;

-- View recent uploads (last 10)
SELECT id, title, source, LEFT(content, 100) as preview, created_at
FROM documents
ORDER BY created_at DESC
LIMIT 10;

-- Get statistics about content length
SELECT 
    AVG(LENGTH(content)) as avg_length,
    MIN(LENGTH(content)) as min_length,
    MAX(LENGTH(content)) as max_length,
    COUNT(*) as total_chunks
FROM documents;

-- Find documents by title
SELECT id, title, source, LEFT(content, 100) as preview, position
FROM documents
WHERE title ILIKE '%search_term%'
ORDER BY position;

-- Find documents by source
SELECT id, title, source, LEFT(content, 100) as preview
FROM documents
WHERE source ILIKE '%search_term%'
ORDER BY created_at DESC;


-- ============================================================================
-- 3. VECTOR SIMILARITY SEARCH
-- ============================================================================

-- Search for similar documents (you need to provide the embedding vector)
-- Replace the array with your actual query embedding
SELECT 
    id,
    title,
    source,
    LEFT(content, 200) as preview,
    1 - (embedding <=> '[0.1, 0.2, ...]'::vector(1536)) as similarity
FROM documents
ORDER BY embedding <=> '[0.1, 0.2, ...]'::vector(1536)
LIMIT 10;

-- Search with similarity threshold (only results above 0.7 similarity)
SELECT 
    id,
    title,
    source,
    content,
    1 - (embedding <=> '[0.1, 0.2, ...]'::vector(1536)) as similarity
FROM documents
WHERE 1 - (embedding <=> '[0.1, 0.2, ...]'::vector(1536)) > 0.7
ORDER BY embedding <=> '[0.1, 0.2, ...]'::vector(1536)
LIMIT 10;

-- Search within specific source
SELECT 
    id,
    title,
    content,
    1 - (embedding <=> '[0.1, 0.2, ...]'::vector(1536)) as similarity
FROM documents
WHERE source = 'specific_source.pdf'
ORDER BY embedding <=> '[0.1, 0.2, ...]'::vector(1536)
LIMIT 5;

-- Using the search function
SELECT * FROM search_documents('[0.1, 0.2, ...]'::vector(1536), 10);


-- ============================================================================
-- 4. DATA MANAGEMENT
-- ============================================================================

-- Delete all documents from a specific source
DELETE FROM documents WHERE source = 'old_document.pdf';

-- Delete all documents with a specific title
DELETE FROM documents WHERE title = 'Old Document';

-- Delete documents older than a certain date
DELETE FROM documents WHERE created_at < '2024-01-01';

-- Delete all documents (CAREFUL!)
-- TRUNCATE TABLE documents;

-- Update source name for all chunks
UPDATE documents 
SET source = 'new_source_name.pdf'
WHERE source = 'old_source_name.pdf';

-- Update title for all chunks
UPDATE documents 
SET title = 'New Title'
WHERE title = 'Old Title';


-- ============================================================================
-- 5. PERFORMANCE MONITORING
-- ============================================================================

-- Check table size
SELECT 
    pg_size_pretty(pg_total_relation_size('documents')) as total_size,
    pg_size_pretty(pg_relation_size('documents')) as table_size,
    pg_size_pretty(pg_indexes_size('documents')) as indexes_size;

-- Check index usage
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE tablename = 'documents';

-- Check table statistics
SELECT 
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as live_rows,
    n_dead_tup as dead_rows,
    last_vacuum,
    last_autovacuum
FROM pg_stat_user_tables
WHERE relname = 'documents';


-- ============================================================================
-- 6. ADVANCED QUERIES
-- ============================================================================

-- Get all chunks for a document in order
SELECT id, position, LEFT(content, 100) as preview
FROM documents
WHERE title = 'Your Document Title'
ORDER BY position;

-- Find duplicate content
SELECT content, COUNT(*) as duplicate_count
FROM documents
GROUP BY content
HAVING COUNT(*) > 1;

-- Get documents uploaded today
SELECT COUNT(*) as today_uploads
FROM documents
WHERE DATE(created_at) = CURRENT_DATE;

-- Get documents by date range
SELECT title, source, COUNT(*) as chunks
FROM documents
WHERE created_at BETWEEN '2024-01-01' AND '2024-12-31'
GROUP BY title, source;

-- Find empty or very short content
SELECT id, title, source, LENGTH(content) as content_length
FROM documents
WHERE LENGTH(content) < 50
ORDER BY content_length;

-- Get unique sources
SELECT DISTINCT source
FROM documents
ORDER BY source;

-- Get unique titles
SELECT DISTINCT title
FROM documents
ORDER BY title;


-- ============================================================================
-- 7. MAINTENANCE QUERIES
-- ============================================================================

-- Vacuum the table (reclaim space)
VACUUM ANALYZE documents;

-- Reindex the vector index (if search becomes slow)
REINDEX INDEX documents_embedding_idx;

-- Update table statistics
ANALYZE documents;

-- Check for bloat
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
    n_live_tup,
    n_dead_tup,
    ROUND(n_dead_tup * 100.0 / NULLIF(n_live_tup + n_dead_tup, 0), 2) AS dead_ratio
FROM pg_stat_user_tables
WHERE tablename = 'documents';


-- ============================================================================
-- 8. BACKUP & RESTORE
-- ============================================================================

-- Export documents to CSV (run in psql or Supabase SQL editor)
-- COPY (SELECT * FROM documents) TO '/path/to/backup.csv' WITH CSV HEADER;

-- Export specific columns
-- COPY (SELECT id, title, source, content, created_at FROM documents) 
-- TO '/path/to/backup.csv' WITH CSV HEADER;

-- Count records before backup
SELECT COUNT(*) as total_records FROM documents;


-- ============================================================================
-- 9. TESTING QUERIES
-- ============================================================================

-- Insert a test document
INSERT INTO documents (content, embedding, source, title, section, position)
VALUES (
    'This is a test document for Mini RAG system.',
    array_fill(0.1, ARRAY[1536])::vector(1536),
    'test.txt',
    'Test Document',
    'Introduction',
    0
);

-- Verify test insert
SELECT * FROM documents WHERE source = 'test.txt';

-- Delete test documents
DELETE FROM documents WHERE source = 'test.txt';


-- ============================================================================
-- 10. USEFUL FUNCTIONS
-- ============================================================================

-- Function to get document statistics
CREATE OR REPLACE FUNCTION get_document_stats()
RETURNS TABLE (
    total_documents BIGINT,
    total_sources BIGINT,
    total_titles BIGINT,
    avg_chunks_per_title NUMERIC,
    oldest_document TIMESTAMP,
    newest_document TIMESTAMP
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_documents,
        COUNT(DISTINCT source) as total_sources,
        COUNT(DISTINCT title) as total_titles,
        ROUND(COUNT(*)::NUMERIC / NULLIF(COUNT(DISTINCT title), 0), 2) as avg_chunks_per_title,
        MIN(created_at) as oldest_document,
        MAX(created_at) as newest_document
    FROM documents;
END;
$$;

-- Usage: SELECT * FROM get_document_stats();


-- Function to search by title and similarity
CREATE OR REPLACE FUNCTION search_by_title(
    search_title TEXT,
    query_embedding VECTOR(1536),
    match_count INT DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    content TEXT,
    source TEXT,
    position INT,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.id,
        d.content,
        d.source,
        d.position,
        1 - (d.embedding <=> query_embedding) as similarity
    FROM documents d
    WHERE d.title = search_title
    ORDER BY d.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Usage: SELECT * FROM search_by_title('Document Title', '[0.1, 0.2, ...]'::vector(1536), 5);


-- Function to delete old documents
CREATE OR REPLACE FUNCTION delete_old_documents(days_old INT)
RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE
    deleted_count INT;
BEGIN
    DELETE FROM documents
    WHERE created_at < NOW() - INTERVAL '1 day' * days_old;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;

-- Usage: SELECT delete_old_documents(30); -- Delete documents older than 30 days


-- ============================================================================
-- 11. MONITORING QUERIES
-- ============================================================================

-- Active connections to database
SELECT 
    datname,
    usename,
    application_name,
    client_addr,
    state,
    query_start,
    state_change
FROM pg_stat_activity
WHERE datname = current_database();

-- Long-running queries
SELECT 
    pid,
    now() - query_start as duration,
    query,
    state
FROM pg_stat_activity
WHERE state != 'idle'
AND now() - query_start > interval '1 minute'
ORDER BY duration DESC;

-- Database size
SELECT 
    pg_size_pretty(pg_database_size(current_database())) as database_size;


-- ============================================================================
-- 12. OPTIMIZATION QUERIES
-- ============================================================================

-- Rebuild vector index for better performance
DROP INDEX IF EXISTS documents_embedding_idx;
CREATE INDEX documents_embedding_idx 
ON documents 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Create additional indexes for common queries
CREATE INDEX IF NOT EXISTS documents_created_at_idx ON documents(created_at DESC);
CREATE INDEX IF NOT EXISTS documents_title_source_idx ON documents(title, source);

-- Analyze query performance (run before your query)
EXPLAIN ANALYZE
SELECT * FROM documents
WHERE title = 'Your Title'
ORDER BY created_at DESC
LIMIT 10;


-- ============================================================================
-- NOTES
-- ============================================================================
-- 
-- 1. Replace '[0.1, 0.2, ...]'::vector(1536) with actual embedding vectors
--    from your application
--
-- 2. For production, always test DELETE queries on a small dataset first
--
-- 3. Run VACUUM ANALYZE periodically to maintain performance
--
-- 4. Monitor index usage and table size regularly
--
-- 5. Backup your data before running any destructive operations
--
-- 6. The IVFFlat index parameter 'lists' should be adjusted based on
--    your dataset size. Rule of thumb: lists = rows / 1000
--    (minimum 10, maximum 1000)
--
-- ============================================================================
