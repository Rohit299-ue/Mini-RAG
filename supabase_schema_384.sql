-- =====================================================
-- Supabase pgvector Schema for RAG System (384 dimensions)
-- For use with Hugging Face embeddings
-- =====================================================

-- Enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing table if it exists (be careful in production!)
DROP TABLE IF EXISTS documents;

-- =====================================================
-- Main Documents Table (384 dimensions for Hugging Face)
-- =====================================================
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content TEXT NOT NULL,
    embedding vector(384) NOT NULL,  -- Changed from 1536 to 384 for Hugging Face
    source TEXT NOT NULL,
    title TEXT,
    section TEXT,
    "position" INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- Indexes for Performance Optimization
-- =====================================================

-- Vector similarity index using HNSW
CREATE INDEX documents_embedding_hnsw_idx 
ON documents 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Standard B-tree indexes for filtering and sorting
CREATE INDEX documents_source_idx ON documents (source);
CREATE INDEX documents_title_idx ON documents (title);
CREATE INDEX documents_section_idx ON documents (section);
CREATE INDEX documents_position_idx ON documents ("position");
CREATE INDEX documents_created_at_idx ON documents (created_at);

-- Composite index for source + position ordering
CREATE INDEX documents_source_position_idx ON documents (source, "position");

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
-- Vector Search Functions (384 dimensions)
-- =====================================================

-- Function for similarity search with optional filtering
CREATE OR REPLACE FUNCTION search_similar_documents(
    query_embedding vector(384),  -- Changed from 1536 to 384
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
    doc_position INTEGER,
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
        d."position" as doc_position,
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

-- Test the setup
SELECT 'Database schema created successfully for 384-dimensional embeddings' as status;