import os
import cohere
from dotenv import load_dotenv
import logging

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class Reranker:
    def __init__(self, top_n=5):
        api_key = os.getenv("COHERE_API_KEY")
        if not api_key:
            raise ValueError("COHERE_API_KEY not set in environment")
        
        self.client = cohere.Client(api_key)
        self.top_n = top_n
        self.model = "rerank-english-v3.0"
    
    def rerank(self, query, chunks):
        """
        Rerank retrieved chunks using Cohere Rerank API
        
        Args:
            query: User question string
            chunks: List of chunk dictionaries from retrieval
            
        Returns:
            Top-n reranked chunks ordered by relevance
        """
        try:
            if not chunks:
                logger.warning("No chunks to rerank")
                return []
            
            logger.info(f"Reranking {len(chunks)} chunks")
            
            # Extract text content for reranking
            documents = [chunk['content'] for chunk in chunks]
            
            # Call Cohere Rerank API
            response = self.client.rerank(
                model=self.model,
                query=query,
                documents=documents,
                top_n=self.top_n,
                return_documents=True
            )
            
            # Map reranked results back to original chunks
            reranked_chunks = []
            for result in response.results:
                original_chunk = chunks[result.index]
                reranked_chunk = {
                    **original_chunk,
                    'rerank_score': result.relevance_score
                }
                reranked_chunks.append(reranked_chunk)
            
            logger.info(f"Reranked to top {len(reranked_chunks)} chunks")
            
            return reranked_chunks
            
        except Exception as e:
            logger.error(f"Reranking failed: {e}")
            raise

reranker = Reranker(top_n=5)
