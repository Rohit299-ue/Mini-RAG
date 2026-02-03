import tiktoken
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TextChunker:
    def __init__(self, chunk_size=1000, overlap=150):
        self.chunk_size = chunk_size
        self.overlap = overlap
        self.encoding = tiktoken.get_encoding("cl100k_base")
    
    def count_tokens(self, text):
        """Count tokens in text"""
        return len(self.encoding.encode(text))
    
    def chunk_text(self, text, source="", title="", section=""):
        """
        Split text into overlapping chunks
        
        Args:
            text: Input text to chunk
            source: Source document name
            title: Document title
            section: Section name
            
        Returns:
            List of chunk dictionaries with metadata
        """
        try:
            # Encode text to tokens
            tokens = self.encoding.encode(text)
            total_tokens = len(tokens)
            
            logger.info(f"Chunking text with {total_tokens} tokens")
            
            chunks = []
            position = 0
            
            # Create overlapping chunks
            start = 0
            while start < total_tokens:
                end = min(start + self.chunk_size, total_tokens)
                chunk_tokens = tokens[start:end]
                chunk_text = self.encoding.decode(chunk_tokens)
                
                chunks.append({
                    'content': chunk_text,
                    'source': source,
                    'title': title,
                    'section': section,
                    'position': position,
                    'token_count': len(chunk_tokens)
                })
                
                position += 1
                
                # Move start position with overlap
                if end >= total_tokens:
                    break
                start = end - self.overlap
            
            logger.info(f"Created {len(chunks)} chunks")
            return chunks
            
        except Exception as e:
            logger.error(f"Chunking failed: {e}")
            raise

chunker = TextChunker()
