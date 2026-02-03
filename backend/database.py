import os
import psycopg2
from psycopg2.extras import execute_values
from dotenv import load_dotenv
import logging

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class Database:
    def __init__(self):
        self.conn_string = os.getenv("SUPABASE_DB_URL")
        if not self.conn_string:
            raise ValueError("SUPABASE_DB_URL not set in environment")
        
    def get_connection(self):
        try:
            conn = psycopg2.connect(self.conn_string)
            return conn
        except Exception as e:
            logger.error(f"Database connection failed: {e}")
            raise
    
    def insert_chunks(self, chunks_data):
        """Insert multiple chunks with embeddings into database"""
        try:
            conn = self.get_connection()
            cur = conn.cursor()
            
            query = """
                INSERT INTO documents (content, embedding, source, title, section, position)
                VALUES %s
                RETURNING id
            """
            
            values = [
                (
                    chunk['content'],
                    chunk['embedding'],
                    chunk.get('source', ''),
                    chunk.get('title', ''),
                    chunk.get('section', ''),
                    chunk.get('position', 0)
                )
                for chunk in chunks_data
            ]
            
            execute_values(cur, query, values)
            conn.commit()
            
            inserted_count = cur.rowcount
            cur.close()
            conn.close()
            
            logger.info(f"Inserted {inserted_count} chunks into database")
            return inserted_count
            
        except Exception as e:
            logger.error(f"Failed to insert chunks: {e}")
            raise
    
    def search_similar(self, query_embedding, top_k=10):
        """Retrieve top-k similar chunks using cosine similarity"""
        try:
            conn = self.get_connection()
            cur = conn.cursor()
            
            # Register pgvector extension
            cur.execute("CREATE EXTENSION IF NOT EXISTS vector")
            
            query = """
                SELECT 
                    id,
                    content,
                    source,
                    title,
                    section,
                    position,
                    1 - (embedding <=> %s::vector) as similarity
                FROM documents
                ORDER BY embedding <=> %s::vector
                LIMIT %s
            """
            
            cur.execute(query, (query_embedding, query_embedding, top_k))
            results = cur.fetchall()
            
            chunks = []
            for row in results:
                chunks.append({
                    'id': str(row[0]),
                    'content': row[1],
                    'source': row[2],
                    'title': row[3],
                    'section': row[4],
                    'position': row[5],
                    'similarity': float(row[6])
                })
            
            cur.close()
            conn.close()
            
            logger.info(f"Retrieved {len(chunks)} similar chunks")
            return chunks
            
        except Exception as e:
            logger.error(f"Failed to search similar chunks: {e}")
            raise

db = Database()
