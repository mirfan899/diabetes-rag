import os
from typing import List, Dict
import ollama
import numpy as np


class RerankerService:
    """Service for reranking retrieved documents using BGE reranker model via Ollama."""
    
    def __init__(self):
        self.reranker_model = os.getenv("OLLAMA_RERANKER_MODEL", "qllama/bge-reranker-large")
        self.ollama_host = os.getenv("OLLAMA_HOST")
        self.ollama_client = None
        self._initialize_client()
    
    def _initialize_client(self):
        """Initialize Ollama client for reranking."""
        print(f"Using Ollama reranker model: {self.reranker_model}")
        try:
            if self.ollama_host:
                self.ollama_client = ollama.Client(host=self.ollama_host)
            else:
                self.ollama_client = ollama.Client()
        except Exception as e:
            raise RuntimeError(
                f"Failed to connect to Ollama for reranking at '{self.ollama_host or 'default host'}': {e}"
            ) from e
    
    def rerank(self, query: str, documents: List[Dict], top_k: int = 5) -> List[Dict]:
        """
        Rerank documents based on query relevance using BGE reranker.
        
        BGE reranker models work by encoding query-document pairs and computing
        relevance scores. We use the model's embeddings for the concatenated
        query-document pair to get a relevance score.
        
        Args:
            query: The search query
            documents: List of document dicts with 'text' and 'metadata' keys
            top_k: Number of top documents to return after reranking
            
        Returns:
            List of reranked documents (top_k most relevant)
        """
        if not documents:
            return []
        
        if len(documents) <= top_k:
            # No need to rerank if we have fewer documents than top_k
            return documents
        
        try:
            scores = []
            
            # Get query embedding for comparison
            query_embedding = None
            try:
                query_response = self.ollama_client.embeddings(
                    model=self.reranker_model,
                    prompt=query
                )
                query_embedding = np.array(query_response["embedding"])
            except Exception as e:
                print(f"Warning: Could not get query embedding: {e}")
            
            # Score each document
            for doc in documents:
                doc_text = doc.get("text", "")
                if not doc_text:
                    # Skip empty documents, use original distance if available
                    scores.append((doc.get("distance", 0.0), doc))
                    continue
                
                try:
                    # BGE reranker format: concatenate query and document
                    # The model is trained on "query [SEP] document" format
                    # For Ollama, we'll use a simple concatenation
                    pair_text = f"{query} {doc_text}"
                    
                    # Get embedding for the query-document pair
                    response = self.ollama_client.embeddings(
                        model=self.reranker_model,
                        prompt=pair_text
                    )
                    pair_embedding = np.array(response["embedding"])
                    
                    # Compute relevance score
                    # For BGE reranker, we can use the embedding's magnitude or
                    # compute similarity with query embedding if available
                    if query_embedding is not None:
                        # Use cosine similarity between query and pair embedding
                        similarity = np.dot(query_embedding, pair_embedding) / (
                            np.linalg.norm(query_embedding) * np.linalg.norm(pair_embedding)
                        )
                        scores.append((similarity, doc))
                    else:
                        # Use the embedding's magnitude as a proxy for relevance
                        # Higher magnitude suggests better match
                        score = np.linalg.norm(pair_embedding)
                        scores.append((score, doc))
                    
                except Exception as e:
                    print(f"Error scoring document: {e}")
                    # Fallback: use original distance if available (invert for similarity)
                    # ChromaDB distances are lower for more similar, so we negate
                    original_score = -doc.get("distance", 0.0) if doc.get("distance") is not None else 0.0
                    scores.append((original_score, doc))
            
            # Sort by score (higher is better)
            scores.sort(key=lambda x: x[0], reverse=True)
            
            # Return top_k documents
            reranked = [doc for _, doc in scores[:top_k]]
            
            print(f"Reranked {len(documents)} documents, returning top {len(reranked)}")
            return reranked
            
        except Exception as e:
            print(f"Error during reranking: {e}")
            # Fallback: return original documents sorted by distance
            sorted_docs = sorted(documents, key=lambda x: x.get("distance", float('inf')))
            return sorted_docs[:top_k]
