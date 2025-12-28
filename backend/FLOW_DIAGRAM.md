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


## Agentic RAG Flow (Advanced)

```mermaid
flowchart TD
    Frontend[Frontend<br/>Angular App] --> FastAPI[FastAPI<br/>REST API]
    
    FastAPI --> Agent[Agent Service<br/>LangChain ReAct]
    
    subgraph AgentLoop["Agent Reasoning Loop"]
        Agent --> Thought[Reasoning]
        Thought --> Decision{Need Info?}
        
        Decision -- Yes --> ToolCall[Call Tool<br/>distillery]
        Decision -- No --> Synthesis[Synthesize Answer]
        
        ToolCall --> Tools[Tools Layer]
        
        subgraph KnowledgeBase["Knowledge Retrieval"]
            Tools --> VectorSearch[Vector Search]
            VectorSearch --> Reranker[Reranker]
        end
        
        Reranker --> ToolCall
        ToolCall --> Agent
    end
    
    Synthesis --> FastAPI
    FastAPI --> Frontend
    
    style Frontend fill:#4A90E2,stroke:#2E5C8A,stroke-width:3px,color:#fff
    style FastAPI fill:#50C878,stroke:#2D8659,stroke-width:3px,color:#fff
    style Agent fill:#9B59B6,stroke:#6C3483,stroke-width:3px,color:#fff
    style AgentLoop fill:#F9F9F9,stroke:#333,stroke-width:2px,stroke-dasharray: 5 5
    style KnowledgeBase fill:#E8F8F5,stroke:#1ABC9C,stroke-width:2px
```

## Agentic Process Description

1. **Frontend**: Submits patient data to `/patients/agent-recommendations`.
2. **Agent Service**: Initiates a ReAct (Reason+Act) loop.
3. **Reasoning Loop**: 
   - **Thought**: Agent analyzes the patient's specific condition (e.g., "Patient has kidney disease").
   - **Action**: Agent dynamically formulates a search query (e.g., "diabetes meds safe for kidney disease").
   - **Observation**: Agent reads the retrieved guidelines.
   - **Iteration**: Agent may search again if more info is needed.
4. **Synthesis**: Agent compiles all findings into the final JSON recommendation.
