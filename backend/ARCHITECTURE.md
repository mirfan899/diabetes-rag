# Diabetes RAG System - Complete Architecture Guide

This document provides a comprehensive architectural overview of the Diabetes RAG (Retrieval-Augmented Generation) system, including design patterns, data flow, and technical decisions.

## Table of Contents

1. [System Overview](#system-overview)
2. [Component Architecture](#component-architecture)
3. [Data Flow Patterns](#data-flow-patterns)
4. [Technology Stack](#technology-stack)
5. [Design Patterns](#design-patterns)
6. [Integration Architecture](#integration-architecture)
7. [Deployment Architecture](#deployment-architecture)
9. [Agentic RAG Architecture](#agentic-rag-architecture)

---

## System Overview

### What is RAG?

**Retrieval-Augmented Generation (RAG)** is a hybrid AI architecture that combines:

1. **Retrieval**: Finding relevant information from a knowledge base
2. **Augmentation**: Enhancing the context with retrieved information
3. **Generation**: Creating tailored responses using a language model

### Why RAG for Diabetes Management?

```
Traditional LLM:                    RAG-Enhanced LLM:
┌─────────────┐                    ┌─────────────┐
│   Prompt    │                    │   Prompt    │
└──────┬──────┘                    └──────┬──────┘
       │                                  │
       │                          ┌───────▼───────┐
       │                          │   Knowledge   │
       │                          │   Retrieval   │
       │                          │   (ChromaDB)  │
       │                          └───────┬───────┘
       │                                  │
   ┌───▼──────────────┐        ┌──────────▼──────────┐
   │  Language Model  │        │  Language Model     │
   │  (Generic)       │        │  (Context-Aware)    │
   │  Hallucinations  │        │  Fact-grounded      │
   │  Generic answers │        │  Specific medicines │
   └────────┬─────────┘        └─────────┬──────────┘
            │                            │
       ┌────▼─────────┐        ┌────────▼────────┐
       │ Generic text │        │ Evidence-based  │
       │ No sources   │        │ recommendations │
       │              │        │ With citations  │
       └──────────────┘        └─────────────────┘
```

### Benefits

- ✅ **Evidence-Based**: Recommendations grounded in clinical guidelines
- ✅ **Traceable**: Each recommendation cites its source
- ✅ **Up-to-date**: Easily updateable with new clinical guidelines
- ✅ **Contextual**: Considers patient's specific profile
- ✅ **Safe**: Reduces hallucinations and false information

---

## Component Architecture

### 1. FastAPI Web Server Layer

**File**: `main.py`

```python
FastAPI Application
├── Middleware Configuration
│   ├── CORS setup for frontend access
│   └── Request/response logging
├── Startup Events
│   └── Initialize RAG service
├── Health Endpoints
│   ├── GET / → service status
│   └── GET /health → detailed health check
└── Recommendation Endpoints
    └── POST /patients/recommendations
```

**Responsibilities**:
- HTTP request handling and validation
- CORS configuration for Angular frontend
- Request routing to services
- Response serialization
- Error handling

**Key Features**:
- Auto-generated OpenAPI documentation (`/docs`)
- ReDoc API documentation (`/redoc`)
- Pydantic-based validation (automatic schema validation)

---

### 2. Data Models Layer

**File**: `models/schemas.py`

```python
Pydantic Models
├── RecommendationRequest
│   ├── Patient demographics (age, gender)
│   ├── Clinical metrics (HbA1c, glucose, BP)
│   ├── Medical history (duration, meds, allergies)
│   ├── Complications (neuropathy, nephropathy)
│   └── Symptoms (current symptoms, exam findings)
│
├── MedicineRecommendation
│   ├── medicine_name: str
│   ├── quantity_dose_strength: str
│   ├── reason: List[str] (multiple factors)
│   └── reference: str (guideline source)
│
└── RecommendationResponse
    ├── medicines: List[MedicineRecommendation]
    ├── lifestyle: List[str] (non-pharm interventions)
    ├── investigations: List[str] (monitoring plan)
    └── notes: List[str] (clinical considerations)
```

**Design Principles**:
- **Type Safety**: All fields strongly typed
- **Validation**: Automatic validation on instantiation
- **Documentation**: Field descriptions for API docs
- **Optional Fields**: Flexible patient data input

---

### 3. RAG Service Layer

**File**: `services/rag_service.py`

### Architecture: Service Orchestrator Pattern

```python
RAGService (Orchestrator)
│
├── Initialization
│   ├── Initialize ChromaService (vector store)
│   ├── Initialize OllamaService (LLM + embeddings)
│   └── Optional: Initialize RerankerService
│
└── Public Interface
    └── get_recommendations(patient_data) → RecommendationResponse
        │
        ├── Step 1: build_query(patient_data)
        │           └── Semantic query construction
        │
        ├── Step 2: chroma_service.query(query)
        │           └── Retrieve top-20 documents
        │
        ├── Step 3: reranker_service.rerank() [optional]
        │           └── Rerank to top-10 documents
        │
        ├── Step 4: assemble_context()
        │           └── Build prompt with clinical context
        │
        └── Step 5: ollama_service.generate()
                    └── Generate recommendations
```

**Query Building Logic**:

```python
Query construction strategy:
1. Start with guideline preference (e.g., "ADA guidelines")
2. Add diabetes type classification
3. Add severity indicators:
   • If HbA1c > 7.5% → "high HbA1c treatment"
   • If HbA1c > 6.5% → "moderate HbA1c management"
4. Add complications:
   • Neuropathy → "neuropathy management"
   • Nephropathy → "nephropathy treatment"
5. Add comorbidities:
   • Heart failure → "heart failure diabetes"
   • CKD → "kidney disease diabetes"
6. Add demographic context:
   • Age > 65 → "elderly diabetes management"
   • Age < 18 → "pediatric diabetes"
7. Final query: Concatenate all relevant terms

Example Output:
"ADA guidelines Type 2 diabetes high HbA1c treatment 
neuropathy management elderly diabetes management kidney disease"
```

---

### 4. ChromaDB Service (Vector Store)

**File**: `services/chroma_service.py`

```
ChromaService
├── Initialization
│   └── Connect to ChromaDB instance (./chroma_db/)
│
├── Core Operations
│   ├── query(search_text, n_results) → List[Document]
│   │   ├── Convert query to embedding
│   │   ├── Vector similarity search
│   │   └── Return ranked documents with scores
│   │
│   ├── store_documents(chunks, embeddings, metadata)
│   │   ├── Insert document chunks
│   │   ├── Index embeddings
│   │   └── Persist metadata
│   │
│   └── get_collection() → Collection
│       └── Access ChromaDB collection
│
└── Data Structure
    ├── Collection: "diabetes_guidelines"
    ├── Each document contains:
    │   ├── text: chunk content
    │   ├── embedding: vector (384-dim for embeddinggemma)
    │   ├── metadata:
    │   │   ├── source: original PDF filename
    │   │   ├── chunk_index: position in document
    │   │   └── page_number: for reference
    │   └── id: unique identifier
    └── Persistence: SQLite backend (./chroma_db/chroma.sqlite3)
```

**Vector Store Strategy**:

```
Vector Space Representation (384-dimensional for embeddinggemma):

                 HbA1c Treatment
                      ▲
                      │
                      │    Neuropathy
                      │   /  Management
                      │  /
                      │ /
Kidney Disease ◄─────●───────► Medication
Management           ╱  ╲
                    ╱    ╲
            Elderly        Young
            Management    Patient

Each document chunk positioned in this semantic space
based on its content similarity to guide retrieval
```

---

### 5. Ollama Service (LLM Provider)

**File**: `services/ollama_service.py`

```
OllamaService
├── Embedding Generation
│   ├── generate_embedding(text) → np.ndarray
│   │   └── Calls embeddinggemma model
│   │
│   └── Embedding Configuration
│       ├── Model: embeddinggemma
│       ├── Dimensions: 384
│       ├── Response: vector embeddings
│       └── Use: Semantic similarity search
│
├── LLM Generation
│   ├── generate(prompt) → str
│   │   ├── Calls Gemma 2B LLM
│   │   ├── Temperature: 0.3 (deterministic)
│   │   ├── Context: Previous prompt + patient data
│   │   └── Returns: JSON recommendations
│   │
│   └── LLM Configuration
│       ├── Model: Gemma 2B
│       ├── Temperature: 0.3 (low randomness)
│       ├── Max tokens: 2000
│       ├── Format: Structured JSON output
│       └── Privacy: Local execution (no API calls)
│
└── Health Management
    ├── check_health() → bool
    ├── Retries with exponential backoff
    └── Graceful degradation if unavailable
```

**Model Characteristics**:

| Model | Purpose | Size | Latency | Quality |
|-------|---------|------|---------|---------|
| embeddinggemma | Embedding | 1.4GB | ~10ms | Medium |
| Gemma 2B | Generation | 2.0GB | ~2-5s | Good |
| BGE Reranker | Reranking | 2.2GB | ~400ms | Excellent |

---

### 6. Reranker Service (Quality Improvement)

**File**: `services/reranker_service.py`

```
RerankerService (Optional Enhancement)
│
├── Initialization
│   └── Load BGE cross-encoder model
│
├── Reranking Pipeline
│   ├── Input: Query + 20 candidate documents
│   │
│   ├── Step 1: Prepare pairs
│   │   └── Create (query, document_text) pairs
│   │
│   ├── Step 2: Score pairs
│   │   ├── Cross-encoder similarity scoring
│   │   ├── More nuanced than vector similarity
│   │   └── Scores: 0.0 - 1.0
│   │
│   ├── Step 3: Rank results
│   │   └── Sort by cross-encoder score
│   │
│   └── Step 4: Select top-k
│       └── Return top 10 most relevant documents
│
└── Impact
    ├── Quality improvement: ~30% better matches
    ├── Performance cost: ~500ms additional latency
    └── Optional: Can be disabled if speed critical
```

**Reranking Explanation**:

```
Vector Similarity vs Cross-Encoder Scoring:

Vector Similarity (Fast):
Query: "HbA1c management"
Vector → [0.1, 0.5, ..., 0.3]
         Compare dot product
         Fast but sometimes misses context

Cross-Encoder (Accurate):
Query: "HbA1c management"
+ Document: "Glycated hemoglobin control strategies"
            → Direct scoring (0.89)
            → Understands semantic relationships
            → Slower but more accurate

Result: Better quality context for LLM generation
```

---

### 7. PDF Processor (Knowledge Base Builder)

**File**: `services/pdf_processor.py`

```
PDFProcessor
│
├── Document Ingestion
│   ├── Scan ../pdfs/ directory
│   ├── Detect PDF files
│   └── Process in order
│
├── Text Extraction
│   ├── PyPDF2 or pdfplumber
│   ├── Extract text per page
│   ├── Clean whitespace
│   └── Preserve structure
│
├── Intelligent Chunking
│   ├── Split on semantic boundaries
│   ├── Chunk size: 1000 characters (configurable)
│   ├── Overlap: 200 characters (for context)
│   │
│   └── Strategy:
│       ├── Prefer: Break at paragraphs
│       ├── Then: Break at sentences
│       ├── Then: Break at character boundary
│       └── Result: Semantically coherent chunks
│
├── Metadata Attachment
│   ├── Source PDF filename
│   ├── Page numbers
│   ├── Chunk index
│   └── Extraction timestamp
│
└── Output
    ├── Chunks with embeddings
    └── Stored in ChromaDB
```

**Chunking Visualization**:

```
Original PDF:
┌──────────────────────────────────┐
│ Diabetes Management Guidelines   │
│                                  │
│ Chapter 1: Type 2 Diabetes       │
│ Treatment recommendations...     │  ◄── 3000 chars
│ For elderly patients...          │
│                                  │
│ Chapter 2: Complications         │
│ Neuropathy management...         │  ◄── 4000 chars
│ Retinopathy considerations...    │
└──────────────────────────────────┘

After Chunking (1000 char chunks with 200 char overlap):
┌───────────────┬───────────────┐
│   Chunk 1     │               │
│   1000 chars  │               │
└───┬───────────┴────────────────┐
    │   Chunk 2 (with overlap)   │
    │   1000 chars               │
    └───┬──────────────┬─────────┘
        │   Chunk 3    │
        │   1000 chars │
        └──────────────┘

Benefits:
• Each chunk is retrievable independently
• Overlap ensures context continuity
• No important information lost
```

---

## Data Flow Patterns

### Complete Request-Response Cycle

```
1. USER SUBMITS PATIENT DATA
   └── Angular Frontend
       └── POST /patients/recommendations
           {
             "diabetes_type": "Type 2",
             "age": 55,
             "hba1cPercent": 8.5,
             "neuropathy": "Mild",
             ...
           }

2. REQUEST VALIDATION
   └── FastAPI
       └── Pydantic schema validation
           └── RecommendationRequest model
               └── All fields type-checked

3. RAG SERVICE INITIALIZATION
   └── Get RAGService instance
       └── Verify ChromaDB available
       └── Verify Ollama accessible

4. QUERY BUILDING
   └── rag_service.build_query(patient_data)
       └── Analyze clinical profile
       └── Construct semantic query
           "ADA guidelines Type 2 diabetes high HbA1c treatment..."

5. SEMANTIC RETRIEVAL
   └── chroma_service.query(query, n_results=20)
       └── Convert query → embedding (embeddinggemma)
       └── Vector similarity search
       └── Return 20 top documents with scores

6. OPTIONAL RERANKING
   └── If USE_RERANKER=true:
       └── reranker_service.rerank(query, docs, top_k=10)
           └── Cross-encoder scoring
           └── Re-sort by semantic relevance
           └── Return top 10 documents

7. CONTEXT ASSEMBLY
   └── Build prompt template:
       [SYSTEM]: Medical specialist role
       [PATIENT]: Clinical profile summary
       [CONTEXT]: Top 10 retrieved documents
       [TASK]: Generate recommendations

8. LLM GENERATION
   └── ollama_service.generate(prompt)
       └── Gemma 2B model processes context
       └── Temperature: 0.3 (deterministic)
       └── Generates JSON recommendations
           {
             "medicines": [...],
             "lifestyle": [...],
             "investigations": [...],
             "notes": [...]
           }

9. RESPONSE VALIDATION
   └── Parse JSON output
   └── Validate against RecommendationResponse schema
   └── Handle parsing errors gracefully

10. RESPONSE RETURN
    └── Send JSON to frontend
        └── Frontend displays recommendations
            └── User sees medications, dosages, reasons, monitoring plan
```

### Error Handling Flow

```
Error Detection
    │
    ├── Validation Error
    │   └── Invalid patient data
    │   └── Return: 422 Unprocessable Entity
    │
    ├── Service Initialization Error
    │   ├── ChromaDB not found
    │   ├── Ollama not running
    │   └── Return: 503 Service Unavailable
    │
    ├── Retrieval Error
    │   ├── No relevant documents found
    │   └── Continue with generic context
    │
    ├── Generation Error
    │   ├── LLM timeout
    │   ├── Invalid JSON output
    │   └── Return: 500 Internal Server Error
    │
    └── Response Error
        ├── JSON parsing fails
        ├── Schema validation fails
        └── Return: 500 Internal Server Error

Each layer has specific error handling:
• FastAPI: HTTP error codes
• RAG Service: Logging + graceful degradation
• Ollama Service: Retries + timeout handling
• ChromaDB: Connection pooling + error recovery
```

---

## Technology Stack

### Backend Framework
- **FastAPI**: Modern async web framework
- **LangChain**: Framework for building agents
- **Pydantic**: Data validation and serialization
- **Uvicorn**: ASGI server

### Vector Database & Retrieval
- **ChromaDB**: Vector store for similarity search
- **Embeddinggemma**: Vector embeddings (384-dim)

### Language Models (via Ollama)
- **Ollama**: Local LLM runtime
- **Gemma 2B**: Main LLM for recommendations
- **BGE Reranker**: Cross-encoder for reranking

### Document Processing
- **PyPDF2 or pdfplumber**: PDF text extraction
- **NumPy**: Numerical operations for embeddings

### Testing & Quality
- **Pytest**: Unit and integration testing
- **CORS Middleware**: Cross-origin request handling

### Deployment
- **Docker**: Containerization (optional)
- **Python 3.10.10**: Runtime environment

---

## Design Patterns

### 1. Service Locator Pattern

```python
# RAGService acts as a service locator/orchestrator
class RAGService:
    def __init__(self):
        self.chroma_service = ChromaService()
        self.ollama_service = OllamaService()
        self.reranker_service = RerankerService() if enabled else None
    
    def get_recommendations(self, patient_data):
        # Services are accessed through this single point
        docs = self.chroma_service.query(query)
        if self.reranker_service:
            docs = self.reranker_service.rerank(docs)
        return self.ollama_service.generate(context)
```

**Benefits**: Centralized service management, easy testing, flexible service swapping

### 2. Pipeline Pattern

```
Patient Data 
    ↓
┌─────────────────────┐
│ Query Building      │
└─────────┬───────────┘
          ↓
┌─────────────────────┐
│ Semantic Retrieval  │
└─────────┬───────────┘
          ↓
┌─────────────────────┐
│ Reranking           │ (optional)
└─────────┬───────────┘
          ↓
┌─────────────────────┐
│ Context Assembly    │
└─────────┬───────────┘
          ↓
┌─────────────────────┐
│ LLM Generation      │
└─────────┬───────────┘
          ↓
    Recommendations
```

**Benefits**: Clear separation of concerns, easy to debug, modular improvements

### 3. Dependency Injection

```python
# Services can be injected and tested independently
def get_recommendations_with_services(
    patient_data: dict,
    chroma: ChromaService,
    ollama: OllamaService,
    reranker: Optional[RerankerService] = None
):
    # Flexible service configuration
    # Easy to mock for testing
    pass
```

**Benefits**: Testability, loose coupling, flexibility

### 4. Strategy Pattern (Query Building)

```python
# Different query building strategies based on diabetes type
def build_query(patient_data):
    if patient_data['diabetes_type'] == 'Type 1':
        return build_type1_query(patient_data)
    elif patient_data['diabetes_type'] == 'Type 2':
        return build_type2_query(patient_data)
    else:
        return build_generic_query(patient_data)
```

**Benefits**: Extensible, maintainable, clear logic

---

## Integration Architecture

### Frontend-Backend Integration

```
Angular Frontend
    │
    ├── HTTP Client
    │   ├── Base URL: http://localhost:8000 (dev)
    │   ├── Default headers
    │   └── Error interceptors
    │
    ├── API Service
    │   ├── getRecommendations(patientData)
    │   ├── Response transformation
    │   └── Error handling
    │
    └── Components
        ├── Patient Form Component
        │   └── Collects patient data
        ├── Recommendations Display
        │   └── Shows medications, lifestyle, etc.
        └── Loading Indicators
            └── Shows RAG pipeline progress

    ↕ HTTP / JSON / CORS

FastAPI Backend
    │
    ├── CORS Middleware
    │   ├── Allow-Origin: Angular app URL
    │   ├── Allow-Methods: GET, POST, OPTIONS
    │   └── Allow-Headers: Content-Type, Authorization
    │
    ├── Request Handling
    │   ├── Validate incoming data
    │   ├── Process recommendations
    │   └── Return JSON response
    │
    └── Response Format
        └── Standard JSON with schema
```

### External Service Integration

```
FastAPI Backend
    │
    ├── ↔ ChromaDB (Local)
    │   ├── Connection: In-process or localhost:8000
    │   ├── Data: Vector store
    │   └── Persistence: ./chroma_db/
    │
    ├── ↔ Ollama Server (Local)
    │   ├── Connection: http://localhost:11434
    │   ├── Services: Embeddings, LLM, Reranking
    │   └── Models: embeddinggemma, Gemma 2B, BGE
    │
    └── ← Clinical PDFs
        └── Location: ../pdfs/
        └── Processing: init_db.py (one-time)
```

---

## Deployment Architecture

### Development Environment

```
Developer Machine
    │
    ├── Python 3.10.10 (via pyenv)
    ├── Virtual Environment (venv)
    ├── FastAPI Server (hot-reload)
    ├── ChromaDB (./chroma_db/)
    ├── Ollama Server (localhost:11434)
    │
    └── Frontend Dev Server (Angular)
        └── Proxy to http://localhost:8000
```

### Production Environment (Recommended)

```
Production Server
    │
    ├── Container Layer
    │   ├── Docker image with Python 3.10.10
    │   ├── FastAPI app in container
    │   ├── Exposed port: 8000
    │   └── Volume: /app/chroma_db (persistent)
    │
    ├── Ollama Layer
    │   ├── Separate container or host process
    │   ├── GPU support (recommended)
    │   ├── Persistent models
    │   └── Port: 11434
    │
    ├── Frontend Layer
    │   ├── Static hosting (NGINX)
    │   ├── Angular build artifacts
    │   ├── Reverse proxy to backend
    │   └── HTTPS/SSL
    │
    └── Monitoring
        ├── Log aggregation
        ├── Health checks
        ├── Metrics collection
        └── Alerting
```

### Scaling Architecture

```
For handling multiple requests:

Load Balancer (NGINX/HAProxy)
    │
    ├── FastAPI Instance 1 ────┐
    ├── FastAPI Instance 2 ────┼──→ Shared ChromaDB
    ├── FastAPI Instance 3 ────┤   (or distributed)
    └── FastAPI Instance N ────┘
         │
         └──→ Shared Ollama Server
              (or load-balanced instances)

Considerations:
• ChromaDB: Can use managed service (Pinecone, Weaviate)
• Ollama: Use dedicated GPU server or vLLM for efficiency
• FastAPI: Stateless, easily horizontally scalable
• Caching: Redis layer for popular queries
```

---

---

## Agentic RAG Architecture

The system has been upgraded to support **Agentic RAG**, moving beyond linear pipelines to a reasoning-based approach.

### 1. Agent Service Layer

**File**: `services/agent_service.py`

```python
AgentService
├── Components
│   ├── LangChain ChatOllama (LLM Wrapper)
│   ├── LangChain ReAct Agent (Reasoning Loop)
│   └── Tool Definitions
│
└── Execution Flow
    └── run_agent(patient_data)
        ├── 1. Analyze Patient Data
        ├── 2. Formulate "Reasoning Traces" (Thoughts)
        ├── 3. Select Tool (Search Guidelines)
        ├── 4. Observe Tool Output
        ├── 5. Iterate (Reason → Act → Observe)
        └── 6. Synthesize Final JSON Response
```

**Key Difference**: Unlike the linear `RAGService`, the `AgentService` determines **what** to search for dynamically based on the patient's specific conditions (e.g., specific comorbidities).

### 2. Tools Layer

**File**: `services/tools.py`

Wraps existing services into callable tools for the LLM.

- **`search_clinical_guidelines`**: 
    - **Input**: Natural language search query (e.g., "medications for diabetes with kidney failure")
    - **Logic**: Calls `ChromaService` + `RerankerService`
    - **Output**: Top 5 ranked textual snippets from guidelines

### 3. Agentic Data Flow

```
Agent Loop (ReAct Pattern):

   Start
     │
     ▼
┌─────────┐
│ Thought │ "Patient has neuropathy. I should check
│ (LLM)   │  neuropathy-specific guidelines."
└────┬────┘
     │
     ▼
┌─────────┐      ┌─────────────────────────┐
│ Action  │ ───► │ Tool: Search Guidelines │
│ (Tool)  │      │ Query: "neuropathy..."  │
└────┬────┘      └────────────┬────────────┘
     │                        │
     ◀────────────────────────┘
     │
┌─────────┐
│ Observ- │ "Found: First-line treatment for
│ ation   │  neuropathy is Pregabalin..."
└────┬────┘
     │
     ▼
┌─────────┐
│ Thought │ "I have enough info. I will now
│ (LLM)   │  formulate the recommendation."
└────┬────┘
     │
     ▼
   Final
   Answer
   (JSON)
```

---

## Error Handling & Resilience

### Service Health Monitoring

```python
Health Check Strategy:

On startup:
    1. ChromaDB connection test
    2. Ollama connectivity test
    3. Model availability verification

During runtime:
    1. Periodic health checks (every 60 seconds)
    2. Connection pooling with retry logic
    3. Graceful degradation if reranker unavailable
    4. Timeout handling for LLM calls
    5. Automatic reconnection attempts

Response codes:
    • 200: All systems operational
    • 503: Ollama or ChromaDB unavailable
    • 504: Timeout on LLM generation
```

### Failure Scenarios & Recovery

| Scenario | Impact | Recovery |
|----------|--------|----------|
| ChromaDB unavailable | Recommendations fail (503) | Restart service, check disk space |
| Ollama down | All LLM calls fail (503) | Start Ollama server |
| Reranker model missing | Use basic retrieval | Download model via `ollama pull` |
| LLM timeout | Slow recommendations | Increase timeout, check server load |
| Memory exhaustion | OOM errors | Reduce batch sizes, use smaller models |
| Network issues | Connection errors | Verify network connectivity, firewall rules |

### Graceful Degradation

```python
# Example: Reranker failure handling
try:
    if use_reranker:
        documents = reranker_service.rerank(documents)
except Exception as e:
    logger.warning(f"Reranker failed: {e}, using basic retrieval")
    # Continue with top-k from basic retrieval
    documents = documents[:top_k]

# Result: System remains functional, quality may be slightly reduced
```

---

## Performance Characteristics

### Latency Breakdown

```
User submits request
    │
    ├─ Request validation: ~10ms
    │
    ├─ Query building: ~30ms
    │
    ├─ Semantic retrieval (ChromaDB): ~150-300ms
    │   └─ Embedding generation: ~50ms
    │   └─ Vector search: ~100-250ms
    │
    ├─ Reranking (optional): ~400-600ms
    │   └─ Cross-encoder scoring: ~400ms
    │   └─ Re-sorting: ~200ms
    │
    ├─ Context assembly: ~20ms
    │
    ├─ LLM generation: ~2-5 seconds
    │   └─ Gemma 2B inference
    │   └─ Can be 5-10s on CPU
    │
    ├─ Response parsing & validation: ~50ms
    │
    └─ Total: ~3-7 seconds (typical)
       ~5-15 seconds (with slow LLM)

Optimization opportunities:
1. Caching: Store results for identical queries
2. Async: Process in parallel where possible
3. Model selection: Smaller models for speed
4. Hardware: GPU acceleration for LLM
```

### Memory Footprint

```
Typical memory usage:

FastAPI Process: ~200MB
ChromaDB: ~100MB (varies with corpus size)
Ollama (running): ~2-4GB
  - embeddinggemma: ~1.4GB
  - Gemma 2B: ~2GB
  - BGE Reranker: ~2GB (when active)

Total: ~4-8GB RAM recommended
```

### Throughput

```
Single instance (sequential):
- ~6-10 recommendations/minute (with LLM bottleneck)
- ~30-50 recommendations/minute (LLM processing not counted)

With multiple instances:
- Linear scaling with instances (if shared LLM)
- Non-linear if separate Ollama per instance
- ChromaDB queries highly parallelizable
```

---

## Future Enhancements

### Planned Improvements

1. **Caching Layer**
   - Redis for query result caching
   - Reduces LLM calls for repeated queries

2. **Async Processing**
   - Background recommendation generation
   - WebSocket updates to frontend

3. **Fine-tuned Models**
   - Custom Gemma model on diabetes data
   - Better domain-specific outputs

4. **Multi-modal Support**
   - Process medical images
   - Integrate with medical literature databases

5. **Feedback Loop**
   - Collect doctor feedback on recommendations
   - Continuous model improvement

6. **Compliance & Audit**
   - Full recommendation audit trail
   - HIPAA compliance logging
   - Decision explanability

---

## Conclusion

The Diabetes RAG system represents a modern approach to clinical decision support, combining:

✅ **State-of-the-art AI** (RAG architecture)
✅ **Local processing** (Privacy-first)
✅ **Evidence-based** (Grounded in clinical guidelines)
✅ **Scalable** (Containerized, modular)
✅ **Maintainable** (Clean architecture, design patterns)

This architecture prioritizes reliability, explainability, and clinical safety while maintaining performance and flexibility for future enhancements.
