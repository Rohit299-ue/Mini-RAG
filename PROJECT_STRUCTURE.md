# Project Structure

Complete overview of the Mini RAG codebase.

```
mini-rag/
│
├── backend/                          # Python FastAPI backend
│   ├── main.py                       # FastAPI app & endpoints
│   ├── chunking.py                   # Text chunking logic
│   ├── embeddings.py                 # OpenAI embeddings
│   ├── retriever.py                  # Vector search
│   ├── reranker.py                   # Cohere reranking
│   ├── answering.py                  # LLM answer generation
│   ├── database.py                   # Supabase connection
│   ├── setup_db.py                   # Database initialization
│   ├── schema.sql                    # Database schema
│   ├── requirements.txt              # Python dependencies
│   ├── render.yaml                   # Render deployment config
│   ├── .env.example                  # Environment template
│   └── .env                          # Environment variables (gitignored)
│
├── frontend/                         # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── UploadPanel.jsx      # Document upload UI
│   │   │   ├── UploadPanel.css
│   │   │   ├── QuestionPanel.jsx    # Question input UI
│   │   │   ├── QuestionPanel.css
│   │   │   ├── AnswerDisplay.jsx    # Answer & citations UI
│   │   │   └── AnswerDisplay.css
│   │   ├── App.jsx                   # Main app component
│   │   ├── App.css                   # App styles
│   │   ├── main.jsx                  # React entry point
│   │   └── index.css                 # Global styles
│   ├── index.html                    # HTML template
│   ├── package.json                  # Node dependencies
│   ├── vite.config.js                # Vite configuration
│   ├── vercel.json                   # Vercel deployment config
│   ├── .env.example                  # Environment template
│   └── .env                          # Environment variables (gitignored)
│
├── evaluation/                       # Testing & evaluation
│   ├── test_cases.json               # Test Q&A pairs
│   └── run_eval.py                   # Evaluation script
│
├── README.md                         # Main documentation
├── QUICKSTART.md                     # Quick setup guide
├── ARCHITECTURE.md                   # Architecture deep dive
├── DEPLOYMENT.md                     # Deployment guide
├── PROJECT_STRUCTURE.md              # This file
├── .gitignore                        # Git ignore rules
└── .env.example                      # Root environment template
```

## File Descriptions

### Backend Files

#### `main.py` (200 lines)
**Purpose:** FastAPI application with API endpoints

**Key Components:**
- FastAPI app initialization
- CORS middleware
- `/upload` endpoint - Process and store documents
- `/ask` endpoint - Answer questions with RAG pipeline
- Request/response models (Pydantic)
- Error handling

**Dependencies:** FastAPI, all backend modules

#### `chunking.py` (80 lines)
**Purpose:** Split text into overlapping chunks

**Key Components:**
- `TextChunker` class
- Token counting with tiktoken
- Overlap management
- Metadata preservation

**Configuration:**
- Chunk size: 1000 tokens
- Overlap: 150 tokens

#### `embeddings.py` (90 lines)
**Purpose:** Generate embeddings using OpenAI

**Key Components:**
- `EmbeddingGenerator` class
- Single embedding generation
- Batch processing
- Rate limiting
- Error handling

**Model:** text-embedding-3-small (1536d)

#### `retriever.py` (50 lines)
**Purpose:** Retrieve similar chunks from database

**Key Components:**
- `Retriever` class
- Query embedding generation
- Vector similarity search
- Top-k selection

**Configuration:** Top-10 retrieval

#### `reranker.py` (70 lines)
**Purpose:** Rerank chunks using Cohere

**Key Components:**
- `Reranker` class
- Cohere API integration
- Relevance scoring
- Top-n selection

**Configuration:** Top-5 reranking

#### `answering.py` (120 lines)
**Purpose:** Generate answers with LLM

**Key Components:**
- `AnswerGenerator` class
- Context formatting
- Prompt engineering
- Citation extraction
- Token tracking

**Model:** GPT-4o

#### `database.py` (110 lines)
**Purpose:** Supabase database operations

**Key Components:**
- `Database` class
- Connection management
- Batch insertion
- Vector similarity search
- Error handling

#### `setup_db.py` (50 lines)
**Purpose:** Initialize database schema

**Operations:**
- Enable pgvector extension
- Create documents table
- Create vector index

**Usage:** Run once during setup

#### `schema.sql` (60 lines)
**Purpose:** SQL schema definition

**Contents:**
- Extension creation
- Table definition
- Index creation
- Search function

### Frontend Files

#### `App.jsx` (60 lines)
**Purpose:** Main application component

**State Management:**
- Upload status
- Answer data
- Loading state

**Child Components:**
- UploadPanel
- QuestionPanel
- AnswerDisplay

#### `UploadPanel.jsx` (80 lines)
**Purpose:** Document upload interface

**Features:**
- Text input (title, source, content)
- Form validation
- API integration
- Error handling

**API:** POST /upload

#### `QuestionPanel.jsx` (70 lines)
**Purpose:** Question input interface

**Features:**
- Question textarea
- Keyboard shortcuts (Enter to submit)
- Loading state
- Tips display

