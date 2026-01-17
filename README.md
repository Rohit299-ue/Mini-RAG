# RAG Backend - Text Processing & Embedding Service

A Node.js backend service for processing text documents, generating embeddings, and storing them in Supabase with pgvector for similarity search in RAG (Retrieval-Augmented Generation) applications.

## Features

- **Smart Text Chunking**: Splits text into 800-1200 token chunks with 10-15% overlap
- **OpenAI Embeddings**: Generates high-quality embeddings using text-embedding-3-small
- **Supabase Integration**: Stores chunks and embeddings in PostgreSQL with pgvector
- **Batch Processing**: Handles multiple documents efficiently
- **Section Detection**: Automatically detects document sections
- **Similarity Search**: Fast vector similarity search with filtering
- **Cost Estimation**: Estimates OpenAI API costs before processing
- **Rate Limiting**: Protects against abuse and API limits

## Quick Start

### 1. Prerequisites

- Node.js 18+ 
- Supabase account (free tier works)
- OpenAI API key 
- Cohere API key (optional, for reranking)

### 2. Installation

```bash
# Clone and install dependencies
npm install

# Run setup script (creates .env from template)
node setup.js

# Or manually copy environment file
cp .env.example .env
```

### 3. Environment Setup

Edit `.env` with your credentials:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
COHERE_API_KEY=your_cohere_api_key
```

### 4. Database Setup

Run the SQL schema in your Supabase SQL editor:

```sql
-- See supabase_rag_schema.sql for complete setup
```

### 5. Start Server

```bash
# Development
npm run dev

# Production
npm start
```

Server runs on `http://localhost:3000`

## 🚀 Quick Deployment

### Docker (Recommended)
```bash
# Automated deployment
./deployment/deploy.sh production

# Or Windows
.\deployment\windows-deploy.ps1 production

# Manual Docker
docker-compose up -d
```

### Test Your Setup
```bash
# Run comprehensive tests
npm run test:system

# Try examples
npm run examples:answers
```

**✅ Ready!** Your complete RAG system is now running with MMR, reranking, and citation-backed answers.

## API Endpoints

### Process Text
```bash
POST /api/documents/process
Content-Type: application/json

{
  "text": "Your document text here...",
  "metadata": {
    "source": "document.pdf",
    "title": "Document Title",
    "section": "Chapter 1",
    "author": "Author Name"
  }
}
```

### Process with Section Detection
```bash
POST /api/documents/process-sections
Content-Type: application/json

{
  "text": "# Chapter 1\nContent...\n## Section 1.1\nMore content...",
  "metadata": {
    "source": "document.pdf",
    "title": "Document Title"
  }
}
```

### Search Similar Content
```bash
POST /api/documents/search
Content-Type: application/json

{
  "query": "What is machine learning?",
  "threshold": 0.7,
  "limit": 5,
  "source": "ml_textbook.pdf"
}
```

### Batch Processing
```bash
POST /api/documents/batch-process
Content-Type: application/json

{
  "texts": [
    {
      "text": "First document...",
      "metadata": { "source": "doc1.pdf" }
    },
    {
      "text": "Second document...",
      "metadata": { "source": "doc2.pdf" }
    }
  ]
}
```

### Get Document Chunks
```bash
GET /api/documents/source/document.pdf
```

### Delete Document
```bash
DELETE /api/documents/source/document.pdf
```

### Cost Estimation
```bash
POST /api/documents/estimate-cost
Content-Type: application/json

{
  "text": "Text to estimate processing cost..."
}
```

### Health Check
```bash
GET /health
```

## Usage Examples

### JavaScript/Node.js Client

```javascript
const API_BASE = 'http://localhost:3000/api'

// Process text
async function processText(text, metadata) {
  const response = await fetch(`${API_BASE}/documents/process`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, metadata })
  })
  return response.json()
}

// Search similar content
async function searchSimilar(query, options = {}) {
  const response = await fetch(`${API_BASE}/documents/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, ...options })
  })
  return response.json()
}

