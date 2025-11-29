import os
from typing import Dict
from .chroma_service import ChromaService
from .ollama_service import OllamaService
from .reranker_service import RerankerService


class RAGService:
    """RAG service that combines retrieval, reranking, and generation."""
    
    def __init__(self):
        self.chroma_service = ChromaService()
        self.generation_service = OllamaService()
        # Initialize reranker if enabled
        use_reranker = os.getenv("USE_RERANKER", "true").lower() == "true"
        if use_reranker:
            try:
                self.reranker_service = RerankerService()
                print("Reranker service initialized")
            except Exception as e:
                print(f"Warning: Could not initialize reranker: {e}. Continuing without reranking.")
                self.reranker_service = None
        else:
            self.reranker_service = None
    
    def build_query(self, patient_data: Dict) -> str:
        """Build a search query from patient data."""
        query_parts = []
        
        # Add diabetes type
        if patient_data.get("diabetes_type"):
            query_parts.append(patient_data["diabetes_type"])
        
        # Add key clinical indicators
        if patient_data.get("hba1cPercent"):
            hba1c = patient_data["hba1cPercent"]
            if hba1c > 7.5:
                query_parts.append("high HbA1c treatment")
            elif hba1c > 6.5:
                query_parts.append("moderate HbA1c management")
        
        # Add complications
        if patient_data.get("neuropathy"):
            query_parts.append("neuropathy management")
        if patient_data.get("nephropathy"):
            query_parts.append("nephropathy treatment")
        
        # Add comorbidities
        if patient_data.get("heartFailure"):
            query_parts.append("heart failure diabetes")
        if patient_data.get("kidneyFunction"):
            query_parts.append("kidney disease diabetes")
        
        # Add medication considerations
        if patient_data.get("currentMedications"):
            query_parts.append("medication interactions")
        
        # Add age considerations
        if patient_data.get("age"):
            age = float(patient_data["age"])
            if age > 65:
                query_parts.append("elderly diabetes management")
            elif age < 18:
                query_parts.append("pediatric diabetes")
        
        # Build final query
        if query_parts:
            base_query = " ".join(query_parts)
        else:
            base_query = "diabetes medication recommendations"
        
        # Add guideline preference
        guidelines = patient_data.get("guidelines", "ADA")
        query = f"{guidelines} guidelines {base_query}"
        
        return query
    
    def get_recommendations(self, patient_data: Dict, n_results: int = 5) -> Dict:
        """Get medicine recommendations using RAG with optional reranking."""
        # Build search query
        query = self.build_query(patient_data)
        print(f"Search query: {query}")
        
        # Retrieve more candidates if reranking is enabled, otherwise use n_results
        retrieve_count = int(os.getenv("RERANKER_RETRIEVE_COUNT", "20")) if self.reranker_service else n_results
        
        # Retrieve relevant context
        retrieved_docs = self.chroma_service.query(query, n_results=retrieve_count)
        print(f"Retrieved {len(retrieved_docs)} candidate documents")
        
        if not retrieved_docs:
            print("No relevant documents found. Using general knowledge.")
            # Still try to generate recommendations with minimal context
            relevant_docs = []
        else:
            # Rerank if reranker is available
            if self.reranker_service and len(retrieved_docs) > n_results:
                print(f"Reranking {len(retrieved_docs)} documents to get top {n_results}...")
                relevant_docs = self.reranker_service.rerank(query, retrieved_docs, top_k=n_results)
            else:
                # Use top n_results from initial retrieval
                relevant_docs = retrieved_docs[:n_results]
        
        print(f"Using {len(relevant_docs)} documents for generation")
        
        # Generate recommendations using the local Gemma model with retrieved context
        recommendations = self.generation_service.generate_recommendations(
            patient_data=patient_data,
            relevant_context=relevant_docs
        )
        
        return recommendations

