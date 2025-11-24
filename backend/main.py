from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from models.schemas import RecommendationRequest, RecommendationResponse, MedicineRecommendation
from services.rag_service import RAGService
import os
from dotenv import load_dotenv
import uvicorn

# Load environment variables
load_dotenv()

app = FastAPI(title="Diabetes RAG API", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your Angular app's URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize RAG service
rag_service = None

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup."""
    global rag_service
    try:
        rag_service = RAGService()
        print("RAG service initialized successfully")
    except Exception as e:
        print(f"Error initializing RAG service: {e}")
        raise


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "Diabetes RAG API",
        "version": "1.0.0"
    }


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy"}


@app.post("/patients/recommendations", response_model=RecommendationResponse)
async def get_recommendations(request: RecommendationRequest):
    """Get medicine recommendations based on patient data using RAG."""
    if not rag_service:
        raise HTTPException(status_code=500, detail="RAG service not initialized")
    
    try:
        # Convert request to dict
        patient_data = request.dict()
        
        # Get recommendations using RAG
        recommendations = rag_service.get_recommendations(patient_data)
        
        # Convert to response model
        medicines = [
            MedicineRecommendation(**med) for med in recommendations.get("medicines", [])
        ]
        
        response = RecommendationResponse(
            medicines=medicines,
            lifestyle=recommendations.get("lifestyle", []),
            notes=recommendations.get("notes", []),
            investigations=recommendations.get("investigations", [])
        )
        
        return response
        
    except Exception as e:
        print(f"Error generating recommendations: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error generating recommendations: {str(e)}"
        )


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)