// Example usage
const result = await processText(
  "Machine learning is a subset of artificial intelligence...",
  {
    source: "ml_intro.pdf",
    title: "Introduction to Machine Learning",
    section: "Chapter 1"
  }
)

const searchResults = await searchSimilar(
  "What is artificial intelligence?",
  { threshold: 0.75, limit: 3 }
)
```

### Python Client

```python
import requests

API_BASE = "http://localhost:3000/api"

def process_text(text, metadata=None):
    response = requests.post(
        f"{API_BASE}/documents/process",
        json={"text": text, "metadata": metadata or {}}
    )
    return response.json()

def search_similar(query, **options):
    response = requests.post(
        f"{API_BASE}/documents/search",
        json={"query": query, **options}
    )
    return response.json()

# Example usage
result = process_text(
    "Machine learning is a subset of artificial intelligence...",
    {
        "source": "ml_intro.pdf",
        "title": "Introduction to Machine Learning",
        "section": "Chapter 1"
    }
)

search_results = search_similar(
    "What is artificial intelligence?",
    threshold=0.75,
    limit=3
)
```

## Configuration

### Chunking Parameters

Customize chunking behavior by modifying `TextChunker` options:

```javascript
const textChunker = new TextChunker({
  minChunkSize: 800,     // Minimum tokens per chunk
  maxChunkSize: 1200,    // Maximum tokens per chunk
  overlapPercentage: 0.125, // 12.5% overlap between chunks
  model: 'gpt-4'         // Model for tokenization
})
```

### Embedding Configuration

Modify embedding settings in `src/config/openai.js`:

```javascript
export const EMBEDDING_CONFIG = {
  model: 'text-embedding-3-small',
  dimensions: 1536,
  encoding_format: 'float'
}
```

## Performance & Scaling

### Rate Limits
- General API: 100 requests per 15 minutes
- Processing endpoints: 10 requests per minute

### Batch Processing
- Maximum 10 texts per batch
- Automatic retry with exponential backoff
- Progress tracking and error handling

### Database Optimization
- HNSW index for fast vector similarity search
- Composite indexes for filtering
- Connection pooling via Supabase

### Cost Management
- Built-in cost estimation
- Batch processing to reduce API calls
- Configurable embedding dimensions

## Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "error": "Error message",
  "details": "Additional details if available"
}
```

Common error codes:
- `400`: Validation error
- `429`: Rate limit exceeded
- `502`: OpenAI API error
- `503`: Database error

## Monitoring

### Health Check Response
```json
{
  "status": "healthy",
  "timestamp": "2024-01-17T10:00:00.000Z",
  "services": {
    "database": "connected",
    "openai": "connected"
  },
  "version": "1.0.0"
}
```

### Statistics Endpoint
```bash
GET /api/documents/stats
```

Returns database statistics including total documents, unique sources, and processing metrics.

## Development

### Project Structure
```
src/
├── config/          # Database and API configurations
├── services/        # Core business logic
├── routes/          # API route handlers
├── middleware/      # Express middleware
└── server.js        # Main application entry point
```

### Running Tests
```bash
npm test
```

### Development Mode
```bash
npm run dev  # Uses nodemon for auto-restart
```

## 📚 Complete Documentation

- **[QUICK_START.md](QUICK_START.md)** - Get running in 5 minutes
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Production deployment guide
- **[docs/MMR_EXPLANATION.md](docs/MMR_EXPLANATION.md)** - MMR algorithm details
- **[docs/RERANKING_EXPLANATION.md](docs/RERANKING_EXPLANATION.md)** - Reranking benefits
- **[docs/ANSWER_GENERATION_GUIDE.md](docs/ANSWER_GENERATION_GUIDE.md)** - LLM answering system
- **[examples/](examples/)** - Working code examples

## 🧪 Testing & Examples

```bash
# Run all examples
npm run examples:answers

# Test complete system
npm run test:system

# Individual examples
npm run examples:reranking
npm run examples
```