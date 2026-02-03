from embeddings import embedder
from database import db
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class Retriever:
    def __init__(self, top_k=10):
        self.top_k = top_k
    
    def retrieve(self, query):
        """
        Retrieve top-k similar chunks for a query
        
        Args:
            query: User question string
            
        Returns:
            List of chunk dictionaries with content and metadata
        """
        try:
            logger.info(f"Retrieving chunks for query: {query[:100]}...")
            
            # Generate embedding for query
            query_embedding = embedder.generate_embedding(query)
            
            # Search database for similar chunks
            chunks = db.search_similar(query_embedding, top_k=self.top_k)
            
            logger.info(f"Retrieved {len(chunks)} chunks")
            
            return chunks
            
        except Exception as e:
            logger.error(f"Retrieval failed: {e}")
            raise

retriever = Retriever(top_k=10)
