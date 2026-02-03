# Mini RAG - SQL Quick Reference

Quick reference for common SQL operations in your Mini RAG database.

## 🚀 Initial Setup

### 1. Run Schema (First Time Only)
```sql
-- Copy and paste entire backend/schema.sql into Supabase SQL Editor
-- This creates the table, indexes, and functions
```

### 2. Verify Setup
```sql
-- Check if pgvector is installed
SELECT * FROM pg_extension WHERE extname = 'vector';

-- Check if table exists
SELECT COUNT(*) FROM documents;
```

## 📊 Common Queries

### View Data

```sql
-- Count all chunks
SELECT COUNT(*) FROM documents;

-- View recent uploads
SELECT title, source, LEFT(content, 100) as preview, created_at
FROM documents
ORDER BY created_at DESC
LIMIT 10;

-- Count by source
SELECT source, COUNT(*) as chunks
FROM documents
GROUP BY source
ORDER BY chunks DESC;

-- Count by title
SELECT title, COUNT(*) as chunks
FROM documents
GROUP BY title
ORDER BY chunks DESC;
```

### Search & Filter

```sql
-- Find by title
SELECT * FROM documents
WHERE title ILIKE '%search_term%';

-- Find by source
SELECT * FROM documents
WHERE source = 'document.pdf';

-- Get all chunks for a document (in order)
SELECT position, LEFT(content, 100) as preview
FROM documents
WHERE title = 'Your Document'
ORDER BY position;

-- Find recent documents
SELECT DISTINCT title, source, MAX(created_at) as uploaded
FROM documents
GROUP BY title, source
ORDER BY uploaded DESC;
```

### Vector Similarity Search

```sql
-- Basic similarity search (replace with actual embedding)
SELECT 
    title,
    source,
    LEFT(content, 200) as preview,
    1 - (embedding <=> '[0.1, 0.2, ...]'::vector(1536)) as similarity
FROM documents
ORDER BY embedding <=> '[0.1, 0.2, ...]'::vector(1536)
LIMIT 10;

-- Search with similarity threshold
SELECT 
    title,
    content,
    1 - (embedding <=> '[0.1, 0.2, ...]'::vector(1536)) as similarity
FROM documents
WHERE 1 - (embedding <=> '[0.1, 0.2, ...]'::vector(1536)) > 0.7
ORDER BY embedding <=> '[0.1, 0.2, ...]'::vector(1536)
LIMIT 10;

-- Use the search function
SELECT * FROM search_documents('[0.1, 0.2, ...]'::vector(1536), 10);
```

## 🗑️ Delete Operations

```sql
-- Delete by source
DELETE FROM documents WHERE source = 'old_file.pdf';

-- Delete by title
DELETE FROM documents WHERE title = 'Old Document';

-- Delete old documents (older than 30 days)
DELETE FROM documents WHERE created_at < NOW() - INTERVAL '30 days';

-- Delete everything (CAREFUL!)
TRUNCATE TABLE documents;
```

## 📈 Statistics & Monitoring

```sql
-- Database statistics
SELECT * FROM get_document_stats();

-- Table size
SELECT 
    pg_size_pretty(pg_total_relation_size('documents')) as total_size,
    pg_size_pretty(pg_relation_size('documents')) as table_size,
    pg_size_pretty(pg_indexes_size('documents')) as indexes_size;

-- Row counts
SELECT 
    COUNT(*) as total_rows,
    COUNT(DISTINCT source) as unique_sources,
    COUNT(DISTINCT title) as unique_titles
FROM documents;

-- Content statistics
SELECT 
    AVG(LENGTH(content)) as avg_length,
    MIN(LENGTH(content)) as min_length,
    MAX(LENGTH(content)) as max_length
FROM documents;
```

## 🔧 Maintenance

```sql
-- Vacuum and analyze (improves performance)
VACUUM ANALYZE documents;

-- Reindex (if search becomes slow)
REINDEX INDEX documents_embedding_idx;

-- Update statistics
ANALYZE documents;

-- Check for dead rows
SELECT 
    n_live_tup as live_rows,
    n_dead_tup as dead_rows,
    ROUND(n_dead_tup * 100.0 / NULLIF(n_live_tup + n_dead_tup, 0), 2) AS dead_ratio
FROM pg_stat_user_tables
WHERE tablename = 'documents';
```

## 🧪 Testing

