import psycopg2
from dotenv import load_dotenv
import os
import logging

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def setup_database():
    """Initialize database with pgvector extension and documents table"""
    conn_string = os.getenv("SUPABASE_DB_URL")
    
    if not conn_string:
        raise ValueError("SUPABASE_DB_URL not set in environment")
    
    try:
        conn = psycopg2.connect(conn_string)
        cur = conn.cursor()
        
        # Enable pgvector extension
        logger.info("Creating pgvector extension...")
        cur.execute("CREATE EXTENSION IF NOT EXISTS vector")
        
        # Create documents table
        logger.info("Creating documents table...")
        cur.execute("""
            CREATE TABLE IF NOT EXISTS documents (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                content TEXT,
                embedding VECTOR(1536),
                source TEXT,
                title TEXT,
                section TEXT,
                position INT
            )
        """)
        
        # Create index for faster similarity search
        logger.info("Creating vector index...")
        cur.execute("""
            CREATE INDEX IF NOT EXISTS documents_embedding_idx 
            ON documents 
            USING ivfflat (embedding vector_cosine_ops)
            WITH (lists = 100)
        """)
        
        conn.commit()
        cur.close()
        conn.close()
        
        logger.info("Database setup completed successfully!")
        
    except Exception as e:
        logger.error(f"Database setup failed: {e}")
        raise

if __name__ == "__main__":
    setup_database()