**API:** POST /ask

#### `AnswerDisplay.jsx` (60 lines)
**Purpose:** Display answer and citations

**Features:**
- Answer text with formatting
- Processing time & token count
- Citation cards with scores
- Source metadata

#### Component CSS Files
**Purpose:** Scoped styling for each component

**Approach:**
- Component-specific styles
- Consistent design system
- Responsive layout

### Configuration Files

#### `requirements.txt`
**Purpose:** Python dependencies

**Key Packages:**
- fastapi - Web framework
- openai - Embeddings & LLM
- cohere - Reranking
- psycopg2-binary - PostgreSQL
- pgvector - Vector operations
- tiktoken - Token counting

#### `package.json`
**Purpose:** Node.js dependencies

**Key Packages:**
- react - UI framework
- vite - Build tool
- axios - HTTP client

#### `render.yaml`
**Purpose:** Render deployment configuration

**Settings:**
- Python runtime
- Build/start commands
- Environment variables

#### `vercel.json`
**Purpose:** Vercel deployment configuration

**Settings:**
- Build command
- Output directory
- Framework detection

### Documentation Files

#### `README.md`
**Purpose:** Main project documentation

**Sections:**
- Architecture overview
- Tech stack
- Setup instructions
- API documentation
- Deployment guide
- Trade-offs

#### `QUICKSTART.md`
**Purpose:** Fast setup guide

**Content:**
- Prerequisites
- Step-by-step setup
- Test example
- Troubleshooting

#### `ARCHITECTURE.md`
**Purpose:** Technical deep dive

**Content:**
- System design
- Component details
- Data flow
- Design decisions
- Scalability

#### `DEPLOYMENT.md`
**Purpose:** Production deployment

**Content:**
- Supabase setup
- Render deployment
- Vercel deployment
- Monitoring
- Troubleshooting

### Evaluation Files

#### `test_cases.json`
**Purpose:** Test questions and expected behavior

**Content:**
- 5 test cases
- Different question types
- Evaluation notes
- Success metrics

#### `run_eval.py`
**Purpose:** Automated evaluation script

**Features:**
- Run all test cases
- Measure performance
- Calculate success rate
- Generate report

## Code Organization Principles

### Backend
- **Modularity:** Each file has single responsibility
- **Separation:** Business logic separate from API layer
- **Reusability:** Classes can be imported and reused
- **Error Handling:** Consistent logging and exceptions

### Frontend
- **Component-Based:** Reusable UI components
- **State Management:** Props and local state
- **Separation of Concerns:** Logic vs presentation
- **Styling:** Component-scoped CSS

## Development Workflow

### Adding New Features

**Backend:**
1. Create module in `backend/`
2. Import in `main.py`
3. Add endpoint if needed
4. Update requirements.txt
5. Test locally

**Frontend:**
1. Create component in `src/components/`
2. Import in `App.jsx`
3. Add styling
4. Update package.json if needed
5. Test in browser

### Testing

**Backend:**
```bash
# Manual testing
curl -X POST http://localhost:8000/upload -d '...'

# Automated testing
cd evaluation
python run_eval.py
```

**Frontend:**
```bash
# Browser testing
npm run dev
# Open http://localhost:3000

# Build testing
npm run build
npm run preview
```

## File Size Summary

| File | Lines | Purpose |
|------|-------|---------|
| main.py | ~200 | API endpoints |
| answering.py | ~120 | LLM generation |
| database.py | ~110 | DB operations |
| embeddings.py | ~90 | Embeddings |
| chunking.py | ~80 | Text chunking |
| reranker.py | ~70 | Reranking |
| retriever.py | ~50 | Retrieval |
| setup_db.py | ~50 | DB setup |
| App.jsx | ~60 | Main component |
| UploadPanel.jsx | ~80 | Upload UI |
| QuestionPanel.jsx | ~70 | Question UI |
| AnswerDisplay.jsx | ~60 | Answer UI |

**Total Backend:** ~850 lines
**Total Frontend:** ~270 lines
**Total Code:** ~1,120 lines

## Dependencies

### Backend (Python)
- fastapi==0.109.0
- uvicorn[standard]==0.27.0
- openai==1.12.0
- cohere==4.47
- psycopg2-binary==2.9.9
- pgvector==0.2.4
- python-dotenv==1.0.0
- pydantic==2.5.3
- tiktoken==0.5.2

### Frontend (Node)
- react@18.2.0
- react-dom@18.2.0
- axios@1.6.5
- vite@5.0.11
- @vitejs/plugin-react@4.2.1

## Environment Variables

### Backend
```
OPENAI_API_KEY=sk-...
COHERE_API_KEY=...
SUPABASE_DB_URL=postgresql://...
```

### Frontend
```
VITE_API_URL=http://localhost:8000
```

## Build Outputs

### Backend
- No build step (Python interpreted)
- Virtual environment in `venv/`

### Frontend
- Build output in `dist/`
- Optimized for production
- Static files for CDN

---

This structure keeps the codebase organized, maintainable, and easy to understand.
