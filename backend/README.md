# Diabetes RAG Backend

A Python FastAPI backend that uses RAG (Retrieval Augmented Generation) to provide evidence-based medicine recommendations for diabetes patients.

## Features

- **RAG System**: Uses ChromaDB for vector storage and SentenceTransformers for embeddings
- **PDF Processing**: Extracts and processes clinical guidelines from PDF files
- **OpenAI Integration**: Generates personalized medication recommendations
- **FastAPI**: RESTful API that integrates with the Angular frontend

## Prerequisites

- **pyenv**: Python version manager (required)
- **Python 3.10.10**: Will be installed automatically via pyenv

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

4. **Set up environment variables**:

```bash
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY for text generation
```

5. **Initialize ChromaDB with PDFs**:

```bash
python init_db.py
```

This will:

- Process all PDF files in the `../pdfs/` directory
- Extract text and chunk it
- Generate embeddings locally using SentenceTransformers
- Store in ChromaDB

6. **Run the server**:

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
    ├── openai_service.py  # OpenAI API integration
    └── rag_service.py     # RAG orchestration
```

## Configuration

- **Chunk Size**: Default 1000 characters (configurable in `pdf_processor.py`)
- **Chunk Overlap**: Default 200 characters
- **Embedding Model**: `cross-encoder/ms-marco-MiniLM-L6-v2` (configurable via `EMBEDDING_MODEL_NAME`)
- **LLM Model**: OpenAI `gpt-4-turbo-preview` (configurable in `openai_service.py`)

## Notes

- Make sure you have sufficient OpenAI API credits for text generation
- The first run of `init_db.py` may take several minutes depending on PDF size
- ChromaDB data is persisted in `./chroma_db/` directory
- The API runs on `http://localhost:8000` by default
