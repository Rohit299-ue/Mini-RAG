-- ============================================================================
-- MINI RAG - COMPLETE DATABASE SETUP
-- ============================================================================
-- Run this entire file in Supabase SQL Editor
-- This will drop existing functions and recreate everything fresh
-- ============================================================================

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS search_documents(vector, integer);
DROP FUNCTION IF EXISTS get_document_stats();
DROP FUNCTION IF EXISTS search_by_title(text, vector, integer);
DROP FUNCTION IF EXISTS delete_old_documents(integer);

-- Drop existing table if you want to start fresh (CAREFUL - this deletes all data!)
-- DROP TABLE IF EXISTS documents CASCADE;

-- Create documents table for storing text chunks with embeddings
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    embedding VECTOR(1536) NOT NULL,
    source TEXT,
    title TEXT,
    section TEXT,
    chunk_position INT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for fast vector similarity search
-- Using IVFFlat index with cosine distance
CREATE INDEX IF NOT EXISTS documents_embedding_idx 
ON documents 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Create indexes on metadata for filtering
CREATE INDEX IF NOT EXISTS documents_source_idx ON documents(source);
CREATE INDEX IF NOT EXISTS documents_title_idx ON documents(title);
CREATE INDEX IF NOT EXISTS documents_created_at_idx ON documents(created_at DESC);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to search similar documents
CREATE OR REPLACE FUNCTION search_documents(
    query_embedding VECTOR(1536),
    match_count INT DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    content TEXT,
    source TEXT,
    title TEXT,
    section TEXT,
    chunk_position INT,
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
        d.title,
        d.section,
        d.chunk_position,
        1 - (d.embedding <=> query_embedding) as similarity
    FROM documents d
    ORDER BY d.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

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
    chunk_position INT,
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
        d.chunk_position,
        1 - (d.embedding <=> query_embedding) as similarity
    FROM documents d
    WHERE d.title = search_title
    ORDER BY d.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

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

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify setup
SELECT 'pgvector extension' as check_item, 
       CASE WHEN COUNT(*) > 0 THEN '✓ OK' ELSE '✗ MISSING' END as status
FROM pg_extension WHERE extname = 'vector'
UNION ALL
SELECT 'documents table' as check_item,
       CASE WHEN COUNT(*) > 0 THEN '✓ OK' ELSE '✗ MISSING' END as status
FROM information_schema.tables WHERE table_name = 'documents'
UNION ALL
SELECT 'vector index' as check_item,
       CASE WHEN COUNT(*) > 0 THEN '✓ OK' ELSE '✗ MISSING' END as status
FROM pg_indexes WHERE indexname = 'documents_embedding_idx'
UNION ALL
SELECT 'search_documents function' as check_item,
       CASE WHEN COUNT(*) > 0 THEN '✓ OK' ELSE '✗ MISSING' END as status
FROM pg_proc WHERE proname = 'search_documents';

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

SELECT '🎉 Database setup complete! You can now use the Mini RAG system.' as message;
