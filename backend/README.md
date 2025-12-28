# Diabetes RAG Backend

A sophisticated Python FastAPI backend that uses **Retrieval-Augmented Generation (RAG)** to provide evidence-based, personalized medicine recommendations for diabetes patients.

## ✨ Core Features

- 🧠 **RAG Pipeline**: Intelligent retrieval-augmented generation with ChromaDB vector storage
- 🎯 **Reranking**: Two-stage retrieval with BGE reranker for optimal relevance
- 📄 **Smart PDF Processing**: Intelligent chunking and extraction from clinical guidelines
- 🤖 **Local LLM**: Privacy-first recommendations using Gemma via Ollama (no external API calls)
- ⚡ **FastAPI**: High-performance RESTful API with CORS support
- 🔗 **Frontend Integration**: Seamless Angular frontend integration

> **📚 Architecture Details**: For comprehensive system architecture, data flow, design patterns, and technical decisions, see [ARCHITECTURE.md](./ARCHITECTURE.md)

## Prerequisites

- **pyenv**: Python version manager (required)
- **Python 3.10.10**: Will be installed automatically via pyenv
- **Ollama**: Local LLM runtime (https://ollama.ai)

Install pyenv if you don't have it:

```bash
curl https://pyenv.run | bash
# Follow the installation instructions for your system
```

## 🚀 Quick Setup

**Option 1: Using the setup script (Recommended)**

```bash
cd backend
./setup.sh
```

The script will:

- Check for pyenv installation
- Install Python 3.10.10 if not already installed
- Set local Python version to 3.10.10
- Create a virtual environment
- Install all dependencies

**Option 2: Manual setup**

1. **Set up Python 3.10.10 with pyenv**:

```bash
cd backend
pyenv install 3.10.10
pyenv local 3.10.10
```

2. **Create virtual environment**:

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**:

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

4. **Start Ollama** (in a separate terminal):

```bash
ollama serve
```

5. **Install required Ollama models** (in another terminal while Ollama is running):

```bash
# Main embedding model (required)
ollama pull embeddinggemma

# Main LLM (required)
ollama pull gemma:2b

# Reranker model (optional but recommended for quality)
ollama pull bge-reranker-large
```

> 💡 **Tip**: The first model pull takes 5-10 minutes. Subsequent pulls are much faster.

6. **Set up environment variables (optional)**:

Create a `.env` file in the `backend/` directory:

```bash
# Ollama configuration
OLLAMA_HOST=http://localhost:11434
OLLAMA_EMBEDDING_MODEL=embeddinggemma
OLLAMA_LLM_MODEL=gemma:2b
OLLAMA_TEMPERATURE=0.3

# Reranker configuration
OLLAMA_RERANKER_MODEL=bge-reranker-large
USE_RERANKER=true
RERANKER_RETRIEVE_COUNT=20
```

7. **Initialize ChromaDB with PDFs**:

```bash
python init_db.py
```

This will:

- Process all PDF files in the `../pdfs/` directory
- Extract and intelligently chunk text
- Generate embeddings locally using Ollama embeddings
- Store vectors in ChromaDB with metadata
- Create a searchable knowledge base

**Initialization Output:**
```
Processing PDF files...
✓ Processed: diabetes-guidelines-2025.pdf (8,240 chunks)
✓ Processed: medication-handbook.pdf (5,120 chunks)
ChromaDB initialized with 13,360 document chunks
Database persisted to ./chroma_db/
```

8. **Run the server**:

```bash
python main.py
# Or using uvicorn directly with hot-reload:
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`

**API Documentation:**
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 📡 API Endpoints

### Health Check

**GET** `/`
- **Purpose**: Service health verification
- **Response**: 
```json
{
  "status": "healthy",
  "service": "Diabetes RAG API",
  "version": "1.0.0"
}
```

---

### Get Recommendations

**POST** `/patients/recommendations`

Get evidence-based medicine recommendations based on patient clinical data.

**Request Body** (all fields optional except `diabetes_type`):

```json
{
  "guidelines": "ADA",
  "diabetes_type": "Type 2",
  
  "clinical_metrics": {
    "age": 55,
    "gender": "male",
    "hba1cPercent": 8.5,
    "bloodGlucoseFastingMgDl": 180,
    "weightKg": 85,
    "heightCm": 175,
    "bmi": 27.8,
    "bloodPressure": "140/90",
    "pulse": 72
  },
  
  "medical_history": {
    "duration": "8 years",
    "currentMedications": "Metformin 1000mg daily",
    "familyHistory": "Father with T2DM",
    "allergies": "Sulfonamides"
  },
  
  "complications": {
    "neuropathy": "Mild peripheral neuropathy",
    "nephropathy": "Absent",
    "kidneyFunction": "Normal (eGFR >60)",
    "liverFunction": "Normal",
    "heartFailure": "No"
  },
  
  "symptoms_findings": {
    "currentSymptoms": "Increased thirst, polyuria",
    "footExamNotes": "Loss of vibration sense in feet",
    "eyeExamNotes": "No retinopathy",
    "weightChanges": "Stable"
  }
}
```

**Response**:

```json
{
  "medicines": [
    {
      "medicine_name": "Metformin",
      "quantity_dose_strength": "1000-2000mg daily (divided doses)",
      "reason": [
        "First-line agent for Type 2 diabetes",
        "HbA1c 8.5% indicates need for therapy intensification",
        "Improves insulin sensitivity",
        "Weight neutral with cardioprotective benefits",
        "Normal kidney function allows use (eGFR >60)"
      ],
      "reference": "ADA Standards of Medical Care 2025"
    },
    {
      "medicine_name": "Glibenclamide",
      "quantity_dose_strength": "5-10mg daily",
      "reason": [
        "Consider if Metformin monotherapy insufficient",
        "Effective HbA1c reduction",
        "Cost-effective option"
      ],
      "reference": "ADA Guidelines & Endocrine Society"
    }
  ],
  
  "lifestyle": [
    "Structured exercise: 150 minutes/week moderate intensity",
    "Medical nutrition therapy: Low glycemic index diet",
    "Reduce refined carbohydrates and added sugars",
    "Weight loss of 5-10% if overweight",
    "Smoking cessation counseling",
    "Alcohol moderation (≤2 units/day)"
  ],
  
  "investigations": [
    "Repeat HbA1c in 3 months",
    "Fasting lipid panel (annual)",
    "Urine albumin-to-creatinine ratio",
    "Comprehensive metabolic panel (baseline and annual)",
    "Annual dilated retinal examination",
    "Annual foot examination"
  ],
  
  "notes": [
    "Monitor for hypoglycemia if adding second agent",
    "Peripheral neuropathy noted - optimize glycemic control to prevent progression",
    "Annual cardiovascular risk assessment recommended",
    "Consider ACE inhibitor/ARB for blood pressure control"
  ]
}
```

**Response Details**:
- `medicines`: Array of recommended medications with clinical reasoning
- `lifestyle`: Evidence-based lifestyle modifications
- `investigations`: Recommended investigations and monitoring frequency
- `notes`: Additional clinical considerations and monitoring points

---

## 🗂️ Project Structure

```
backend/
├── main.py                          # FastAPI application entry point
├── init_db.py                       # ChromaDB initialization script
├── requirements.txt                 # Python dependencies
├── setup.sh                         # Automated setup script
├── run.sh                           # Server startup script
│
├── models/
│   ├── __init__.py
│   └── schemas.py                   # Pydantic validation models
│                                    #   • RecommendationRequest
│                                    #   • RecommendationResponse
│                                    #   • MedicineRecommendation
│
├── services/
│   ├── __init__.py
│   │
│   ├── rag_service.py              # RAG Orchestrator
│   │   • Builds semantic queries from patient data
│   │   • Orchestrates retrieval → reranking → generation
│   │   • Handles the complete RAG pipeline
│   │
│   ├── chroma_service.py           # Vector Store Management
│   │   • ChromaDB client initialization
│   │   • Semantic similarity search
│   │   • Document storage & retrieval
│   │   • Collection management
│   │
│   ├── ollama_service.py           # LLM & Embedding Provider
│   │   • Connects to Ollama API
│   │   • Generates medical recommendations
│   │   • Produces embeddings for retrieval
│   │   • Health checks for LLM availability
│   │
│   ├── reranker_service.py         # Document Reranking
│   │   • BGE cross-encoder reranker
│   │   • Scores candidate documents
│   │   • Selects top-k most relevant
│   │
│   ├── pdf_processor.py            # Knowledge Base Builder
│   │   • PDF text extraction
│   │   • Intelligent document chunking
│   │   • Metadata attachment
│   │   • Handles multiple PDFs
│   │
│   └── __pycache__/                # Python cache (ignored)
│
├── tests/
│   ├── test_ollama_models.py       # LLM availability tests
│   └── test_recommendation_api.py  # API endpoint tests
│
├── chroma_db/                       # Persistent Vector Store
│   ├── chroma.sqlite3              # SQLite backend
│   └── {collection-uuid}/          # Collection data
│
└── __pycache__/                    # Python cache (ignored)
```

---

## ⚙️ Configuration Guide

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `OLLAMA_HOST` | `http://localhost:11434` | Ollama API endpoint |
| `OLLAMA_EMBEDDING_MODEL` | `embeddinggemma` | Model for vector embeddings |
| `OLLAMA_LLM_MODEL` | `gemma:2b` | LLM for recommendations |
| `OLLAMA_TEMPERATURE` | `0.3` | Generation temperature (0.0-1.0) |
| `OLLAMA_RERANKER_MODEL` | `bge-reranker-large` | Reranker model name |
| `USE_RERANKER` | `true` | Enable/disable reranking |
| `RERANKER_RETRIEVE_COUNT` | `20` | Candidates before reranking |

### PDF Processing Configuration

Located in `services/pdf_processor.py`:

```python
CHUNK_SIZE = 1000          # Characters per chunk
CHUNK_OVERLAP = 200        # Overlap between chunks
```

**Optimization Tips**:
- Increase `CHUNK_SIZE` for longer context (better coherence)
- Increase `CHUNK_OVERLAP` for better chunk transitions
- Tune based on your PDF content and embedding quality

### ChromaDB Configuration

- **Storage**: `./chroma_db/` directory
- **Backend**: SQLite (default, no extra setup needed)
- **Persistence**: Automatic, survives server restarts
- **Collection**: Auto-created during `init_db.py`

### Query Builder Configuration

The RAG service automatically constructs queries based on:

```python
# Diabetes classification
• Type 1 vs Type 2 vs LADA

# HbA1c-based severity
• HbA1c > 7.5% → "high HbA1c treatment"
• HbA1c > 6.5% → "moderate HbA1c management"

# Complications
• Neuropathy → "neuropathy management"
• Nephropathy → "nephropathy treatment"

# Comorbidities  
• Heart failure → "heart failure diabetes"
• CKD → "kidney disease diabetes"

# Medications & interactions
• Current meds → "medication interactions"

# Age demographics
• Age > 65 → "elderly diabetes management"
• Age < 18 → "pediatric diabetes"
```

---

## 📊 Data Models

### RecommendationRequest

```python
class RecommendationRequest(BaseModel):
    # Patient classification
    guidelines: str = "ADA"                    # Treatment guideline preference
    diabetes_type: str                         # Type 1, Type 2, LADA, etc.
    
    # Clinical metrics
    age: Optional[float]                       # Patient age
    gender: Optional[str]                      # Male/Female
    hba1cPercent: Optional[float]              # Glycated hemoglobin (%)
    bloodGlucoseFastingMgDl: Optional[float]   # Fasting glucose (mg/dL)
    
    # Anthropometric data
    weightKg: Optional[float]                  # Body weight (kg)
    heightCm: Optional[float]                  # Height (cm)
    bmi: Optional[float]                       # Body mass index
    bloodPressure: Optional[str]               # Format: "systolic/diastolic"
    pulse: Optional[float]                     # Heart rate (bpm)
    
    # Medical history
    duration: Optional[str]                    # Diabetes duration
    currentMedications: Optional[str]          # Current treatment regimen
    familyHistory: Optional[str]               # Family history of diabetes
    allergies: Optional[str]                   # Drug allergies
    
    # Complications & Comorbidities
    neuropathy: Optional[str]                  # Peripheral/autonomic neuropathy
    nephropathy: Optional[str]                 # Diabetic nephropathy status
    kidneyFunction: Optional[str]              # eGFR/renal function
    liverFunction: Optional[str]               # Hepatic function
    heartFailure: Optional[str]                # Heart failure presence
    
    # Symptoms & findings
    currentSymptoms: Optional[str]             # Active symptoms
    footExamNotes: Optional[str]               # Foot examination findings
    eyeExamNotes: Optional[str]                # Retinal examination findings
    weightChanges: Optional[str]               # Recent weight trends
```

### MedicineRecommendation

```python
class MedicineRecommendation(BaseModel):
    medicine_name: str                         # Generic/brand name
    quantity_dose_strength: str                # Dosage and frequency
    reason: List[str]                          # Clinical reasoning (multiple factors)
    reference: str                             # Guideline source
```

### RecommendationResponse

```python
class RecommendationResponse(BaseModel):
    medicines: List[MedicineRecommendation]    # Ordered medication list
    lifestyle: List[str]                       # Non-pharmacological interventions
    investigations: List[str]                  # Recommended tests & monitoring
    notes: List[str]                           # Additional clinical considerations
```

---



## 🧪 Testing

### Run Tests

```bash
# Run all tests
pytest tests/

# Run specific test file
pytest tests/test_recommendation_api.py -v

# Run with coverage
pytest --cov=services tests/
```

### Test Files

**`test_ollama_models.py`**:
- Verifies Ollama connectivity
- Tests embedding generation
- Tests LLM generation
- Checks reranker availability

**`test_recommendation_api.py`**:
- Tests API endpoints
- Validates response schemas
- Tests edge cases
- Verifies error handling

---

## 🚨 Troubleshooting

### Ollama Connection Error

```
ConnectionError: Failed to connect to http://localhost:11434
```

**Solution**:
1. Verify Ollama is running: `ollama serve`
2. Check OLLAMA_HOST environment variable
3. Test connection: `curl http://localhost:11434/api/health`

### ChromaDB Not Initialized

```
RuntimeError: Collection not found
```

**Solution**:
```bash
# Reinitialize the database
python init_db.py
```

### Low Recommendation Quality

**Optimization steps**:
1. Ensure reranker is enabled: `USE_RERANKER=true`
2. Increase retrieve count: `RERANKER_RETRIEVE_COUNT=30`
3. Verify PDFs are in `../pdfs/` directory
4. Check chunk size and overlap in `pdf_processor.py`

### Out of Memory

**If running on limited resources**:
```bash
# Use smaller embedding model
export OLLAMA_EMBEDDING_MODEL=all-minilm

# Use smaller LLM
export OLLAMA_LLM_MODEL=tinyllama

# Disable reranker
export USE_RERANKER=false
```

---

## 📈 Performance Optimization

### Recommendation Latency

Current benchmarks (with reranking enabled):
- Query building: ~50ms
- Retrieval (20 docs): ~200ms
- Reranking: ~500ms
- Generation: ~2-5s
- **Total**: ~3-6 seconds

### Optimization Strategies

| Optimization | Impact | Trade-off |
|-------------|--------|-----------|
| Disable reranker | -500ms | Lower quality |
| Reduce retrieve count to 10 | -100ms | Fewer reference docs |
| Use smaller LLM (tinyllama) | -3s | Lower quality output |
| Cache embeddings | Variable | Complex implementation |
| Async processing | N/A | Better UX |

### Scaling Considerations

For production deployments:
1. **Load Balancing**: Multiple FastAPI instances
2. **Vector DB**: Consider managed solutions (Pinecone, Weaviate)
3. **LLM Serving**: Dedicated LLM server (vLLM, TGI)
4. **Caching**: Redis for repeated queries
5. **Monitoring**: Log response times and quality metrics

---

## 📝 Notes

- **Privacy**: All processing happens locally - no data leaves your server
- **Reproducibility**: Temperature set to 0.3 ensures consistent recommendations
- **Extensibility**: Easy to add new medical guidelines or PDFs
- **Monitoring**: Enable DEBUG logging for detailed pipeline traces
- **Updates**: Regularly update PDFs in `../pdfs/` and reinitialize ChromaDB

---

## 🔗 Related Documentation

- [Integration Guide](../INTEGRATION.md) - Frontend integration details
- [Table Handling](./TABLE_HANDLING.md) - Database schema information
- [Ollama Documentation](https://ollama.ai) - LLM runtime details
