import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from "@angular/forms";

interface Medication {
  name: string;
  category: string;
  doses: string[];
  conditions: string[];
  contraindications: string[];
  monitoring: string[];
  pregnancySafe: boolean;
  bmiRequired: boolean;
  minBmi?: number;
  maxBmi?: number;
}

@Component({
  selector: "app-ada-prescription",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: "./ada-prescription.component.html",
  styleUrls: ["./ada-prescription.component.scss"],
})
export class AdaPrescriptionComponent implements OnInit {
  prescriptionForm: FormGroup;
  isSubmitting = false;
  bmi: number = 0;

  medications: Medication[] = [
    {
      name: "Phentermine",
      category: "Weight Management",
      doses: [
        "15 mg once daily",
        "7.5 mg once daily",
        "37.5 mg once daily (max)",
      ],
      conditions: [
        "BMI ≥30 kg/m²",
        "BMI ≥27 kg/m² with obesity-associated comorbidities",
      ],
      contraindications: [
        "Pregnancy",
        "Cardiovascular disease",
        "Hyperthyroidism",
      ],
      monitoring: ["Blood pressure", "Heart rate"],
      pregnancySafe: false,
      bmiRequired: true,
      minBmi: 27,
    },
    {
      name: "Orlistat",
      category: "Weight Management",
      doses: [
        "120 mg three times daily (prescription)",
        "60 mg three times daily (OTC)",
      ],
      conditions: [
        "BMI ≥30 kg/m²",
        "BMI ≥27 kg/m² with obesity-associated comorbidities",
      ],
      contraindications: ["Chronic malabsorption", "Cholestasis"],
      monitoring: [
        "Liver function tests",
        "Fat-soluble vitamin levels",
        "Kidney function tests",
      ],
      pregnancySafe: false,
      bmiRequired: true,
      minBmi: 27,
    },
    {
      name: "Liraglutide",
      category: "GLP-1 Agonist",
      doses: ["3.0 mg once daily", "1.8 mg once daily"],
      conditions: [
        "Type 2 diabetes",
        "BMI ≥30 kg/m²",
        "BMI ≥27 kg/m² with comorbidities",
      ],
      contraindications: [
        "Personal/family history of medullary thyroid carcinoma",
        "Multiple endocrine neoplasia syndrome type 2",
      ],
      monitoring: ["Blood glucose", "Pancreatic enzymes", "Kidney function"],
      pregnancySafe: false,
      bmiRequired: true,
      minBmi: 27,
    },
    {
      name: "Semaglutide",
      category: "GLP-1 Agonist",
      doses: ["2.4 mg once weekly", "1.0 mg once weekly"],
      conditions: [
        "Type 2 diabetes",
        "BMI ≥30 kg/m²",
        "BMI ≥27 kg/m² with comorbidities",
      ],
      contraindications: [
        "Personal/family history of medullary thyroid carcinoma",
        "Multiple endocrine neoplasia syndrome type 2",
      ],
      monitoring: [
        "Blood glucose",
        "Liver function",
        "Pancreatic enzymes",
        "Thyroid function",
      ],
      pregnancySafe: false,
      bmiRequired: true,
      minBmi: 27,
    },
    {
      name: "Metformin",
      category: "Biguanide",
      doses: [
        "500 mg twice daily",
        "1000 mg twice daily",
        "850 mg twice daily",
      ],
      conditions: ["Type 2 diabetes", "PCOS", "Prediabetes"],
      contraindications: [
        "Severe renal impairment",
        "Severe hepatic impairment",
        "Metabolic acidosis",
      ],
      monitoring: ["Blood glucose", "Kidney function", "Vitamin B12 levels"],
      pregnancySafe: true,
      bmiRequired: false,
    },
    {
      name: "Insulin",
      category: "Hormone",
      doses: ["Individualized dosing", "0.5-1.0 units/kg/day"],
      conditions: [
        "Type 1 diabetes",
        "Type 2 diabetes",
        "Gestational diabetes",
        "Pregnancy with diabetes",
      ],
      contraindications: ["Hypoglycemia unawareness", "Severe hypoglycemia"],
      monitoring: ["Blood glucose", "HbA1c", "Weight"],
      pregnancySafe: true,
      bmiRequired: false,
    },
    {
      name: "SGLT2 Inhibitors",
      category: "Sodium-Glucose Cotransporter 2 Inhibitors",
      doses: [
        "Empagliflozin 10-25 mg daily",
        "Dapagliflozin 5-10 mg daily",
        "Canagliflozin 100-300 mg daily",
      ],
      conditions: [
        "Type 2 diabetes",
        "Heart failure",
        "Chronic kidney disease",
      ],
      contraindications: [
        "Severe renal impairment",
        "Dialysis",
        "Type 1 diabetes",
      ],
      monitoring: ["Renal function", "Urinalysis", "Blood pressure"],
      pregnancySafe: false,
      bmiRequired: false,
    },
  ];

  filteredMedications: Medication[] = [];

