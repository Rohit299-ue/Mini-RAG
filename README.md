# Mini RAG - Production-Ready Retrieval-Augmented Generation System

A full-stack web application that enables intelligent question-answering over uploaded documents using state-of-the-art RAG pipeline.

## 🏗️ Architecture Overview

```
User Question
    ↓
[Embedding] → OpenAI text-embedding-3-small
    ↓
[Vector Search] → Supabase pgvector (Top-10)
    ↓
[Reranking] → Cohere Rerank API (Top-5)
    ↓
[LLM Generation] → OpenAI GPT-4o
    ↓
Answer with Citations
```

## 🔧 Tech Stack

### Backend
- **Framework**: FastAPI (Python)
- **Vector Database**: Supabase Postgres with pgvector
- **Embeddings**: OpenAI text-embedding-3-small (1536 dimensions)
- **Reranker**: Cohere Rerank API
- **LLM**: OpenAI GPT-4o

### Frontend
- **Framework**: React with Vite
- **Styling**: CSS Modules
- **HTTP Client**: Axios

## 📊 RAG Pipeline Configuration

| Component | Configuration |
|-----------|--------------|
| Chunk Size | 1000 tokens |
| Chunk Overlap | 150 tokens |
| Embedding Model | text-embedding-3-small (1536d) |
| Vector Similarity | Cosine similarity |
| Initial Retrieval | Top-10 chunks |
| Reranking | Cohere Rerank → Top-5 |
| LLM | GPT-4o with citation enforcement |

## 🚀 Setup Instructions

### Prerequisites
- Python 3.9+
- Node.js 18+
- Supabase account
- OpenAI API key
- Cohere API key

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create `.env` file (see `.env.example`):
```env
OPENAI_API_KEY=your_openai_key
COHERE_API_KEY=your_cohere_key
SUPABASE_DB_URL=postgresql://user:pass@host:port/db
```

5. Run database setup in Supabase SQL Editor:
   - Copy contents of `backend/schema.sql`
   - Paste into Supabase SQL Editor
   - Click "Run"

6. Start the server:
```bash
uvicorn main:app --reload --port 8000
```

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```env
VITE_API_URL=http://localhost:8000
```

4. Start development server:
```bash
npm run dev
```

## 📁 Project Structure

```
mini-rag/
├── backend/
│   ├── main.py              # FastAPI app & endpoints
│   ├── chunking.py          # Text chunking logic
│   ├── embeddings.py        # OpenAI embeddings
│   ├── retriever.py         # Vector search
│   ├── reranker.py          # Cohere reranking
│   ├── answering.py         # LLM generation
│   ├── database.py          # Supabase connection
│   ├── setup_db.py          # Database initialization
│   ├── requirements.txt     # Python dependencies
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Main component
│   │   ├── components/
│   │   │   ├── UploadPanel.jsx
│   │   │   ├── QuestionPanel.jsx
│   │   │   └── AnswerDisplay.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── .env.example
├── evaluation/
│   └── test_cases.json      # Evaluation Q&A pairs
└── README.md
```

## 🔌 API Endpoints

### POST /upload
Upload and process text documents.

**Request:**
```json
{
  "content": "Your document text...",
  "title": "Document Title",
  "source": "source.pdf"
}
```

**Response:**
```json
{
  "status": "success",
  "chunks_created": 15,
  "processing_time": 2.3
}
```

### POST /ask
Ask questions about uploaded documents.

**Request:**
```json
{
  "question": "What is the main topic?"
}
```

**Response:**
```json
{
  "answer": "The main topic is... [1][2]",
  "citations": [
    {
      "id": 1,
      "text": "chunk content...",
      "source": "doc.pdf",
      "section": "Introduction"
    }
  ],
  "processing_time": 1.8,
  "tokens_used": 450
}
```

## 🚀 Deployment

### Backend (Render)

1. Create new Web Service on Render
2. Connect your repository
3. Configure:
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Add environment variables in Render dashboard
5. Deploy

### Frontend (Vercel)

1. Install Vercel CLI: `npm i -g vercel`
2. Navigate to frontend directory
3. Run: `vercel`
4. Set environment variable: `VITE_API_URL=https://your-backend.onrender.com`
5. Deploy: `vercel --prod`

## ⚖️ Trade-offs & Limitations

### Design Decisions

**Chunk Size (1000 tokens)**
- ✅ Good balance between context and precision
- ❌ May split related information across chunks

**Top-10 → Top-5 Pipeline**
- ✅ Reranking improves relevance significantly
- ❌ Adds latency (~200-500ms)

**Cosine Similarity**
- ✅ Fast and effective for semantic search
- ❌ May miss exact keyword matches

**Citation Enforcement**
- ✅ Ensures grounded, verifiable answers
- ❌ LLM may refuse to answer edge cases

### Known Limitations

1. **Token Limits**: GPT-4o context window limits total chunk size
2. **Cost**: Each query uses embeddings + reranking + LLM tokens
3. **Latency**: Full pipeline takes 2-4 seconds per query
4. **Scalability**: Single-tenant design; needs optimization for multi-user
5. **No Authentication**: Production deployment needs auth layer

## 📈 Performance Metrics

- **Average Query Time**: 2-3 seconds
- **Retrieval Accuracy**: ~85% (see evaluation/)
- **Token Usage**: ~500-1000 tokens per query
- **Cost per Query**: ~$0.01-0.02

## 🧪 Evaluation

Run evaluation suite:
```bash
cd evaluation
python run_eval.py
```

See `evaluation/test_cases.json` for sample Q&A pairs and expected performance.

## 📝 License

MIT License - feel free to use for personal or commercial projects.

## 🤝 Contributing

Contributions welcome! Please open an issue or PR.

---

Built with ❤️ using FastAPI, React, and modern RAG techniques.
