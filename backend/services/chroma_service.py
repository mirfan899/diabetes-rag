import os
import chromadb
from typing import List, Dict
from sentence_transformers import SentenceTransformer


class ChromaService:
    """Service for managing ChromaDB vector store."""
    
    def __init__(self, collection_name: str = "diabetes_guidelines", persist_directory: str = "./chroma_db"):
        self.client = chromadb.PersistentClient(path=persist_directory)
        self.collection_name = collection_name
        self.collection = None
        self.embedding_model = None
        self._initialize_collection()
        self._initialize_embedding_model()
    
    def _initialize_embedding_model(self):
        """Initialize local sentence-transformer model for embeddings."""
        model_name = os.getenv("EMBEDDING_MODEL_NAME", "cross-encoder/ms-marco-MiniLM-L6-v2")
        device = os.getenv("EMBEDDING_MODEL_DEVICE", None)
        
        print(f"Loading embedding model: {model_name}")
        try:
            if device:
                self.embedding_model = SentenceTransformer(model_name, device=device)
            else:
                self.embedding_model = SentenceTransformer(model_name)
        except (OSError, RuntimeError, ValueError) as e:
            raise RuntimeError(f"Failed to load embedding model '{model_name}': {e}") from e
    
    def _initialize_collection(self):
        """Initialize or get existing ChromaDB collection."""
        self.collection = self.client.get_or_create_collection(
            name=self.collection_name,
            metadata={"description": "Diabetes treatment guidelines and recommendations"}
        )
        count = self.collection.count()
        if count > 0:
            print(f"Loaded existing collection: {self.collection_name} ({count} documents)")
        else:
            print(f"Created new collection: {self.collection_name}")
    
    def get_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Get embeddings for a list of texts using a local sentence-transformer model."""
        if not texts:
            return []
        
        if self.embedding_model is None:
            raise RuntimeError("Embedding model is not initialized")
        
        embeddings = self.embedding_model.encode(
            texts,
            batch_size=int(os.getenv("EMBEDDING_BATCH_SIZE", "32")),
            show_progress_bar=False,
            convert_to_numpy=True,
            normalize_embeddings=True
        )
        return embeddings.tolist()
    
    def add_documents(self, chunks: List[Dict]):
        """Add document chunks to ChromaDB."""
        if not chunks:
            print("No chunks to add")
            return
        
        texts = [chunk["text"] for chunk in chunks]
        metadatas = [chunk.get("metadata", {}) for chunk in chunks]
        ids = [f"chunk_{i}_{hash(chunk['text'])}" for i, chunk in enumerate(chunks)]
        
        # Get embeddings
        print(f"Generating embeddings for {len(texts)} chunks...")
        embeddings = self.get_embeddings(texts)
        
        # Add to collection
        self.collection.add(
            embeddings=embeddings,
            documents=texts,
            metadatas=metadatas,
            ids=ids
        )
        print(f"Added {len(chunks)} chunks to ChromaDB")
    
    def query(self, query_text: str, n_results: int = 5) -> List[Dict]:
        """Query ChromaDB for similar documents."""
        if not query_text:
            return []
        
        # Get query embedding
        query_embeddings = self.get_embeddings([query_text])
        
        # Query collection
        results = self.collection.query(
            query_embeddings=query_embeddings,
            n_results=n_results
        )
        
        # Format results
        formatted_results = []
        if results["documents"] and len(results["documents"][0]) > 0:
            for i in range(len(results["documents"][0])):
                formatted_results.append({
                    "text": results["documents"][0][i],
                    "metadata": results["metadatas"][0][i] if results["metadatas"] else {},
                    "distance": results["distances"][0][i] if results["distances"] else None
                })
        
        return formatted_results
    
    def get_collection_count(self) -> int:
        """Get the number of documents in the collection."""
        return self.collection.count()
    
    def delete_collection(self):
        """Delete the collection (use with caution)."""
        self.client.delete_collection(name=self.collection_name)
        print(f"Deleted collection: {self.collection_name}")

