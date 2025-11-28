# Integration Guide: Python RAG Backend with Angular Frontend

This guide explains how to integrate the Python RAG backend with your Angular application.

## Backend Setup

1. **Navigate to backend directory**:

```bash
cd backend
```

2. **Run setup script**:

```bash
./setup.sh
```

3. **Configure environment (optional)**:

Create a `.env` file (or export vars) if you need to override defaults such as:

```bash
OLLAMA_HOST=http://localhost:11434
OLLAMA_EMBEDDING_MODEL=embeddinggemma
OLLAMA_LLM_MODEL=gemma3:1b
```

4. **Initialize ChromaDB**:

```bash
python init_db.py
```

5. **Start the backend server**:

```bash
python main.py
```

The backend will run on `http://localhost:8000`

## Angular Frontend Configuration

The Angular app expects the API to be available at `environment.apiUrl`. You need to ensure your Angular environment file points to the backend.

### Create/Update Environment File

If you don't have an environment file, create one at:

- `src/environments/environment.ts` (for development)
- `src/environments/environment.prod.ts` (for production)

**Example `src/environments/environment.ts`**:

```typescript
export const environment = {
  production: false,
  apiUrl: "http://localhost:8000", // Point to your Python backend
};
```

**Example `src/environments/environment.prod.ts`**:

```typescript
export const environment = {
  production: true,
  apiUrl: "http://your-production-server:8000", // Your production backend URL
};
```

## API Endpoint

The Angular app calls:

- **POST** `/patients/recommendations`

This endpoint is already implemented in the Python backend and matches the expected request/response format from the Angular `PatientService`.

## Testing the Integration

1. **Start the backend**:

```bash
cd backend
python main.py
```

2. **Start the Angular app** (in a separate terminal):

```bash
ng serve
```

3. **Test the recommendation form**:
   - Navigate to the prescription form in your Angular app
   - Fill in patient data
   - Submit the form
   - The app should call the backend and display recommendations

## Troubleshooting

### CORS Issues

If you encounter CORS errors, the backend is already configured to allow all origins. If you need to restrict it, edit `backend/main.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],  # Your Angular dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### API Connection Issues

- Verify the backend is running: `curl http://localhost:8000/health`
- Check the Angular environment file has the correct `apiUrl`
- Check browser console for errors
- Verify CORS is properly configured

### ChromaDB Not Initialized

If you get errors about missing data:

```bash
cd backend
python init_db.py
```

## Request/Response Format

### Request (from Angular)

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
  "currentSymptoms": "Increased thirst",
  "neuropathy": "Mild",
  "kidneyFunction": "normal",
  ...
}
```

### Response (to Angular)

```json
{
  "medicines": [
    {
      "medicine_name": "Metformin",
      "quantity_dose_strength": "500-2000mg daily",
      "reason": ["First-line treatment", "High HbA1c"],
      "reference": "ADA Guidelines 2025"
    }
  ],
  "lifestyle": ["Diet modification", "Exercise"],
  "notes": ["Monitor kidney function"],
  "investigations": ["HbA1c in 3 months"]
}
```

This format matches what the Angular `PatientService` expects.
