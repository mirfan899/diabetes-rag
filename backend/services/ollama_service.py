import json
import os
from typing import Dict, List

import ollama


class OllamaService:
    """Service for interacting with a local Ollama model."""

    def __init__(self):
        host = os.getenv("OLLAMA_HOST")
        self.model = os.getenv("OLLAMA_LLM_MODEL", "gemma3:1b")
        self.temperature = float(os.getenv("OLLAMA_TEMPERATURE", "0.3"))

        if host:
            self.client = ollama.Client(host=host)
        else:
            self.client = ollama.Client()

    def generate_recommendations(
        self,
        patient_data: Dict,
        relevant_context: List[Dict],
    ) -> Dict:
        """Generate medicine recommendations using Ollama with RAG context."""

        context_text = "\n\n".join([
            f"Source: {ctx.get('metadata', {}).get('source', 'Unknown')}\n{ctx.get('text', '')}"
            for ctx in relevant_context
        ])

        patient_summary = self._build_patient_summary(patient_data)

        system_prompt = """You are a medical AI assistant specialized in diabetes care. Your role is to provide evidence-based medication recommendations based on clinical guidelines (ADA, AACE, NICE).

You must:
1. For MEDICATIONS: Base recommendations ONLY on the provided clinical guidelines context. If context is missing, you may use your medical knowledge but note it.
2. Consider all patient factors (age, comorbidities, lab values, etc.)
3. Provide specific medication names, dosages, and reasons
4. ALWAYS provide lifestyle recommendations using your medical knowledge (diet, exercise, weight management, etc.)
5. ALWAYS provide clinical notes and warnings using your medical knowledge (monitoring requirements, side effects, contraindications, drug interactions)
6. ALWAYS suggest necessary investigations/monitoring using your medical knowledge (lab tests like HbA1c, kidney function, lipid panel, eye exams, foot exams, follow-up appointments)

Format your response as JSON with this EXACT structure (all fields are required):
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

CRITICAL RULES:
- You MUST include ALL four fields: medicines, lifestyle, notes, and investigations
- The lifestyle, notes, and investigations arrays MUST contain at least 2-3 items each
- For lifestyle, notes, and investigations: Use your medical knowledge even if the context doesn't mention them
- For medications: Prefer context, but you can use your knowledge if context is insufficient
- NEVER return empty arrays for lifestyle, notes, or investigations"""

        # Build context message
        if context_text.strip():
            context_section = f"""CLINICAL GUIDELINES CONTEXT:
{context_text}

"""
        else:
            context_section = "CLINICAL GUIDELINES CONTEXT: No specific guidelines retrieved. Use your medical knowledge for all recommendations.\n\n"
        
        user_prompt = f"""Based on the following clinical guidelines and patient information, provide comprehensive medication recommendations:

{context_section}PATIENT INFORMATION:
{patient_summary}

REQUIREMENTS:
1. Provide medication recommendations (prefer guidelines context if available, otherwise use your knowledge)
2. ALWAYS provide lifestyle recommendations (diet, exercise, weight management) - use your medical knowledge
3. ALWAYS provide clinical notes (monitoring, side effects, warnings) - use your medical knowledge  
4. ALWAYS provide investigations (lab tests, screenings, follow-ups) - use your medical knowledge

Please provide evidence-based recommendations in the JSON format specified above. Ensure lifestyle, notes, and investigations arrays each have at least 2-3 items."""

        try:
            response = self.client.chat(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                options={"temperature": self.temperature},
            )
            content = response["message"]["content"]
            print("=" * 60)
            print("DEBUG: Raw response from Gemma model:")
            print(content)
            print("=" * 60)
            
            json_payload = self._extract_json_block(content)
            print("DEBUG: Extracted JSON payload:")
            print(json_payload)
            print("=" * 60)
            
            recommendations = json.loads(json_payload)

            # Debug: print raw JSON to see what LLM returned
            print(f"DEBUG: Parsed recommendations keys: {list(recommendations.keys())}")
            if "lifestyle" in recommendations:
                print(f"DEBUG: lifestyle value: {recommendations['lifestyle']}")
            if "notes" in recommendations:
                print(f"DEBUG: notes value: {recommendations['notes']}")
            if "investigations" in recommendations:
                print(f"DEBUG: investigations value: {recommendations['investigations']}")

            # Normalize all fields - ensure they exist and are lists
            if "medicines" not in recommendations:
                recommendations["medicines"] = []
            
            # Ensure lifestyle exists
            if "lifestyle" not in recommendations:
                recommendations["lifestyle"] = []
            
            # Ensure notes exists
            if "notes" not in recommendations:
                recommendations["notes"] = []
            
            # Ensure investigations exists
            if "investigations" not in recommendations:
                recommendations["investigations"] = []
            
            # Ensure lifestyle, notes and investigations are lists
            if not isinstance(recommendations.get("lifestyle"), list):
                if isinstance(recommendations.get("lifestyle"), str):
                    recommendations["lifestyle"] = [recommendations["lifestyle"]]
                else:
                    recommendations["lifestyle"] = []
            
            if not isinstance(recommendations.get("notes"), list):
                if isinstance(recommendations.get("notes"), str):
                    recommendations["notes"] = [recommendations["notes"]]
                else:
                    recommendations["notes"] = []
            
            if not isinstance(recommendations.get("investigations"), list):
                if isinstance(recommendations.get("investigations"), str):
                    recommendations["investigations"] = [recommendations["investigations"]]
                else:
                    recommendations["investigations"] = []

            # Validate and normalize medicine objects
            validated_medicines = []
            for medicine in recommendations.get("medicines", []):
                # Ensure all required fields are present
                if not isinstance(medicine, dict):
                    continue
                
                # Skip if missing critical fields
                if "medicine_name" not in medicine:
                    continue
                
                # Normalize reason field
                if "reason" in medicine and isinstance(medicine["reason"], str):
                    medicine["reason"] = [medicine["reason"]]
                elif "reason" not in medicine:
                    medicine["reason"] = []
                
                # Ensure required fields have defaults if missing
                medicine["quantity_dose_strength"] = medicine.get("quantity_dose_strength", "Dosage not specified")
                medicine["reference"] = medicine.get("reference", "Clinical guidelines")
                
                validated_medicines.append(medicine)
            
            recommendations["medicines"] = validated_medicines

            # Final validation: If lifestyle, notes, or investigations are empty, add defaults
            if not recommendations.get("lifestyle"):
                print("WARNING: lifestyle is empty, adding default recommendations")
                recommendations["lifestyle"] = [
                    "Follow a balanced diet with controlled carbohydrates",
                    "Engage in regular physical activity (at least 150 minutes per week)",
                    "Maintain a healthy weight through diet and exercise",
                    "Monitor blood glucose levels regularly"
                ]
            
            if not recommendations.get("notes"):
                print("WARNING: notes is empty, adding default notes")
                recommendations["notes"] = [
                    "Monitor blood glucose levels regularly",
                    "Watch for signs of hypoglycemia or hyperglycemia",
                    "Follow up with healthcare provider as recommended"
                ]
            
            if not recommendations.get("investigations"):
                print("WARNING: investigations is empty, adding default investigations")
                recommendations["investigations"] = [
                    "HbA1c test every 3-6 months",
                    "Annual comprehensive eye exam",
                    "Annual foot examination",
                    "Kidney function tests annually"
                ]

            return recommendations

        except json.JSONDecodeError as exc:
            print(f"Error parsing JSON response: {exc}")
            print(f"Response content: {content}")
            return self._get_fallback_response()
        except Exception as exc:
            print(f"Ollama error while generating recommendations: {exc}")
            return self._get_fallback_response()

    def _extract_json_block(self, content: str) -> str:
        """Extract the JSON payload from an Ollama response."""
        stripped = content.strip()
        if stripped.startswith("```"):
            segments = stripped.split("```")
            for segment in segments:
                candidate = segment.strip()
                # Remove optional language hint like ```json
                if candidate.lower().startswith("json"):
                    candidate = candidate[4:].lstrip()
                if candidate.startswith("{") and candidate.endswith("}"):
                    return candidate
        return stripped

    def _build_patient_summary(self, patient_data: Dict) -> str:
        """Build a comprehensive patient summary from the form data."""
        summary_parts = []

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

        if patient_data.get("diabetes_type"):
            summary_parts.append(f"Diabetes Type: {patient_data['diabetes_type']}")
        if patient_data.get("duration"):
            summary_parts.append(f"Duration: {patient_data['duration']}")
        if patient_data.get("hba1cPercent"):
            summary_parts.append(f"HbA1c: {patient_data['hba1cPercent']}%")
        if patient_data.get("bloodGlucoseFastingMgDl"):
            summary_parts.append(f"Fasting Blood Glucose: {patient_data['bloodGlucoseFastingMgDl']} mg/dL")

        if patient_data.get("neuropathy"):
            summary_parts.append(f"Neuropathy: {patient_data['neuropathy']}")
        if patient_data.get("nephropathy"):
            summary_parts.append(f"Nephropathy: {patient_data['nephropathy']}")

        if patient_data.get("heartFailure"):
            summary_parts.append(f"Heart Failure: {patient_data['heartFailure']}")
        if patient_data.get("kidneyFunction"):
            summary_parts.append(f"Kidney Function: {patient_data['kidneyFunction']}")
        if patient_data.get("liverFunction"):
            summary_parts.append(f"Liver Function: {patient_data['liverFunction']}")

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
        """Return a fallback response if generation fails."""
        return {
            "medicines": [],
            "lifestyle": ["Please consult with a healthcare provider for personalized recommendations"],
            "notes": ["Unable to generate recommendations at this time. Please try again or consult a healthcare provider."],
            "investigations": [],
        }


