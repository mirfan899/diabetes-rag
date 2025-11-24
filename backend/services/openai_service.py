import os
from openai import OpenAI
from typing import Dict
import json


class OpenAIService:
    """Service for interacting with OpenAI API."""
    
    def __init__(self):
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY environment variable is not set")
        self.client = OpenAI(api_key=api_key)
        self.model = "gpt-4-turbo-preview"  # or "gpt-3.5-turbo" for faster/cheaper
    
    def generate_recommendations(
        self,
        patient_data: Dict,
        relevant_context: List[str]
    ) -> Dict:
        """Generate medicine recommendations using OpenAI with RAG context."""
        
        # Build context from retrieved documents
        context_text = "\n\n".join([
            f"Source: {ctx.get('metadata', {}).get('source', 'Unknown')}\n{ctx.get('text', '')}"
            for ctx in relevant_context
        ])
        
        # Build patient summary
        patient_summary = self._build_patient_summary(patient_data)
        
        # Create the prompt
        system_prompt = """You are a medical AI assistant specialized in diabetes care. Your role is to provide evidence-based medication recommendations based on clinical guidelines (ADA, AACE, NICE).

You must:
1. Base recommendations ONLY on the provided clinical guidelines context
2. Consider all patient factors (age, comorbidities, lab values, etc.)
3. Provide specific medication names, dosages, and reasons
4. Include lifestyle recommendations
5. List important clinical notes and warnings
6. Suggest necessary investigations/monitoring

Format your response as JSON with this structure:
{
  "medicines": [
    {
      "medicine_name": "Medication Name",
      "quantity_dose_strength": "Dosage information",
      "reason": ["Reason 1", "Reason 2"],
      "reference": "Guideline reference if available"
    }
  ],
  "lifestyle": ["Recommendation 1", "Recommendation 2"],
  "notes": ["Clinical note 1", "Clinical note 2"],
  "investigations": ["Test 1", "Test 2"]
}

IMPORTANT: Only recommend medications that are mentioned in the provided guidelines context. If the context doesn't contain relevant information, state that clearly."""
        
        user_prompt = f"""Based on the following clinical guidelines and patient information, provide medication recommendations:

CLINICAL GUIDELINES CONTEXT:
{context_text}

PATIENT INFORMATION:
{patient_summary}

Please provide evidence-based medication recommendations in the JSON format specified above."""
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.3,  # Lower temperature for more consistent, factual responses
                response_format={"type": "json_object"}
            )
            
            # Parse JSON response
            content = response.choices[0].message.content
            recommendations = json.loads(content)
            
            # Ensure all fields are lists
            if "medicines" not in recommendations:
                recommendations["medicines"] = []
            if "lifestyle" not in recommendations:
                recommendations["lifestyle"] = []
            if "notes" not in recommendations:
                recommendations["notes"] = []
            if "investigations" not in recommendations:
                recommendations["investigations"] = []
            
            # Ensure reason is always a list
            for medicine in recommendations.get("medicines", []):
                if "reason" in medicine and isinstance(medicine["reason"], str):
                    medicine["reason"] = [medicine["reason"]]
                elif "reason" not in medicine:
                    medicine["reason"] = []
            
            return recommendations
            
        except json.JSONDecodeError as e:
            print(f"Error parsing JSON response: {e}")
            print(f"Response content: {content}")
            return self._get_fallback_response()
        except Exception as e:
            print(f"Error generating recommendations: {e}")
            return self._get_fallback_response()
    
    def _build_patient_summary(self, patient_data: Dict) -> str:
        """Build a comprehensive patient summary from the form data."""
        summary_parts = []
        
        # Demographics
        if patient_data.get("age"):
            summary_parts.append(f"Age: {patient_data['age']} years")
        if patient_data.get("gender"):
            summary_parts.append(f"Gender: {patient_data['gender']}")
        if patient_data.get("bmi"):
            summary_parts.append(f"BMI: {patient_data['bmi']}")
        if patient_data.get("weightKg"):
            summary_parts.append(f"Weight: {patient_data['weightKg']} kg")
        if patient_data.get("heightCm"):
            summary_parts.append(f"Height: {patient_data['heightCm']} cm")
        
        # Diabetes information
        if patient_data.get("diabetes_type"):
            summary_parts.append(f"Diabetes Type: {patient_data['diabetes_type']}")
        if patient_data.get("duration"):
            summary_parts.append(f"Duration: {patient_data['duration']}")
        if patient_data.get("hba1cPercent"):
            summary_parts.append(f"HbA1c: {patient_data['hba1cPercent']}%")
        if patient_data.get("bloodGlucoseFastingMgDl"):
            summary_parts.append(f"Fasting Blood Glucose: {patient_data['bloodGlucoseFastingMgDl']} mg/dL")
        
        # Complications
        if patient_data.get("neuropathy"):
            summary_parts.append(f"Neuropathy: {patient_data['neuropathy']}")
        if patient_data.get("nephropathy"):
            summary_parts.append(f"Nephropathy: {patient_data['nephropathy']}")
        
        # Comorbidities
        if patient_data.get("heartFailure"):
            summary_parts.append(f"Heart Failure: {patient_data['heartFailure']}")
        if patient_data.get("kidneyFunction"):
            summary_parts.append(f"Kidney Function: {patient_data['kidneyFunction']}")
        if patient_data.get("liverFunction"):
            summary_parts.append(f"Liver Function: {patient_data['liverFunction']}")
        
        # Other factors
        if patient_data.get("currentSymptoms"):
            summary_parts.append(f"Current Symptoms: {patient_data['currentSymptoms']}")
        if patient_data.get("currentMedications"):
            summary_parts.append(f"Current Medications: {patient_data['currentMedications']}")
        if patient_data.get("familyHistory"):
            summary_parts.append(f"Family History: {patient_data['familyHistory']}")
        if patient_data.get("allergies"):
            summary_parts.append(f"Allergies: {patient_data['allergies']}")
        if patient_data.get("bloodPressure"):
            summary_parts.append(f"Blood Pressure: {patient_data['bloodPressure']}")
        if patient_data.get("pulse"):
            summary_parts.append(f"Pulse: {patient_data['pulse']} bpm")
        if patient_data.get("weightChanges"):
            summary_parts.append(f"Weight Changes: {patient_data['weightChanges']}")
        
        return "\n".join(summary_parts) if summary_parts else "No patient information provided"
    
    def _get_fallback_response(self) -> Dict:
        """Return a fallback response if API call fails."""
        return {
            "medicines": [],
            "lifestyle": ["Please consult with a healthcare provider for personalized recommendations"],
            "notes": ["Unable to generate recommendations at this time. Please try again or consult a healthcare provider."],
            "investigations": []
        }

