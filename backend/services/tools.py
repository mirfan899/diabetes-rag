import os
from typing import Dict, List, Optional
from langchain_core.tools import Tool
from .chroma_service import ChromaService
from .reranker_service import RerankerService

class DiabetesTools:
    def __init__(self):
        self.chroma_service = ChromaService()
        self.reranker_service = None
        
        # Initialize reranker if enabled
        use_reranker = os.getenv("USE_RERANKER", "true").lower() == "true"
        if use_reranker:
            try:
                self.reranker_service = RerankerService()
                print("Tools: Reranker service initialized")
            except Exception as e:
                print(f"Tools: Could not initialize reranker: {e}")

    def search_guidelines(self, query: str) -> str:
        """
        Useful for searching medical guidelines, identifying medication interactions, 
        and finding specific treatment protocols for diabetes. 
        Input should be a specific search query.
        """
        print(f"Tool Action: Searching for '{query}'...")
        
        # 1. Retrieve
        n_results = 20 if self.reranker_service else 10
        results = self.chroma_service.query(query, n_results=n_results)
        
        if not results:
            return "No relevant guidelines found for this query."
            
        # 2. Rerank (if available)
        if self.reranker_service and len(results) > 0:
            results = self.reranker_service.rerank(query, results, top_k=5)
        else:
            results = results[:5]
            
        # 3. Format output for the LLM
        formatted_results = []
        for i, doc in enumerate(results, 1):
            source = doc.get('metadata', {}).get('source', 'Unknown')
            content = doc.get('text', '').strip()
            formatted_results.append(f"Result {i} (Source: {source}):\n{content}")
            
        return "\n\n".join(formatted_results)

    def get_tools(self) -> List[Tool]:
        """Return a list of Tools usable by the Agent."""
        return [
            Tool(
                name="search_clinical_guidelines",
                func=self.search_guidelines,
                description="Use this tool to search for diabetes clinical guidelines, medication info, and treatment protocols. Input should be a specific search query."
            )
        ]
