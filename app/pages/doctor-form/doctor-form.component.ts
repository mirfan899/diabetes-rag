import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router, ActivatedRoute } from "@angular/router";
import { DoctorService } from "../../services/doctor.service";

@Component({
  selector: "app-doctor-form",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./doctor-form.component.html",
  styleUrls: ["./doctor-form.component.scss"],
})
export class DoctorFormComponent implements OnInit {
  isEditMode = false;
  doctorId: string | null = null;
  isLoading = false;

  doctorForm = {
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    specialization: "",
    department: "",
    experience: 0,
    avatar: "",
    isAvailable: true,
  };

  specializations = [
    "Cardiology",
    "Dermatology",
    "Neurology",
    "Pediatrics",
    "Orthopedics",
    "Internal Medicine",
    "Surgery",
    "Psychiatry",
    "Radiology",
    "Emergency Medicine",
    "Family Medicine",
  ];

  departments = [
    "Cardiology",
    "Dermatology",
    "Neurology",
    "Pediatrics",
    "Orthopedics",
    "Internal Medicine",
    "Surgery",
    "Psychiatry",
    "Radiology",
    "Emergency Medicine",
    "Family Medicine",
  ];

  constructor(
    private doctorService: DoctorService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.doctorId = this.route.snapshot.paramMap.get("id");
    if (this.doctorId && this.doctorId !== "new") {
      this.isEditMode = true;
      this.loadDoctor();
    }
  }

  loadDoctor(): void {
    if (!this.doctorId) return;

    this.isLoading = true;
    this.doctorService.getDoctorById(this.doctorId).subscribe({
      next: (doctor) => {
        this.doctorForm = {
          firstName: doctor.firstName || "",
          lastName: doctor.lastName || "",
          email: doctor.email || "",
          phoneNumber: doctor.phoneNumber || "",
          specialization: doctor.specialization || "",
          department: doctor.department || "",
          experience: doctor.experience || 0,
          avatar: doctor.avatar || "",
          isAvailable:
            doctor.isAvailable !== undefined ? doctor.isAvailable : true,
        };
        this.isLoading = false;
      },
      error: (error) => {
        console.error("Error loading doctor:", error);
        this.isLoading = false;
      },
    });
  }

  onSubmit(): void {
    if (!this.isFormValid()) return;

    this.isLoading = true;
    const doctorData = {
      ...this.doctorForm,
      name: `${this.doctorForm.firstName} ${this.doctorForm.lastName}`.trim(),
    };
    // Remove 'name' before sending to backend
    const { name, ...payload } = doctorData;

    if (this.isEditMode && this.doctorId) {
      this.doctorService.updateDoctor(this.doctorId, payload).subscribe({
        next: () => {
          this.router.navigate(["/doctors"]);
        },
        error: (error) => {
          console.error("Error updating doctor:", error);
          this.isLoading = false;
        },
      });
    } else {
      this.doctorService.createDoctor(payload).subscribe({
        next: () => {
          this.router.navigate(["/doctors"]);
        },
        error: (error) => {
          console.error("Error creating doctor:", error);
          this.isLoading = false;
        },
      });
    }
  }

  isFormValid(): boolean {
    return !!(
      this.doctorForm.firstName &&
      this.doctorForm.lastName &&
      this.doctorForm.email &&
      this.doctorForm.phoneNumber &&
      this.doctorForm.specialization
    );
  }

  cancel(): void {
    this.router.navigate(["/doctors"]);
  }
}
