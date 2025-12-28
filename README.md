# Diabetes Agentic RAG System 🏥

A sophisticated, privacy-first AI system that provides evidence-based, personalized medicine recommendations for diabetes patients. This project currently features an **Agentic RAG (Retrieval-Augmented Generation)** architecture that reasons about patient data to perform targeted guideline searches.

## 🌟 Key Features

- **Agentic Reasoning**: Uses a ReAct (Reason+Act) loop to dynamically formulate search queries based on complex patient profiles (e.g., "Kidney disease + Type 2 Diabetes").
- **Privacy-First**: Runs entirely locally using **Ollama** (Gemma LLM), **ChromaDB** (Vector Store), and local Python services. No data leaves your machine.
- **Evidence-Based**: Recommendations are grounded in retrieved clinical guidelines (ADA, NICE, etc.) with citations.
- **Full Stack**: Complete solution with a Python/FastAPI backend and an Angular frontend.

## 📂 Project Structure

```bash
root/
├── app/                  # Angular Frontend Application
├── backend/              # Python FastAPI Backend & Agent Services
│   ├── services/         # Core Logic (Agent, RAG, Ollama, Chroma)
│   ├── models/           # Pydantic Schemas
│   └── tests/            # Unit & Integration Tests
├── pdfs/                 # Clinical Guidelines (PDFs) for ingestion
├── chroma_db/            # Persistent Vector Database
└── INTEGRATION.md        # Frontend-Backend Integration Guide
```

## 🚀 Quick Start

### 1. Backend Setup

The backend powers the intelligence of the system.

```bash
cd backend
./setup.sh        # Installs dependencies & sets up environment
python init_db.py # Ingests PDFs from ../pdfs/ into ChromaDB
python main.py    # Starts the API server at http://localhost:8000
```

### 2. Frontend Setup

(Assumes standard Angular CLI is installed)

```bash
# In a separate terminal
ng serve
# Access the UI at http://localhost:4200
```

## 📚 Documentation

Detailed documentation is available in the `backend/` directory:

- **[Backend Overview](backend/README.md)**: Setup, API endpoints, and configuration.
- **[Architecture Guide](backend/ARCHITECTURE.md)**: Deep dive into the Agentic RAG design, data flow patterns, and component interactions.
- **[Flow Diagrams](backend/FLOW_DIAGRAM.md)**: Visualizations of the system and agentic loops.
- **[Integration Guide](INTEGRATION.md)**: Details on connecting the Angular frontend with the Python backend.

## 🤖 Agent Capabilities

The system exposes an agentic endpoint:
- **POST** `/patients/agent-recommendations`

It follows this reasoning process:
1. **Analyze** patient demographics, vitals, and comorbidities.
2. **Decide** what clinical guidelines are relevant (e.g., "Search for safe meds for elderly with heart failure").
3. **Retrieve** knowledge from ChromaDB.
4. **Synthesize** a structured recommendation (Medicines, Lifestyle, Notes, Tests).