  constructor(private fb: FormBuilder) {
    this.prescriptionForm = this.fb.group({
      // Patient Demographics
      firstName: ["", Validators.required],
      lastName: ["", Validators.required],
      dateOfBirth: ["", Validators.required],
      gender: ["", Validators.required],
      weight: ["", [Validators.required, Validators.min(1)]],
      height: ["", [Validators.required, Validators.min(1)]],

      // Medical History
      diabetesType: ["", Validators.required],
      pregnancyStatus: [""],
      gestationalAge: [""],
      comorbidities: this.fb.array([]),

      // Current Medications
      currentMedications: this.fb.array([]),

      // Lab Values
      hba1c: ["", Validators.min(0)],
      bloodGlucose: ["", Validators.min(0)],
      kidneyFunction: ["", Validators.min(0)],
      liverFunction: [""],

      // Selected Medication
      selectedMedication: ["", Validators.required],
      selectedDose: ["", Validators.required],
      prescriptionReason: ["", Validators.required],

      // Monitoring Plan
      monitoringPlan: this.fb.array([]),

      // Additional Notes
      additionalNotes: [""],
    });
  }

  ngOnInit() {
    this.filteredMedications = this.medications;

    // Watch for gender changes to show/hide pregnancy fields
    this.prescriptionForm.get("gender")?.valueChanges.subscribe((gender) => {
      if (gender !== "female") {
        this.prescriptionForm.patchValue({
          pregnancyStatus: "",
          gestationalAge: "",
        });
      }
    });

    // Watch for weight and height changes to calculate BMI
    this.prescriptionForm
      .get("weight")
      ?.valueChanges.subscribe(() => this.calculateBMI());
    this.prescriptionForm
      .get("height")
      ?.valueChanges.subscribe(() => this.calculateBMI());

    // Watch for medication selection to filter available medications
    this.prescriptionForm
      .get("selectedMedication")
      ?.valueChanges.subscribe((medName) => {
        const medication = this.medications.find((m) => m.name === medName);
        if (medication) {
          this.updateMonitoringPlan(medication);
        }
      });
  }

  calculateBMI() {
    const weight = this.prescriptionForm.get("weight")?.value;
    const height = this.prescriptionForm.get("height")?.value;

    if (weight && height) {
      const heightInMeters = height / 100;
      this.bmi = weight / (heightInMeters * heightInMeters);
    }
  }

  filterMedications() {
    const gender = this.prescriptionForm.get("gender")?.value;
    const pregnancyStatus = this.prescriptionForm.get("pregnancyStatus")?.value;
    const diabetesType = this.prescriptionForm.get("diabetesType")?.value;

    this.filteredMedications = this.medications.filter((med) => {
      // Filter by pregnancy safety
      if (
        gender === "female" &&
        pregnancyStatus === "pregnant" &&
        !med.pregnancySafe
      ) {
        return false;
      }

      // Filter by BMI requirements
      if (med.bmiRequired && this.bmi < (med.minBmi || 0)) {
        return false;
      }

      return true;
    });
  }

  updateMonitoringPlan(medication: Medication) {
    const monitoringArray = this.prescriptionForm.get("monitoringPlan") as any;
    monitoringArray.clear();

    medication.monitoring.forEach((test) => {
      monitoringArray.push(this.fb.control(test));
    });
  }

  onSubmit() {
    if (this.prescriptionForm.valid) {
      this.isSubmitting = true;
      console.log("Prescription Form Data:", this.prescriptionForm.value);

      // Here you would typically send the data to your backend
      setTimeout(() => {
        this.isSubmitting = false;
        alert("Prescription submitted successfully!");
      }, 2000);
    } else {
      this.markFormGroupTouched();
    }
  }

  markFormGroupTouched() {
    Object.keys(this.prescriptionForm.controls).forEach((key) => {
      const control = this.prescriptionForm.get(key);
      control?.markAsTouched();
    });
  }

  getFieldError(fieldName: string): string {
    const field = this.prescriptionForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors["required"]) return `${fieldName} is required`;
      if (field.errors["min"])
        return `${fieldName} must be greater than ${field.errors["min"].min}`;
    }
    return "";
  }

  getBmiCategory(): string {
    if (this.bmi < 18.5) return "underweight";
    if (this.bmi < 25) return "normal";
    if (this.bmi < 30) return "overweight";
    return "obese";
  }

  getBmiCategoryText(): string {
    const category = this.getBmiCategory();
    switch (category) {
      case "underweight":
        return "Underweight";
      case "normal":
        return "Normal";
      case "overweight":
        return "Overweight";
      case "obese":
        return "Obese";
      default:
        return "";
    }
  }

  getSelectedMedication(): Medication | undefined {
    const selectedName = this.prescriptionForm.get("selectedMedication")?.value;
    return this.medications.find((m) => m.name === selectedName);
  }

  isMedicationSuitable(medication: Medication): boolean {
    const gender = this.prescriptionForm.get("gender")?.value;
    const pregnancyStatus = this.prescriptionForm.get("pregnancyStatus")?.value;

    // Check pregnancy safety
    if (
      gender === "female" &&
      pregnancyStatus === "pregnant" &&
      !medication.pregnancySafe
    ) {
      return false;
    }

    // Check BMI requirements
    if (medication.bmiRequired && this.bmi < (medication.minBmi || 0)) {
      return false;
    }

    return true;
  }
}
