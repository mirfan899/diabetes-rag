from pydantic import BaseModel
from typing import Optional, List


class RecommendationRequest(BaseModel):
    guidelines: str = "ADA"
    diabetes_type: str
    currentMedications: Optional[str] = None
    familyHistory: Optional[str] = None
    allergies: Optional[str] = None
    hba1cPercent: Optional[float] = None
    bloodGlucoseFastingMgDl: Optional[float] = None
    weightKg: Optional[float] = None
    heightCm: Optional[float] = None
    bmi: Optional[float] = None
    bloodPressure: Optional[str] = None
    footExamNotes: Optional[str] = None
    eyeExamNotes: Optional[str] = None
    duration: Optional[str] = None
    age: Optional[float] = None
    gender: Optional[str] = None
    currentSymptoms: Optional[str] = None
    neuropathy: Optional[str] = None
    nephropathy: Optional[str] = None
    kidneyFunction: Optional[str] = None
    liverFunction: Optional[str] = None
    heartFailure: Optional[str] = None
    weightChanges: Optional[str] = None
    pulse: Optional[float] = None


class MedicineRecommendation(BaseModel):
    medicine_name: str
    quantity_dose_strength: str
    reason: List[str]
    reference: str


class RecommendationResponse(BaseModel):
    medicines: List[MedicineRecommendation]
    lifestyle: List[str]
    notes: List[str]
    investigations: List[str]

