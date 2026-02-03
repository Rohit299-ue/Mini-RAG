import os
from openai import OpenAI
from dotenv import load_dotenv
import logging

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AnswerGenerator:
    def __init__(self):
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY not set in environment")
        
        self.client = OpenAI(api_key=api_key)
        self.model = "gpt-4o"
    
    def format_context(self, chunks):
        """Format reranked chunks as numbered context"""
        context_parts = []
        for i, chunk in enumerate(chunks, 1):
            context_parts.append(f"[{i}] {chunk['content']}")
        return "\n\n".join(context_parts)
    
    def generate_answer(self, query, reranked_chunks):
        """
        Generate answer using LLM with citations
        
        Args:
            query: User question
            reranked_chunks: Top-n reranked chunks
            
        Returns:
            Dictionary with answer, citations, and token usage
        """
        try:
            if not reranked_chunks:
                return {
                    'answer': "I could not find relevant information in the uploaded documents.",
                    'citations': [],
                    'tokens_used': 0
                }
            
            logger.info(f"Generating answer for query: {query[:100]}...")
            
            # Format context with citations
            context = self.format_context(reranked_chunks)
            
            # Create system prompt
            system_prompt = """You are a helpful assistant that answers questions based ONLY on the provided context.

CRITICAL RULES:
1. You MUST cite sources using inline citations like [1], [2], etc.
2. Every factual claim MUST have a citation
3. If the answer is not in the context, respond: "I could not find relevant information in the uploaded documents."
4. Do not use external knowledge
5. Be concise and direct
6. Combine information from multiple sources when relevant"""

            # Create user prompt
            user_prompt = f"""Context:
{context}

Question: {query}

Answer the question using ONLY the context above. Include inline citations [1], [2], etc. for every claim."""

            # Call GPT-4o
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.3,
                max_tokens=500
            )
            
            answer = response.choices[0].message.content
            tokens_used = response.usage.total_tokens
            
            # Prepare citations
            citations = []
            for i, chunk in enumerate(reranked_chunks, 1):
                citations.append({
                    'id': i,
                    'text': chunk['content'][:200] + "..." if len(chunk['content']) > 200 else chunk['content'],
                    'source': chunk.get('source', 'Unknown'),
                    'title': chunk.get('title', ''),
                    'section': chunk.get('section', ''),
                    'similarity': chunk.get('similarity', 0),
                    'rerank_score': chunk.get('rerank_score', 0)
                })
            
            logger.info(f"Generated answer with {tokens_used} tokens")
            
            return {
                'answer': answer,
                'citations': citations,
                'tokens_used': tokens_used
            }
            
        except Exception as e:
            logger.error(f"Answer generation failed: {e}")
            raise

answer_generator = AnswerGenerator()
