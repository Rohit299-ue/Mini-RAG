import os
from openai import OpenAI
from dotenv import load_dotenv
import logging
import time

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class EmbeddingGenerator:
    def __init__(self):
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY not set in environment")
        
        self.client = OpenAI(api_key=api_key)
        self.model = "text-embedding-3-small"
        self.dimensions = 1536
    
    def generate_embedding(self, text):
        """Generate embedding for a single text"""
        try:
            response = self.client.embeddings.create(
                model=self.model,
                input=text,
                encoding_format="float"
            )
            
            embedding = response.data[0].embedding
            
            if len(embedding) != self.dimensions:
                raise ValueError(f"Expected {self.dimensions} dimensions, got {len(embedding)}")
            
            return embedding
            
        except Exception as e:
            logger.error(f"Failed to generate embedding: {e}")
            raise
    
    def generate_embeddings_batch(self, texts, batch_size=100):
        """Generate embeddings for multiple texts in batches"""
        try:
            all_embeddings = []
            total = len(texts)
            
            logger.info(f"Generating embeddings for {total} texts")
            
            for i in range(0, total, batch_size):
                batch = texts[i:i + batch_size]
                
                response = self.client.embeddings.create(
                    model=self.model,
                    input=batch,
                    encoding_format="float"
                )
                
                batch_embeddings = [item.embedding for item in response.data]
                all_embeddings.extend(batch_embeddings)
                
                logger.info(f"Processed {min(i + batch_size, total)}/{total} texts")
                
                # Rate limiting
                if i + batch_size < total:
                    time.sleep(0.1)
            
            return all_embeddings
            
        except Exception as e:
            logger.error(f"Failed to generate embeddings batch: {e}")
            raise

embedder = EmbeddingGenerator()
