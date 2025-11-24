from typing import Dict, List
from .chroma_service import ChromaService
from .openai_service import OpenAIService


class RAGService:
    """RAG service that combines retrieval and generation."""
    
    def __init__(self):
        self.chroma_service = ChromaService()
        self.openai_service = OpenAIService()
    
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
        """Get medicine recommendations using RAG."""
        # Build search query
        query = self.build_query(patient_data)
        print(f"Search query: {query}")
        
        # Retrieve relevant context
        relevant_docs = self.chroma_service.query(query, n_results=n_results)
        print(f"Retrieved {len(relevant_docs)} relevant documents")
        
        if not relevant_docs:
            print("No relevant documents found. Using general knowledge.")
            # Still try to generate recommendations with minimal context
            relevant_docs = []
        
        # Generate recommendations using OpenAI with retrieved context
        recommendations = self.openai_service.generate_recommendations(
            patient_data=patient_data,
            relevant_context=relevant_docs
        )
        
        return recommendations

