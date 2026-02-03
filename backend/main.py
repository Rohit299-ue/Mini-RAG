from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import time
import logging
from chunking import chunker
from embeddings import embedder
from database import db
from retriever import retriever
from reranker import reranker
from answering import answer_generator

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Mini RAG API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request models
class UploadRequest(BaseModel):
    content: str
    title: str = ""
    source: str = ""

class QuestionRequest(BaseModel):
    question: str

# Response models
class UploadResponse(BaseModel):
    status: str
    chunks_created: int
    processing_time: float

class AnswerResponse(BaseModel):
    answer: str
    citations: list
    processing_time: float
    tokens_used: int

@app.get("/")
def root():
    return {
        "message": "Mini RAG API",
        "version": "1.0.0",
        "endpoints": ["/upload", "/ask"]
    }

@app.post("/upload", response_model=UploadResponse)
async def upload_document(request: UploadRequest):
    """
    Upload and process text document
    
    Process:
    1. Chunk text with overlap
    2. Generate embeddings for each chunk
    3. Store in vector database
    """
    try:
        start_time = time.time()
        
        logger.info(f"Processing upload: {request.title or 'Untitled'}")
        
        # Validate input
        if not request.content or len(request.content.strip()) < 10:
            raise HTTPException(status_code=400, detail="Content too short")
        
        # Step 1: Chunk text
        chunks = chunker.chunk_text(
            text=request.content,
            source=request.source,
            title=request.title,
            section=""
        )
        
        if not chunks:
            raise HTTPException(status_code=400, detail="Failed to create chunks")
        
        # Step 2: Generate embeddings
        chunk_texts = [chunk['content'] for chunk in chunks]
        embeddings = embedder.generate_embeddings_batch(chunk_texts)
        
        # Combine chunks with embeddings
        for chunk, embedding in zip(chunks, embeddings):
            chunk['embedding'] = embedding
        
        # Step 3: Store in database
        inserted_count = db.insert_chunks(chunks)
        
        processing_time = time.time() - start_time
        
        logger.info(f"Upload completed: {inserted_count} chunks in {processing_time:.2f}s")
        
        return UploadResponse(
            status="success",
            chunks_created=inserted_count,
            processing_time=round(processing_time, 2)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Upload failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ask", response_model=AnswerResponse)
async def ask_question(request: QuestionRequest):
    """
    Ask question about uploaded documents
    
    RAG Pipeline:
    1. Embed query
    2. Retrieve top-10 similar chunks
    3. Rerank to top-5
    4. Generate answer with LLM
    5. Return answer with citations
    """
    try:
        start_time = time.time()
        
        logger.info(f"Processing question: {request.question[:100]}...")
        
        # Validate input
        if not request.question or len(request.question.strip()) < 3:
            raise HTTPException(status_code=400, detail="Question too short")
        
        # Step 1 & 2: Retrieve similar chunks
        retrieved_chunks = retriever.retrieve(request.question)
        
        if not retrieved_chunks:
            return AnswerResponse(
                answer="I could not find relevant information in the uploaded documents.",
                citations=[],
                processing_time=round(time.time() - start_time, 2),
                tokens_used=0
            )
        
        # Step 3: Rerank chunks
        reranked_chunks = reranker.rerank(request.question, retrieved_chunks)
        
        # Step 4: Generate answer
        result = answer_generator.generate_answer(request.question, reranked_chunks)
        
        processing_time = time.time() - start_time
        
        logger.info(f"Question answered in {processing_time:.2f}s")
        
        return AnswerResponse(
            answer=result['answer'],
            citations=result['citations'],
            processing_time=round(processing_time, 2),
            tokens_used=result['tokens_used']
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Question answering failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
