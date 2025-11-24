import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, map, tap, throwError, of } from 'rxjs';
import { Patient, PatientWithLastVisit } from '../models';

export interface CreatePatientDto {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth?: string | Date;
  gender?: 'male' | 'female' | 'other';
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  bloodType?: string;
  allergies?: string | string[];
  medicalHistory?: string | string[];
  currentMedications?: string | string[];
  isActive?: boolean;
}

export interface MedicineRecommendation {
  suggestedMedications: string;
  frequencyRecommendations: string;
  warnings: string;
  interactions: string;
}

export interface PrescriptionFormData {
  age: string;
  gender: string;
  diabetesType: string;
  hba1c: string;
  bloodGlucose: string;
  currentSymptoms: string;
  familyHistory: string;
  neuropathy: string;
  nephropathy: string;
  durationMonths: string;
  pulse: string;
  bloodPressureSystolic: string;
  bloodPressureDiastolic: string;
  heightCm: string;
  weightKg: string;
  bmi: string;
  eyeExamNotes: string;
  footExamNotes: string;
  guideline: string;
  kidneyFunction: string;
  liverFunction: string;
  medicationHistory: string;
  heartFailure: string;
  weightChanges: string;
}

import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PatientService {
  private apiUrl = `${environment.apiUrl}/patients`;
  private patientsSubject = new BehaviorSubject<Patient[]>([]);
  public patients$ = this.patientsSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadPatients();
  }

  private loadPatients(): void {
    this.getPatients().subscribe(patients => {
      this.patientsSubject.next(patients);
    });
  }

  getPatients(): Observable<Patient[]> {
    return this.http.get<Patient[]>(this.apiUrl).pipe(
      catchError(error => {
        console.error('Error loading patients:', error);
        return throwError(() => error);
      })
    );
  }

  getPatientById(id: string): Observable<Patient> {
    return this.http.get<Patient>(`${this.apiUrl}/${id}`).pipe(
      catchError(error => {
        console.error(`Error loading patient ${id}:`, error);
        return throwError(() => error);
      })
    );
  }

  createPatient(patient: CreatePatientDto): Observable<Patient> {
    return this.http.post<Patient>(this.apiUrl, patient).pipe(
      tap(newPatient => {
        const currentPatients = this.patientsSubject.value;
        this.patientsSubject.next([...currentPatients, newPatient]);
      }),
      catchError(error => {
        console.error('Error creating patient:', error);
        return throwError(() => error);
      })
    );
  }

  getPatientsWithLastVisit(): Observable<PatientWithLastVisit[]> {
    return this.http.get<PatientWithLastVisit[]>(`${this.apiUrl}/with-last-visit`).pipe(
      map((patients: any[]) => {
        return patients.map(patient => ({
          ...patient,
          lastVisit: patient.lastVisit ? new Date(patient.lastVisit) : undefined,
          dateOfBirth: new Date(patient.dateOfBirth)
        }));
      }),
      catchError(error => {
        console.error('Error loading patients with last visit:', error);
        return throwError(() => error);
      })
    );
  }

  updatePatient(id: string, patient: Partial<Patient>): Observable<Patient> {
    return this.http.patch<Patient>(`${this.apiUrl}/${id}`, patient).pipe(
      tap(updatedPatient => {
        const currentPatients = this.patientsSubject.value;
        const index = currentPatients.findIndex(p => p.id === id);
        if (index !== -1) {
          currentPatients[index] = updatedPatient;
          this.patientsSubject.next([...currentPatients]);
        }
      }),
      catchError(error => {
        console.error(`Error updating patient ${id}:`, error);
        return throwError(() => error);
      })
    );
  }

  deletePatient(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        const currentPatients = this.patientsSubject.value;
        this.patientsSubject.next(currentPatients.filter(p => p.id !== id));
      }),
      catchError(error => {
        console.error(`Error deleting patient ${id}:`, error);
        return throwError(() => error);
      })
    );
  }

  searchPatients(query: string): Observable<Patient[]> {
    return this.http.get<Patient[]>(`${this.apiUrl}/search?q=${query}`).pipe(
      catchError(error => {
        console.error('Error searching patients:', error);
        return throwError(() => error);
      })
    );
  }

  // ADA 8-15 specific medicine recommendation method
  getADA815Recommendations(patientId: string, formData: PrescriptionFormData): Observable<MedicineRecommendation> {
    // Call the backend API specifically for ADA 8-15 recommendations
    const requestData = {
      guidelines: 'ADA', // Force ADA guidelines to trigger ADA 8-15 function
      diabetes_type: formData.diabetesType,
      currentMedications: formData.medicationHistory,
      familyHistory: formData.familyHistory,
      allergies: '', // Could be populated from patient data
      hba1cPercent: parseFloat(formData.hba1c),
      bloodGlucoseFastingMgDl: parseFloat(formData.bloodGlucose) || null,
      weightKg: parseFloat(formData.weightKg) || null,
      heightCm: parseFloat(formData.heightCm) || null,
      bmi: parseFloat(formData.bmi) || null,
      bloodPressure: formData.bloodPressureSystolic && formData.bloodPressureDiastolic 
        ? `${formData.bloodPressureSystolic}/${formData.bloodPressureDiastolic}` 
        : null,
      footExamNotes: formData.footExamNotes,
      eyeExamNotes: formData.eyeExamNotes,
      duration: formData.durationMonths ? `${formData.durationMonths} months` : null,
      age: parseFloat(formData.age) || null,
      gender: formData.gender,
      currentSymptoms: formData.currentSymptoms,
      neuropathy: formData.neuropathy,
      nephropathy: formData.nephropathy,
      kidneyFunction: formData.kidneyFunction,
      liverFunction: formData.liverFunction,
      heartFailure: formData.heartFailure,
      weightChanges: formData.weightChanges,
      pulse: parseFloat(formData.pulse) || null
    };
    console.log('ADA 8-15 Request data:', requestData);
    return this.http.post<any>(`${environment.apiUrl}/patients/recommendations`, requestData).pipe(
      map(response => {
        console.log('ADA 8-15 Backend response:', response);
        
        // Handle error response
        if (response.error) {
          return {
            suggestedMedications: 'Error: ' + response.error,
            dosageRecommendations: '',
            frequencyRecommendations: '',
            warnings: '',
            interactions: ''
          };
        }

        // Handle ADA 8-15 specific response format
        if (response.medicines && Array.isArray(response.medicines)) {
          const medicines = response.medicines.map((med: any) => {
            const medicineName = `**Medicine:** ${med.medicine_name}`;
            const quantity = med.quantity_dose_strength ? `\n  **Quantity:** ${med.quantity_dose_strength}` : '';
            
            // Handle reasons with bullet points (single or multiple)
            let reasonText = '';
            if (med.reason && Array.isArray(med.reason)) {
              reasonText = med.reason.map((r: string) => `• ${r}`).join('\n    ');
            } else {
              reasonText = '• No reason provided';
            }
            
            const reference = med.reference ? `\n  **Reference:** ${med.reference}` : '';
            
            return `${medicineName}${quantity}\n  **Reason:**\n    ${reasonText}${reference}`;
          }).join('\n\n');

          const lifestyleInfo = response.lifestyle?.join('\n') || 'No specific lifestyle recommendations';

          return {
            suggestedMedications: medicines,
            dosageRecommendations: '', // Remove dosage information
            frequencyRecommendations: lifestyleInfo,
            warnings: response.notes?.join('\n') || 'No specific warnings',
            interactions: response.investigations?.join('\n') || 'No specific interactions noted'
          };
        }

        // Fallback to generic response handling
        return {
          suggestedMedications: response.suggestedMedications || 'No medications suggested',
          dosageRecommendations: response.dosageRecommendations || '',
          frequencyRecommendations: response.frequencyRecommendations || '',
          warnings: response.warnings || '',
          interactions: response.interactions || ''
        };
      }),
      catchError(error => {
        console.error('Error getting ADA 8-15 recommendations:', error);
        return throwError(() => error);
      })
    );
  }

  // Medicine recommendation method
  getMedicineRecommendations(patientId: string, formData: PrescriptionFormData): Observable<MedicineRecommendation> {
    // Call the backend API for real LLM recommendations
    const requestData = {
      guidelines: formData.guideline || 'ADA', // Use selected guideline or default to ADA
      diabetes_type: formData.diabetesType,
      currentMedications: formData.medicationHistory,
      familyHistory: formData.familyHistory,
      allergies: '', // Could be populated from patient data
      hba1cPercent: parseFloat(formData.hba1c),
      bloodGlucoseFastingMgDl: parseFloat(formData.bloodGlucose) || null,
      weightKg: parseFloat(formData.weightKg) || null,
      heightCm: parseFloat(formData.heightCm) || null,
      bmi: parseFloat(formData.bmi) || null,
      bloodPressure: formData.bloodPressureSystolic && formData.bloodPressureDiastolic 
        ? `${formData.bloodPressureSystolic}/${formData.bloodPressureDiastolic}` 
        : null,
      footExamNotes: formData.footExamNotes,
      eyeExamNotes: formData.eyeExamNotes,
      duration: formData.durationMonths ? `${formData.durationMonths} months` : null,
      age: parseFloat(formData.age) || null,
      gender: formData.gender,
      currentSymptoms: formData.currentSymptoms,
      neuropathy: formData.neuropathy,
      nephropathy: formData.nephropathy,
      kidneyFunction: formData.kidneyFunction,
      liverFunction: formData.liverFunction,
      heartFailure: formData.heartFailure,
      weightChanges: formData.weightChanges,
      pulse: parseFloat(formData.pulse) || null
    };
    console.log('Request data:', requestData);
    return this.http.post<any>(`${environment.apiUrl}/patients/recommendations`, requestData).pipe(
      map(response => {
        console.log('Backend response:', response);
        
        // Handle error response
        if (response.error) {
          return {
            suggestedMedications: 'Error: ' + response.error,
            dosageRecommendations: 'Unable to generate recommendations',
            frequencyRecommendations: 'Please check the form data',
            warnings: 'Error occurred during processing',
            interactions: 'No interaction data available'
          };
        }

        // Transform backend response to frontend format
        let medications = '';
        let lifestyle = '';
        let notes = '';
        let investigations = '';

        // Process medicines array - single section with all 4 fields
        if (response.medicines && Array.isArray(response.medicines)) {
          medications = response.medicines.map((med: any, index: number) => {
            // Handle reason as array or string
            let reasonText = '';
            if (Array.isArray(med.reason)) {
              reasonText = med.reason.map((r: string) => `• ${r}`).join('\n  ');
            } else {
              reasonText = med.reason || '';
            }
            
            return `• **${med.medicine_name}**\n  **Dosage:** ${med.quantity_dose_strength}\n  **Reason:** ${reasonText}\n  **Reference:** ${med.reference}`;
          }).join('\n\n');
        }

        // Process lifestyle as array
        if (response.lifestyle && Array.isArray(response.lifestyle)) {
          lifestyle = response.lifestyle.map((item: string) => `• ${item}`).join('\n');
        } else if (response.lifestyle) {
          lifestyle = response.lifestyle;
        }

        // Process notes as array
        if (response.notes && Array.isArray(response.notes)) {
          notes = response.notes.map((item: string) => `• ${item}`).join('\n');
        } else if (response.notes) {
          notes = response.notes;
        }

        // Process investigations as array
        if (response.investigations && Array.isArray(response.investigations)) {
          investigations = response.investigations.map((item: string) => `• ${item}`).join('\n');
        } else if (response.investigations) {
          investigations = response.investigations;
        }

        return {
          suggestedMedications: medications || 'No specific medications recommended',
          dosageRecommendations: '', // Remove dosage information section
          frequencyRecommendations: lifestyle || 'No lifestyle recommendations',
          warnings: notes || 'No clinical notes',
          interactions: investigations || 'No investigations recommended'
        };
      }),
      catchError(error => {
        console.error('Error getting medicine recommendations:', error);
        // Fallback to mock recommendations if API fails
        return of(this.generateRecommendations(formData));
      })
    );
  }

  private generateRecommendations(formData: PrescriptionFormData): MedicineRecommendation {
    const hba1c = parseFloat(formData.hba1c);
    const age = parseFloat(formData.age);
    const diabetesType = formData.diabetesType;
    const neuropathy = formData.neuropathy;
    const nephropathy = formData.nephropathy;
    const bloodGlucose = parseFloat(formData.bloodGlucose);
    const kidneyFunction = formData.kidneyFunction;
    const liverFunction = formData.liverFunction;
    const heartFailure = formData.heartFailure;

    let medications = 'Based on the patient data, consider:';
    let dosage = 'Standard dosages recommended:';
    let frequency = 'Typical frequency:';
    let warnings = 'Important warnings:';
    let interactions = 'Potential interactions:';

    // Diabetes-specific recommendations
    if (diabetesType === 'Type 2') {
      if (hba1c > 7.5) {
        medications += ' Metformin, Sulfonylureas (Glimepiride/Gliclazide), or DPP-4 inhibitors (Sitagliptin)';
        dosage += ' Metformin: 500-2000mg daily, Sulfonylureas: 1-4mg daily, DPP-4: 100mg daily';
        frequency += ' Metformin: 2-3 times daily with meals, Sulfonylureas: Once daily, DPP-4: Once daily';
        warnings += ' Monitor for hypoglycemia with sulfonylureas. Start with low dose metformin.';
      } else if (hba1c > 6.5) {
        medications += ' Metformin, lifestyle modifications';
        dosage += ' Metformin: 500-1000mg daily';
        frequency += ' Metformin: 1-2 times daily with meals';
        warnings += ' Focus on diet and exercise. Monitor blood glucose regularly.';
      } else {
        medications += ' Lifestyle modifications, Metformin if needed';
        dosage += ' Metformin: 500mg daily if required';
        frequency += ' Metformin: Once daily with dinner if prescribed';
        warnings += ' Excellent glycemic control. Continue lifestyle modifications.';
      }
    } else if (diabetesType === 'Type 1') {
      medications += ' Insulin therapy (basal and bolus)';
      dosage += ' Individualized insulin dosing based on blood glucose';
      frequency += ' Multiple daily injections or pump therapy';
      warnings += ' Monitor blood glucose frequently. Adjust insulin based on meals and activity.';
      interactions += ' Insulin interacts with many medications. Review all current medications.';
    }

    // Blood glucose considerations
    if (bloodGlucose > 200) {
      warnings += ' High blood glucose detected. Consider immediate intervention.';
      medications += ', Short-acting insulin if needed';
    } else if (bloodGlucose < 70) {
      warnings += ' Low blood glucose detected. Monitor for hypoglycemia.';
    }

    // Complications-based recommendations
    if (neuropathy === 'Moderate' || neuropathy === 'Severe') {
      medications += ', Alpha-lipoic acid (600mg), B-complex vitamins, Gabapentin if needed';
      dosage += ' Alpha-lipoic acid: 600mg daily, Gabapentin: 300-900mg daily';
      frequency += ' Alpha-lipoic acid: Once daily, Gabapentin: 2-3 times daily';
      warnings += ' Monitor for foot ulcers and infections. Regular foot examinations required.';
      interactions += ' Gabapentin may interact with other CNS depressants.';
    }

    if (nephropathy === 'Moderate' || nephropathy === 'Severe') {
      medications += ', ACE inhibitors (Lisinopril) or ARBs (Losartan)';
      dosage += ' ACE inhibitors: 5-40mg daily, ARBs: 25-100mg daily';
      frequency += ' Once daily, preferably in the morning';
      warnings += ' Monitor kidney function regularly. Avoid NSAIDs.';
      interactions += ' ACE inhibitors/ARBs may interact with diuretics and other antihypertensives.';
    }

    // Age-based considerations
    if (age > 65) {
      warnings += ' Start with lower dosages in elderly patients. Monitor for side effects.';
      interactions += ' Review all medications for potential interactions. Consider renal function.';
    } else if (age < 18) {
      warnings += ' Pediatric dosing may be required. Consult pediatric guidelines.';
      interactions += ' Limited data on drug interactions in pediatric population.';
    }

    // Blood pressure considerations
    const systolic = parseFloat(formData.bloodPressureSystolic);
    const diastolic = parseFloat(formData.bloodPressureDiastolic);
    if (systolic > 140 || diastolic > 90) {
      medications += ', Antihypertensive therapy if needed';
      warnings += ' Elevated blood pressure detected. Monitor regularly.';
    }

    // BMI considerations
    const bmi = parseFloat(formData.bmi);
    if (bmi > 30) {
      medications += ', Consider GLP-1 receptor agonists (Liraglutide) for weight loss';
      dosage += ' GLP-1: 0.6-3.0mg daily';
      frequency += ' GLP-1: Once daily injection';
      warnings += ' Obesity management important for diabetes control.';
    }

    // Kidney function considerations
    if (kidneyFunction === 'abnormal') {
      medications += ', Adjust dosages for renal impairment';
      warnings += ' Monitor kidney function closely. Avoid nephrotoxic medications.';
      interactions += ' Many medications require dose adjustment in renal impairment.';
    }

    // Liver function considerations
    if (liverFunction === 'abnormal') {
      medications += ', Consider hepatic metabolism of medications';
      warnings += ' Monitor liver function. Avoid hepatotoxic medications.';
      interactions += ' Some medications may be contraindicated in liver disease.';
    }

    // Heart failure considerations
    if (heartFailure === 'yes') {
      medications += ', Consider heart failure medications (ACE inhibitors, beta-blockers)';
      warnings += ' Monitor for heart failure symptoms. Avoid medications that worsen heart failure.';
      interactions += ' Some diabetes medications may affect heart failure.';
    }

    return {
      suggestedMedications: medications,
      frequencyRecommendations: frequency,
      warnings: warnings,
      interactions: interactions
    };
  }
}
