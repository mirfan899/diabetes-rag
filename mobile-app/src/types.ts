
export type RootStackParamList = {
    Login: undefined;
    DoctorProfile: undefined;
    Home: undefined;
    Result: { result: RecommendationResponse };
};

export interface RecommendationRequest {
    guidelines: string;
    diabetes_type: string;
    currentMedications?: string;
    familyHistory?: string;
    allergies?: string;
    hba1cPercent?: number;
    bloodGlucoseFastingMgDl?: number;
    weightKg?: number;
    heightCm?: number;
    bmi?: number;
    bloodPressure?: string;
    footExamNotes?: string;
    eyeExamNotes?: string;
    duration?: string;
    age?: number;
    gender?: string;
    currentSymptoms?: string;
    neuropathy?: string;
    nephropathy?: string;
    kidneyFunction?: string;
    liverFunction?: string;
    heartFailure?: string;
    weightChanges?: string;
    pulse?: number;
}

export interface MedicineRecommendation {
    medicine_name: string;
    quantity_dose_strength: string;
    reason: string[];
    reference: string;
}

export interface RecommendationResponse {
    medicines: MedicineRecommendation[];
    lifestyle: string[];
    notes: string[];
    investigations: string[];
}