```sql
-- Insert test document
INSERT INTO documents (content, embedding, source, title, position)
VALUES (
    'Test content',
    array_fill(0.1, ARRAY[1536])::vector(1536),
    'test.txt',
    'Test Document',
    0
);

-- Verify insert
SELECT * FROM documents WHERE source = 'test.txt';

-- Delete test data
DELETE FROM documents WHERE source = 'test.txt';
```

## 🔍 Debugging

```sql
-- Check index usage
SELECT 
    indexname,
    idx_scan as times_used,
    idx_tup_read as rows_read
FROM pg_stat_user_indexes
WHERE tablename = 'documents';

-- Find slow queries
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    max_time
FROM pg_stat_statements
WHERE query LIKE '%documents%'
ORDER BY mean_time DESC
LIMIT 10;

-- Check table bloat
SELECT 
    n_dead_tup,
    n_live_tup,
    ROUND(n_dead_tup * 100.0 / NULLIF(n_live_tup + n_dead_tup, 0), 2) AS bloat_ratio
FROM pg_stat_user_tables
WHERE tablename = 'documents';
```

## 📝 Update Operations

```sql
-- Update source name
UPDATE documents 
SET source = 'new_name.pdf'
WHERE source = 'old_name.pdf';

-- Update title
UPDATE documents 
SET title = 'New Title'
WHERE title = 'Old Title';

-- Update section
UPDATE documents 
SET section = 'Chapter 1'
WHERE title = 'Book' AND position BETWEEN 0 AND 10;
```

## 🎯 Advanced Queries

```sql
-- Get documents uploaded today
SELECT title, source, COUNT(*) as chunks
FROM documents
WHERE DATE(created_at) = CURRENT_DATE
GROUP BY title, source;

-- Find duplicates
SELECT content, COUNT(*) as count
FROM documents
GROUP BY content
HAVING COUNT(*) > 1;

-- Get unique sources
SELECT DISTINCT source FROM documents ORDER BY source;

-- Get chunks by position range
SELECT title, position, LEFT(content, 100) as preview
FROM documents
WHERE title = 'Your Document'
AND position BETWEEN 5 AND 15
ORDER BY position;

-- Search within specific source
SELECT 
    content,
    1 - (embedding <=> '[0.1, 0.2, ...]'::vector(1536)) as similarity
FROM documents
WHERE source = 'specific.pdf'
ORDER BY embedding <=> '[0.1, 0.2, ...]'::vector(1536)
LIMIT 5;
```

## 💡 Tips

### Performance Tips
1. Run `VACUUM ANALYZE` weekly for large datasets
2. Reindex if search becomes slow
3. Monitor table size and dead rows
4. Adjust IVFFlat `lists` parameter based on dataset size

### Best Practices
1. Always backup before DELETE operations
2. Test queries on small datasets first
3. Use LIMIT to avoid large result sets
4. Monitor index usage regularly
5. Keep statistics up to date with ANALYZE

### Common Issues

**Slow searches?**
```sql
REINDEX INDEX documents_embedding_idx;
ANALYZE documents;
```

**Table too large?**
```sql
-- Check size
SELECT pg_size_pretty(pg_total_relation_size('documents'));

-- Delete old data
DELETE FROM documents WHERE created_at < NOW() - INTERVAL '90 days';
VACUUM FULL documents;
```

**Too many dead rows?**
```sql
VACUUM FULL documents;
```

## 🔗 Useful Functions

### Get Statistics
```sql
SELECT * FROM get_document_stats();
```

### Search by Title
```sql
SELECT * FROM search_by_title(
    'Document Title',
    '[0.1, 0.2, ...]'::vector(1536),
    5
);
```

### Delete Old Documents
```sql
SELECT delete_old_documents(30); -- Delete docs older than 30 days
```

## 📚 Resources

- **Full Queries:** See `backend/useful_queries.sql`
- **Schema:** See `backend/schema.sql`
- **pgvector Docs:** https://github.com/pgvector/pgvector
- **Supabase Docs:** https://supabase.com/docs/guides/ai/vector-columns

## 🆘 Emergency Commands

### Backup Before Disaster
```sql
-- Count everything first
SELECT COUNT(*) FROM documents;

-- Export to CSV (in Supabase dashboard)
-- Go to Table Editor → documents → Export to CSV
```

### Restore After Disaster
```sql
-- If you have a backup, import via Supabase dashboard
-- Table Editor → documents → Import from CSV
```

### Nuclear Option (Start Fresh)
```sql
-- WARNING: This deletes EVERYTHING
DROP TABLE IF EXISTS documents CASCADE;

-- Then re-run schema.sql to recreate
```

---

**Remember:** Always test on a small dataset first, and backup before destructive operations!
