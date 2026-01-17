-- =====================================================
-- Supabase pgvector Schema for RAG System
-- =====================================================

-- Enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- Main Documents Table
-- =====================================================
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content TEXT NOT NULL,
    embedding vector(1536) NOT NULL,
    source TEXT NOT NULL,
    title TEXT,
    section TEXT,
    position INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- Indexes for Performance Optimization
-- =====================================================

-- Vector similarity index using HNSW (Hierarchical Navigable Small World)
-- This is the most efficient index for high-dimensional vector similarity search
CREATE INDEX documents_embedding_hnsw_idx 
ON documents 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Alternative IVFFlat index (use if HNSW is not available)
-- CREATE INDEX documents_embedding_ivfflat_idx 
-- ON documents 
-- USING ivfflat (embedding vector_cosine_ops)
-- WITH (lists = 100);

-- Standard B-tree indexes for filtering and sorting
CREATE INDEX documents_source_idx ON documents (source);
CREATE INDEX documents_title_idx ON documents (title);
CREATE INDEX documents_section_idx ON documents (section);
CREATE INDEX documents_position_idx ON documents (position);
CREATE INDEX documents_created_at_idx ON documents (created_at);

-- Composite index for source + position ordering
CREATE INDEX documents_source_position_idx ON documents (source, position);

-- =====================================================
-- Trigger for Updated At Timestamp
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_documents_updated_at 
    BEFORE UPDATE ON documents 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Upsert Strategy Functions
-- =====================================================

-- Function for upserting documents with conflict resolution
CREATE OR REPLACE FUNCTION upsert_document(
    p_id UUID DEFAULT NULL,
    p_content TEXT,
    p_embedding vector(1536),
    p_source TEXT,
    p_title TEXT DEFAULT NULL,
    p_section TEXT DEFAULT NULL,
    p_position INTEGER DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    result_id UUID;
BEGIN
    -- If ID is provided, try to update existing record
    IF p_id IS NOT NULL THEN
        INSERT INTO documents (id, content, embedding, source, title, section, position)
        VALUES (p_id, p_content, p_embedding, p_source, p_title, p_section, p_position)
        ON CONFLICT (id) 
        DO UPDATE SET
            content = EXCLUDED.content,
            embedding = EXCLUDED.embedding,
            source = EXCLUDED.source,
            title = EXCLUDED.title,
            section = EXCLUDED.section,
            position = EXCLUDED.position,
            updated_at = NOW()
        RETURNING id INTO result_id;
    ELSE
        -- Generate new ID and insert
        INSERT INTO documents (content, embedding, source, title, section, position)
        VALUES (p_content, p_embedding, p_source, p_title, p_section, p_position)
        RETURNING id INTO result_id;
    END IF;
    
    RETURN result_id;
END;
$$ LANGUAGE plpgsql;

-- Function for batch upsert with source-based conflict resolution
CREATE OR REPLACE FUNCTION upsert_document_by_source_position(
    p_content TEXT,
    p_embedding vector(1536),
    p_source TEXT,
    p_title TEXT DEFAULT NULL,
    p_section TEXT DEFAULT NULL,
    p_position INTEGER DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    result_id UUID;
    existing_id UUID;
BEGIN
    -- Check if document with same source and position exists
    SELECT id INTO existing_id 
    FROM documents 
    WHERE source = p_source AND position = p_position;
    
    IF existing_id IS NOT NULL THEN
        -- Update existing document
        UPDATE documents 
        SET 
            content = p_content,
            embedding = p_embedding,
            title = p_title,
            section = p_section,
            updated_at = NOW()
        WHERE id = existing_id
        RETURNING id INTO result_id;
    ELSE
        -- Insert new document
        INSERT INTO documents (content, embedding, source, title, section, position)
        VALUES (p_content, p_embedding, p_source, p_title, p_section, p_position)
        RETURNING id INTO result_id;
    END IF;
    
    RETURN result_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Vector Search Functions
-- =====================================================

-- Function for similarity search with optional filtering
CREATE OR REPLACE FUNCTION search_similar_documents(
    query_embedding vector(1536),
    match_threshold float DEFAULT 0.7,
    match_count int DEFAULT 10,
    filter_source text DEFAULT NULL,
    filter_section text DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    content TEXT,
    source TEXT,
    title TEXT,
    section TEXT,
    position INTEGER,
    similarity FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.id,
        d.content,
        d.source,
        d.title,
        d.section,
        d.position,
        1 - (d.embedding <=> query_embedding) AS similarity
    FROM documents d
    WHERE 
        (filter_source IS NULL OR d.source = filter_source)
        AND (filter_section IS NULL OR d.section = filter_section)
        AND 1 - (d.embedding <=> query_embedding) > match_threshold
    ORDER BY d.embedding <=> query_embedding
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Utility Functions
-- =====================================================

-- Function to delete documents by source
CREATE OR REPLACE FUNCTION delete_documents_by_source(p_source TEXT)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM documents WHERE source = p_source;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get document statistics
CREATE OR REPLACE FUNCTION get_document_stats()
RETURNS TABLE (
    total_documents BIGINT,
    unique_sources BIGINT,
    avg_content_length NUMERIC,
    latest_update TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_documents,
        COUNT(DISTINCT source) as unique_sources,
        AVG(LENGTH(content)) as avg_content_length,
        MAX(updated_at) as latest_update
    FROM documents;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Row Level Security (RLS) Setup
-- =====================================================

-- Enable RLS on the documents table
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to read all documents
CREATE POLICY "Users can view all documents" ON documents
    FOR SELECT USING (auth.role() = 'authenticated');

-- Policy for authenticated users to insert documents
CREATE POLICY "Users can insert documents" ON documents
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy for authenticated users to update their own documents
CREATE POLICY "Users can update documents" ON documents
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Policy for authenticated users to delete documents
CREATE POLICY "Users can delete documents" ON documents
    FOR DELETE USING (auth.role() = 'authenticated');

-- =====================================================
-- Sample Data and Usage Examples
-- =====================================================

-- Example: Insert a document using the upsert function
/*
SELECT upsert_document(
    NULL, -- Let it generate a new ID
    'This is sample content for testing the RAG system.',
    '[0.1, 0.2, 0.3, ...]'::vector, -- Replace with actual 1536-dim embedding
    'sample_document.pdf',
    'Sample Document Title',
    'Introduction',
    1
);
*/

-- Example: Search for similar documents
/*
SELECT * FROM search_similar_documents(
    '[0.1, 0.2, 0.3, ...]'::vector, -- Query embedding
    0.7, -- Similarity threshold
    5,   -- Number of results
    NULL, -- No source filter
    NULL  -- No section filter
);
*/

-- Example: Batch upsert by source and position
/*
SELECT upsert_document_by_source_position(
    'Updated content for the document.',
    '[0.1, 0.2, 0.3, ...]'::vector,
    'sample_document.pdf',
    'Updated Title',
    'Chapter 1',
    1
);
*/