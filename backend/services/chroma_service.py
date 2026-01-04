import os
import chromadb
from typing import List, Dict
import ollama
from pathlib import Path

class ChromaService:
    """Service for managing ChromaDB vector store."""
    
    def __init__(self, collection_name: str = "diabetes_guidelines", persist_directory: str = None):
        if persist_directory is None:
            # Default to backend/data/chroma_db
            backend_dir = Path(__file__).parent.parent
            data_dir = backend_dir / "data"
            data_dir.mkdir(exist_ok=True)
            persist_directory = str(data_dir / "chroma_db")
            
        self.client = chromadb.PersistentClient(path=persist_directory)
        self.collection_name = collection_name
        self.collection = None
        self.embedding_model_name = os.getenv("OLLAMA_EMBEDDING_MODEL", "embeddinggemma")
        self.ollama_host = os.getenv("OLLAMA_HOST")
        self.ollama_client = None
        self._initialize_collection()
        self._initialize_embedding_client()
    
    def _initialize_embedding_client(self):
        """Initialize Ollama client for embeddings."""
        print(f"Using Ollama embedding model: {self.embedding_model_name}")
        try:
            if self.ollama_host:
                self.ollama_client = ollama.Client(host=self.ollama_host)
            else:
                self.ollama_client = ollama.Client()
        except Exception as e:
            raise RuntimeError(
                f"Failed to connect to Ollama at '{self.ollama_host or 'default host'}': {e}"
            ) from e
    
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
        """Get embeddings for a list of texts using a local Ollama embedding model."""
        if not texts:
            return []
        
        if self.ollama_client is None:
            raise RuntimeError("Ollama client is not initialized")
        
        embeddings: List[List[float]] = []
        for text in texts:
            try:
                response = self.ollama_client.embeddings(
                    model=self.embedding_model_name,
                    prompt=text
                )
                embeddings.append(response["embedding"])
            except Exception as e:
                raise RuntimeError(
                    f"Failed to generate embedding with model '{self.embedding_model_name}': {e}"
                ) from e
        
        return embeddings
    
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

