-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create documents table for storing text chunks with embeddings
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    embedding VECTOR(1536) NOT NULL,
    source TEXT,
    title TEXT,
    section TEXT,
    position INT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for fast vector similarity search
-- Using IVFFlat index with cosine distance
CREATE INDEX IF NOT EXISTS documents_embedding_idx 
ON documents 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Optional: Create index on metadata for filtering
CREATE INDEX IF NOT EXISTS documents_source_idx ON documents(source);
CREATE INDEX IF NOT EXISTS documents_title_idx ON documents(title);

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
        d.title,
        d.section,
        d.position,
        1 - (d.embedding <=> query_embedding) as similarity
    FROM documents d
    ORDER BY d.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Example usage:
-- SELECT * FROM search_documents('[0.1, 0.2, ...]'::vector(1536), 10);
