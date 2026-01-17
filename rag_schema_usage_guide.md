# Supabase pgvector RAG Schema Usage Guide

## Overview
This schema provides a complete solution for storing and querying document embeddings in a RAG (Retrieval-Augmented Generation) system using Supabase and pgvector.

## Key Features

### 1. Optimized Vector Search
- **HNSW Index**: Most efficient for high-dimensional similarity search
- **Cosine Similarity**: Standard metric for text embeddings
- **Configurable Parameters**: Tuned for 1536-dimensional OpenAI embeddings

### 2. Flexible Upsert Strategies
- **ID-based Upsert**: Update existing documents by UUID
- **Source+Position Upsert**: Handle document chunks by source and position
- **Conflict Resolution**: Automatic handling of duplicate entries

### 3. Advanced Search Capabilities
- **Similarity Threshold**: Filter results by minimum similarity score
- **Source Filtering**: Search within specific documents
- **Section Filtering**: Target specific document sections
- **Ranked Results**: Ordered by similarity score

## Usage Examples

### Python Integration with Supabase Client

```python
from supabase import create_client, Client
import numpy as np
from typing import List, Dict, Any

class RAGDatabase:
    def __init__(self, supabase_url: str, supabase_key: str):
        self.supabase: Client = create_client(supabase_url, supabase_key)
    
    def upsert_document(self, 
                       content: str, 
                       embedding: List[float], 
                       source: str,
                       title: str = None,
                       section: str = None,
                       position: int = None,
                       document_id: str = None) -> str:
        """Upsert a document with its embedding."""
        
        result = self.supabase.rpc('upsert_document', {
            'p_id': document_id,
            'p_content': content,
            'p_embedding': embedding,
            'p_source': source,
            'p_title': title,
            'p_section': section,
            'p_position': position
        }).execute()
        
        return result.data
    
    def upsert_by_source_position(self,
                                 content: str,
                                 embedding: List[float],
                                 source: str,
                                 title: str = None,
                                 section: str = None,
                                 position: int = None) -> str:
        """Upsert document using source and position for conflict resolution."""
        
        result = self.supabase.rpc('upsert_document_by_source_position', {
            'p_content': content,
            'p_embedding': embedding,
            'p_source': source,
            'p_title': title,
            'p_section': section,
            'p_position': position
        }).execute()
        
        return result.data
    
    def search_similar(self,
                      query_embedding: List[float],
                      threshold: float = 0.7,
                      limit: int = 10,
                      source_filter: str = None,
                      section_filter: str = None) -> List[Dict[str, Any]]:
        """Search for similar documents."""
        
        result = self.supabase.rpc('search_similar_documents', {
            'query_embedding': query_embedding,
            'match_threshold': threshold,
            'match_count': limit,
            'filter_source': source_filter,
            'filter_section': section_filter
        }).execute()
        
        return result.data
    
    def delete_by_source(self, source: str) -> int:
        """Delete all documents from a specific source."""
        
        result = self.supabase.rpc('delete_documents_by_source', {
            'p_source': source
        }).execute()
        
        return result.data
    
    def get_stats(self) -> Dict[str, Any]:
        """Get database statistics."""
        
        result = self.supabase.rpc('get_document_stats').execute()
        return result.data[0] if result.data else {}

# Usage Example
rag_db = RAGDatabase(supabase_url, supabase_key)

# Insert document chunks
chunks = [
    {
        'content': 'Introduction to machine learning concepts...',
        'embedding': [0.1, 0.2, ...],  # 1536-dimensional embedding
        'source': 'ml_textbook.pdf',
        'title': 'Machine Learning Fundamentals',
        'section': 'Chapter 1: Introduction',
        'position': 1
    },
    # ... more chunks
]

for chunk in chunks:
    rag_db.upsert_by_source_position(**chunk)

# Search for similar content
query_embedding = [0.15, 0.25, ...]  # Query embedding
results = rag_db.search_similar(
    query_embedding=query_embedding,
    threshold=0.75,
    limit=5,
    source_filter='ml_textbook.pdf'
)

for result in results:
    print(f"Similarity: {result['similarity']:.3f}")
    print(f"Content: {result['content'][:100]}...")
    print(f"Source: {result['source']}")
    print("---")
```

### JavaScript/TypeScript Integration

```typescript
import { createClient } from '@supabase/supabase-js'

interface DocumentChunk {
  id?: string
  content: string
  embedding: number[]
  source: string
  title?: string
  section?: string
  position?: number
}

interface SearchResult extends DocumentChunk {
  similarity: number
}

class RAGDatabase {
  private supabase

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey)
  }

  async upsertDocument(chunk: DocumentChunk): Promise<string> {
    const { data, error } = await this.supabase.rpc('upsert_document', {
      p_id: chunk.id || null,
      p_content: chunk.content,
      p_embedding: chunk.embedding,
      p_source: chunk.source,
      p_title: chunk.title || null,
      p_section: chunk.section || null,
      p_position: chunk.position || null
    })

    if (error) throw error
    return data
  }

  async searchSimilar(
    queryEmbedding: number[],
    options: {
      threshold?: number
      limit?: number
      sourceFilter?: string
      sectionFilter?: string
    } = {}
  ): Promise<SearchResult[]> {
    const {
      threshold = 0.7,
      limit = 10,
      sourceFilter = null,
      sectionFilter = null
    } = options

    const { data, error } = await this.supabase.rpc('search_similar_documents', {
      query_embedding: queryEmbedding,
      match_threshold: threshold,
      match_count: limit,
      filter_source: sourceFilter,
      filter_section: sectionFilter
    })

    if (error) throw error
    return data
  }

  async deleteBySource(source: string): Promise<number> {
    const { data, error } = await this.supabase.rpc('delete_documents_by_source', {
      p_source: source
    })

    if (error) throw error
    return data
  }
}
```

## Performance Optimization Tips

### 1. Index Configuration
- **HNSW Parameters**: 
  - `m = 16`: Good balance between accuracy and memory
  - `ef_construction = 64`: Build-time search parameter
- **For larger datasets**: Increase `m` to 32-64, `ef_construction` to 128-256

### 2. Query Optimization
- Use appropriate similarity thresholds (0.7-0.8 for most cases)
- Limit results to what you actually need (5-20 typically sufficient)
- Use source/section filters when possible to reduce search space

### 3. Batch Operations
```sql
-- Batch insert example
INSERT INTO documents (content, embedding, source, title, section, position)
VALUES 
  ('Content 1', '[...]'::vector, 'doc1.pdf', 'Title 1', 'Section 1', 1),
  ('Content 2', '[...]'::vector, 'doc1.pdf', 'Title 1', 'Section 1', 2),
  ('Content 3', '[...]'::vector, 'doc1.pdf', 'Title 1', 'Section 2', 3);
```

## Monitoring and Maintenance

### Check Index Usage
```sql
-- Monitor index usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE tablename = 'documents';
```

### Database Statistics
```sql
-- Get comprehensive stats
SELECT * FROM get_document_stats();

-- Check table size
SELECT 
    pg_size_pretty(pg_total_relation_size('documents')) as total_size,
    pg_size_pretty(pg_relation_size('documents')) as table_size,
    pg_size_pretty(pg_indexes_size('documents')) as indexes_size;
```

This schema provides a production-ready foundation for your RAG system with optimized performance, flexible upsert strategies, and comprehensive search capabilities.