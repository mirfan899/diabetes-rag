import sys
import os
from dotenv import load_dotenv

# Add backend to path so imports work
current_dir = os.getcwd()
backend_dir = os.path.join(current_dir, 'backend')
# Load env vars from backend/.env
load_dotenv(os.path.join(backend_dir, '.env'))

sys.path.append(backend_dir)

from backend.services.agent_service import AgentService

def test_agent():
    print("Initializing Agent Service...")
    try:
        service = AgentService()
    except Exception as e:
        print(f"Failed to initialize service: {e}")
        return

    patient_data = {
        "guidelines": "ADA",
        "diabetes_type": "Type 2",
        "age": 55,
        "hba1cPercent": 8.5,
        "neuropathy": "Mild peripheral neuropathy",
        "currentMedications": "Metformin 1000mg"
    }

    print("\nRunning Agent with Patient Data:")
    print(patient_data)
    print("-" * 50)

    try:
        result = service.run_agent(patient_data)
        print("\nAgent Result:")
        print(result)
        
        # specific check
        if result.get("medicines"):
            print("\nSUCCESS: Medicines found.")
        else:
            print("\nWARNING: No medicines found.")
            
    except Exception as e:
        print(f"\nError running agent: {e}")

if __name__ == "__main__":
    test_agent()
