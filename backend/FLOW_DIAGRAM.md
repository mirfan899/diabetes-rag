# Diabetes RAG Application - High-Level Flow

```mermaid
flowchart TD
    Frontend[Frontend<br/>Angular App] --> FastAPI[FastAPI<br/>REST API]
    
    FastAPI --> RAGPipeline[RAG Pipeline]
    
    subgraph RAGPipeline[" "]
        VectorSearch[Vector Search<br/>ChromaDB]
        Reranker[Reranker<br/>BGE-Reranker]
        LLM[LLM Generation<br/>Gemma 3B]
        
        VectorSearch --> Reranker
        Reranker --> LLM
    end
    
    LLM --> FastAPI
    FastAPI --> Frontend
    
    style Frontend fill:#4A90E2,stroke:#2E5C8A,stroke-width:3px,color:#fff
    style FastAPI fill:#50C878,stroke:#2D8659,stroke-width:3px,color:#fff
    style RAGPipeline fill:#F5F5F5,stroke:#333,stroke-width:2px
    style VectorSearch fill:#9B59B6,stroke:#6C3483,stroke-width:2px,color:#fff
    style Reranker fill:#F39C12,stroke:#B9770E,stroke-width:2px,color:#fff
    style LLM fill:#E74C3C,stroke:#A93226,stroke-width:2px,color:#fff
```

## Sequence Diagram

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant FastAPI
    participant RAGPipeline
    
    User->>Frontend: Patient Data
    Frontend->>FastAPI: Request
    FastAPI->>RAGPipeline: Process
    RAGPipeline-->>FastAPI: Recommendations
    FastAPI-->>Frontend: Response
    Frontend-->>User: Results
```

## Flow Description

1. **Frontend**: User submits patient data
2. **FastAPI**: Receives request and orchestrates RAG pipeline
3. **RAG Pipeline**:
   - **Vector Search**: Retrieves relevant documents from ChromaDB
   - **Reranker**: Improves document relevance (optional)
   - **LLM**: Generates personalized recommendations
4. **FastAPI**: Returns structured response
5. **Frontend**: Displays recommendations to user  

