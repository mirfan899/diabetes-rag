import sys
import os
from dotenv import load_dotenv

# Setup path to import 'services' from 'backend/'
# We assume this file is in backend/tests/
test_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(test_dir)

# Add backend_dir to sys.path so 'services' package is found
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Load environment variables
load_dotenv(os.path.join(backend_dir, '.env'))

try:
    from services.agent_service import AgentService
except ImportError as e:
    print(f"Import Error: {e}")
    print(f"Sys Path: {sys.path}")
    sys.exit(1)

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
