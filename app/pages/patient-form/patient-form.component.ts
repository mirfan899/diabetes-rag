import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router, ActivatedRoute } from "@angular/router";
import { PatientService } from "../../services/patient.service";

@Component({
  selector: "app-patient-form",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./patient-form.component.html",
  styleUrls: ["./patient-form.component.scss"],
})
export class PatientFormComponent implements OnInit {
  isEditMode = false;
  patientId: string | null = null;
  isLoading = false;
  formSubmitted = false;

  patientForm = {
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    dateOfBirth: "",
    gender: "male" as "male" | "female" | "other",
    address: "",
    hospitalNo: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    bloodType: "",
    allergies: "",
    medicalHistory: "",
    currentMedications: "",
    isActive: true,
  };

  errorMessage = "";

  genders = ["male", "female", "other"];
  bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  constructor(
    private patientService: PatientService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.patientId = this.route.snapshot.paramMap.get("id");
    if (this.patientId && this.patientId !== "new") {
      this.isEditMode = true;
      this.loadPatient();
    }
  }

  loadPatient(): void {
    if (!this.patientId) return;

    this.isLoading = true;
    this.patientService.getPatientById(this.patientId).subscribe({
      next: (patient) => {
        this.patientForm = {
          firstName: patient.user.firstName || "",
          lastName: patient.user.lastName || "",
          email: patient.user.email || "",
          phoneNumber: patient.user.phoneNumber || "",
          dateOfBirth: patient.user.dateOfBirth
            ? new Date(patient.user.dateOfBirth).toISOString().split("T")[0]
            : "",
          gender:
            patient.user.gender || ("male" as "male" | "female" | "other"),
          address: patient.user.address || "",
          hospitalNo: patient.hospitalNo || "",
          emergencyContactName: patient.emergencyContactName || "",
          emergencyContactPhone: patient.emergencyContactPhone || "",
          bloodType: patient.bloodType || "",
          allergies: Array.isArray(patient.allergies)
            ? patient.allergies.join(", ")
            : patient.allergies || "",
          medicalHistory: Array.isArray(patient.medicalHistory)
            ? patient.medicalHistory.join(", ")
            : patient.medicalHistory || "",
          currentMedications: Array.isArray(patient.currentMedications)
            ? patient.currentMedications.join(", ")
            : patient.currentMedications || "",
          isActive:
            patient.user.isActive !== undefined ? patient.user.isActive : true,
        };
        this.isLoading = false;
      },
      error: (error) => {
        console.error("Error loading patient:", error);
        this.isLoading = false;
      },
    });
  }

  onSubmit(): void {
    this.formSubmitted = true;
    if (!this.isFormValid()) return;

    this.isLoading = true;
    const patientData = {
      ...this.patientForm,
      name: `${this.patientForm.firstName} ${this.patientForm.lastName}`.trim(),
    };
    // Remove 'name' before sending to backend
    const { name, ...payload } = patientData;

    if (this.isEditMode && this.patientId) {
      // Send string values as expected by the backend
      const updateData = {
        ...payload,
        dateOfBirth: new Date(payload.dateOfBirth),
        gender: payload.gender as "male" | "female" | "other",
        // Keep as strings - don't convert to arrays
        allergies: payload.allergies || "",
        medicalHistory: payload.medicalHistory || "",
        currentMedications: payload.currentMedications || "",
      };
      this.patientService.updatePatient(this.patientId, updateData).subscribe({
        next: () => {
          this.router.navigate(["/patients"]);
        },
        error: (error) => {
          console.error("Error updating patient:", error);
          this.isLoading = false;
          this.errorMessage =
            error.error?.message ||
            error.message ||
            "Failed to update patient. Please try again.";
        },
      });
    } else {
      // Create data for new patient
      const createData = {
        ...payload,
        dateOfBirth: payload.dateOfBirth
          ? new Date(payload.dateOfBirth)
          : new Date(),
        gender: payload.gender as "male" | "female" | "other",
      };
      this.patientService
        .createPatient(
          createData as import("../../services/patient.service").CreatePatientDto
        )
        .subscribe({
          next: () => {
            this.router.navigate(["/patients"]);
          },
          error: (error) => {
            console.error("Error creating patient:", error);
            this.isLoading = false;
            this.errorMessage =
              error.error?.message ||
              error.message ||
              "Failed to create patient. Please try again.";
          },
        });
    }
  }

  isFormValid(): boolean {
    return !!(
      this.patientForm.firstName &&
      this.patientForm.lastName &&
      this.patientForm.email &&
      this.patientForm.phoneNumber &&
      this.patientForm.dateOfBirth
    );
  }

  cancel(): void {
    this.router.navigate(["/patients"]);
  }
}
