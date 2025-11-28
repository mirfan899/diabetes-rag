# Diabetes RAG Backend

A Python FastAPI backend that uses RAG (Retrieval Augmented Generation) to provide evidence-based medicine recommendations for diabetes patients.

## Features

- **RAG System**: Uses ChromaDB for vector storage and Ollama `embeddinggemma` embeddings
- **PDF Processing**: Extracts and processes clinical guidelines from PDF files
- **Local LLM via Ollama**: Generates personalized medication recommendations with Gemma 3B
- **FastAPI**: RESTful API that integrates with the Angular frontend

## Prerequisites

- **pyenv**: Python version manager (required)
- **Python 3.10.10**: Will be installed automatically via pyenv
- **Ollama**: Local LLM runtime (https://ollama.ai)

Install pyenv if you don't have it:

```bash
curl https://pyenv.run | bash
# Follow the installation instructions for your system
```

## Quick Setup

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

4. **Install required Ollama models**:

```bash
ollama pull embeddinggemma
ollama pull gemma3:1b
```

5. **Set up environment variables (optional)**:

```bash
export OLLAMA_HOST=http://localhost:11434   # Override if running remotely
export OLLAMA_EMBEDDING_MODEL=embeddinggemma
export OLLAMA_LLM_MODEL=gemma3:1b
export OLLAMA_TEMPERATURE=0.3
```

6. **Initialize ChromaDB with PDFs**:

```bash
python init_db.py
```

This will:

- Process all PDF files in the `../pdfs/` directory
- Extract text and chunk it
- Generate embeddings locally using Ollama `embeddinggemma`
- Store in ChromaDB

7. **Run the server**:

```bash
python main.py
# Or using uvicorn directly:
uvicorn main:app --reload --port 8000
```

## API Endpoints

### POST `/patients/recommendations`

Get medicine recommendations based on patient data.

**Request Body**:

```json
{
  "guidelines": "ADA",
  "diabetes_type": "Type 2",
  "hba1cPercent": 8.5,
  "age": 55,
  "gender": "male",
  "weightKg": 85,
  "heightCm": 175,
  "bmi": 27.8,
  "currentSymptoms": "Increased thirst, frequent urination",
  "neuropathy": "Mild",
  "kidneyFunction": "normal",
  ...
}
```

**Response**:

```json
{
  "medicines": [
    {
      "medicine_name": "Metformin",
      "quantity_dose_strength": "500-2000mg daily",
      "reason": ["First-line treatment for Type 2 diabetes", "High HbA1c"],
      "reference": "ADA Guidelines 2025"
    }
  ],
  "lifestyle": ["Diet modification", "Regular exercise"],
  "notes": ["Monitor kidney function", "Start with low dose"],
  "investigations": ["HbA1c in 3 months", "Kidney function test"]
}
```

## Project Structure

```
backend/
├── main.py                 # FastAPI application
├── init_db.py             # Script to initialize ChromaDB
├── requirements.txt       # Python dependencies
├── models/
│   └── schemas.py         # Pydantic models
└── services/
    ├── pdf_processor.py   # PDF text extraction and chunking
    ├── chroma_service.py  # ChromaDB vector store management
    ├── ollama_service.py  # Local Gemma integration via Ollama
    └── rag_service.py     # RAG orchestration
```

## Configuration

- **Chunk Size**: Default 1000 characters (configurable in `pdf_processor.py`)
- **Chunk Overlap**: Default 200 characters
- **Embedding Model**: Ollama `embeddinggemma` (configurable via `OLLAMA_EMBEDDING_MODEL`)
- **LLM Model**: Ollama `gemma:3b` (configurable via `OLLAMA_LLM_MODEL`)

## Notes

- Keep Ollama running locally (`ollama serve`) for embedding and generation calls
- The first run of `init_db.py` may take several minutes depending on PDF size
- ChromaDB data is persisted in `./chroma_db/` directory
- The API runs on `http://localhost:8000` by default
