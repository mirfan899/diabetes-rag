import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { PatientService, MedicineRecommendation } from '../../services/patient.service';
import { Patient } from '../../models';

@Component({
  selector: 'app-prescription-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './prescription-form.component.html',
  styleUrls: ['./prescription-form.component.scss']
})
export class PrescriptionFormComponent implements OnInit {
  patientId: string | null = null;
  patient: Patient | null = null;
  isLoading = false;
  isGeneratingRecommendations = false;
  recommendationsGenerated = false;
  formSubmitted = false; // Track if form has been submitted
  
  prescriptionForm = {
    // Patient History
    age: '',
    gender: '',
    diabetesType: 'Type 2', // Default to Type 2
    hba1c: '',
    bloodGlucose: '',
    currentSymptoms: '',
    familyHistory: '',
    neuropathy: '',
    nephropathy: '',
    durationMonths: '',
    guideline: 'ADA', // Default to ADA
    kidneyFunction: '',
    liverFunction: '',
    medicationHistory: '',
    heartFailure: '',
    weightChanges: '',

    // Physical Exam
    pulse: '',
    bloodPressureSystolic: '',
    bloodPressureDiastolic: '',
    heightCm: '',
    weightKg: '',
    bmi: '',
    eyeExamNotes: '',
    footExamNotes: ''
  };

  llmRecommendations = {
    suggestedMedications: '',
    frequencyRecommendations: '',
    warnings: '',
    interactions: ''
  };

  // Validation errors
  formErrors: { [key: string]: string } = {};

  // Options
  genderOptions = ['male', 'female', 'other'];
  weightChangesOptions = ['', 'weight loss', 'weight gain'];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private patientService: PatientService
  ) {}

  ngOnInit(): void {
    this.patientId = this.route.snapshot.queryParamMap.get('patientId');
    if (this.patientId) {
      this.loadPatient();
    }
  }

  loadPatient(): void {
    if (!this.patientId) return;
    
    this.patientService.getPatientById(this.patientId).subscribe({
      next: (patient) => {
        this.patient = patient;
        this.populatePatientData();
      },
      error: (error) => {
        console.error('Error loading patient:', error);
      }
    });
  }

  populatePatientData(): void {
    if (!this.patient) return;

    this.prescriptionForm.age = this.calculateAge(this.patient.user.dateOfBirth).toString();
    this.prescriptionForm.gender = this.patient.user.gender;
    
    // Pre-populate with existing patient data if available
  }

  calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  calculateBMI(): void {
    const height = parseFloat(this.prescriptionForm.heightCm);
    const weight = parseFloat(this.prescriptionForm.weightKg);
    
    if (height > 0 && weight > 0) {
      const heightInMeters = height / 100;
      const bmi = weight / (heightInMeters * heightInMeters);
      this.prescriptionForm.bmi = bmi.toFixed(1);
    }
  }

  validateForm(): boolean {
    this.formErrors = {};

    // Only validate if the form has been submitted
    if (!this.formSubmitted) {
      return true; // Don't show errors if form hasn't been submitted
    }

    // Required fields validation
    if (!this.prescriptionForm.age) this.formErrors['age'] = 'Age is required';
    if (!this.prescriptionForm.hba1c) this.formErrors['hba1c'] = 'HbA1c is required';

    // Numeric validation
    const age = parseFloat(this.prescriptionForm.age);
    if (age < 0 || age > 120) this.formErrors['age'] = 'Age must be between 0 and 120';

    const hba1c = parseFloat(this.prescriptionForm.hba1c);
    if (hba1c < 4 || hba1c > 14) this.formErrors['hba1c'] = 'HbA1c must be between 4 and 14';

    const bloodGlucose = parseFloat(this.prescriptionForm.bloodGlucose);
    if (bloodGlucose && (bloodGlucose < 50 || bloodGlucose > 500)) {
      this.formErrors['bloodGlucose'] = 'Blood glucose must be between 50 and 500';
    }

    const pulse = parseFloat(this.prescriptionForm.pulse);
    if (pulse && (pulse < 40 || pulse > 200)) {
      this.formErrors['pulse'] = 'Pulse must be between 40 and 200';
    }

    const systolic = parseFloat(this.prescriptionForm.bloodPressureSystolic);
    if (systolic && (systolic < 90 || systolic > 180)) {
      this.formErrors['bloodPressureSystolic'] = 'Systolic BP must be between 90 and 180';
    }

    const diastolic = parseFloat(this.prescriptionForm.bloodPressureDiastolic);
    if (diastolic && (diastolic < 60 || diastolic > 120)) {
      this.formErrors['bloodPressureDiastolic'] = 'Diastolic BP must be between 60 and 120';
    }

    const height = parseFloat(this.prescriptionForm.heightCm);
    if (height && (height < 30 || height > 300)) {
      this.formErrors['heightCm'] = 'Height must be between 30 and 300 cm';
    }

    const weight = parseFloat(this.prescriptionForm.weightKg);
    if (weight && (weight < 2 || weight > 500)) {
      this.formErrors['weightKg'] = 'Weight must be between 2 and 500 kg';
    }

    const durationMonths = parseFloat(this.prescriptionForm.durationMonths);
    if (durationMonths && durationMonths < 0) {
      this.formErrors['durationMonths'] = 'Duration must be positive';
    }

    return Object.keys(this.formErrors).length === 0;
  }

  onSubmit(): void {
    // Mark form as submitted so validation errors will show
    this.formSubmitted = true;
    
    if (!this.validateForm()) return;

    this.isLoading = true;
    this.isGeneratingRecommendations = true;
    this.recommendationsGenerated = false;
    
    // Mock prescription creation - in a real app, this would call a prescription service
    console.log('Creating prescription:', this.prescriptionForm);
    
    // Get AI recommendations using the ADA 8-15 function
    if (this.patientId) {
      this.patientService.getADA815Recommendations(this.patientId, this.prescriptionForm).subscribe({
        next: (recommendations: MedicineRecommendation) => {
          this.llmRecommendations = recommendations;
          this.isGeneratingRecommendations = false;
          this.recommendationsGenerated = true;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error getting ADA 8-15 recommendations:', error);
          this.isGeneratingRecommendations = false;
          this.isLoading = false;
        }
      });
    }
  }

  isFormValid(): boolean {
    // Only validate on form submission, not on initialization
    return true; // Let the actual validation happen in onSubmit
  }

  cancel(): void {
    if (this.patientId) {
      this.router.navigate(['/patients', this.patientId]);
    } else {
      this.router.navigate(['/patients']);
    }
  }

  getFieldError(fieldName: string): string {
    return this.formErrors[fieldName] || '';
  }

  hasFieldError(fieldName: string): boolean {
    return !!this.formErrors[fieldName];
  }

  formatText(text: string): string {
    if (!text) return '';
    return text
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Convert **text** to <strong>text</strong>
      .replace(/•/g, '&#8226;'); // Convert bullet points to HTML entities
  }
}
