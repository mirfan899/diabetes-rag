import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router, ActivatedRoute } from "@angular/router";
import { Observable } from "rxjs";
import { Patient, AppointmentWithDetails } from "../../models";
import { PatientService } from "../../services/patient.service";
import { AppointmentService } from "../../services/appointment.service";
import { AvatarComponent } from "../../shared/components/avatar/avatar.component";
import { RecommendationsPopupComponent } from "../../shared/components/recommendations-popup/recommendations-popup.component";

@Component({
  selector: "app-patient-view",
  standalone: true,
  imports: [CommonModule, AvatarComponent, RecommendationsPopupComponent],
  templateUrl: "./patient-view.component.html",
  styleUrls: ["./patient-view.component.scss"],
})
export class PatientViewComponent implements OnInit {
  patientId!: string;
  patient$!: Observable<Patient | undefined>;
  appointments: AppointmentWithDetails[] = [];
  isLoading = false;

  // Popup state
  showRecommendationsPopup = false;
  selectedAppointmentId: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private patientService: PatientService,
    private appointmentService: AppointmentService
  ) {}

  ngOnInit(): void {
    this.patientId = this.route.snapshot.paramMap.get("id")!;
    if (this.patientId) {
      this.loadPatient();
      this.loadAppointments();
    }
  }

  loadPatient(): void {
    this.patient$ = this.patientService.getPatientById(this.patientId);
  }

  loadAppointments(): void {
    this.isLoading = true;
    this.appointmentService.getAppointmentsByPatient(this.patientId).subscribe({
      next: async (appointments) => {
        // Filter for completed appointments only
        const completedAppointments = appointments.filter(
          (appointment) => appointment.status === "COMPLETED"
        );

        // Check which completed appointments have recommendations
        const appointmentsWithRecommendations =
          await this.filterAppointmentsWithRecommendations(
            completedAppointments
          );

        // Sort appointments by date (most recent first)
        this.appointments = appointmentsWithRecommendations.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        this.isLoading = false;
      },
      error: (error) => {
        console.error("Error loading appointments:", error);
        this.isLoading = false;
      },
    });
  }

  private async filterAppointmentsWithRecommendations(
    appointments: AppointmentWithDetails[]
  ): Promise<AppointmentWithDetails[]> {
    // TODO: Implement getRecommendationsByAppointmentId method in PatientService
    // For now, return all completed appointments
    return appointments;
  }

  // Helper method to convert string or array to array
  toArray(value: string[] | string | undefined): string[] {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    return [value];
  }

  editPatient(): void {
    this.router.navigate(["/patients", this.patientId, "edit"]);
  }

  scheduleAppointment(): void {
    this.router.navigate(["/appointment/new"], {
      queryParams: { patientId: this.patientId },
    });
  }

  goBack(): void {
    this.router.navigate(["/patients"]);
  }

  calculateAge(dob: string | Date): number | string {
    console.log("DOB:", dob);
    let dateObj = new Date(dob);

    const today = new Date();
    let age = today.getFullYear() - dateObj.getFullYear();
    const monthDiff = today.getMonth() - dateObj.getMonth();
    const dayDiff = today.getDate() - dateObj.getDate();

    // Adjust if birthday hasn't happened yet this year
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      age--;
    }
    console.log("Age:", age);
    return age;
  }

  formatDate(date: string | Date): string {
    let dateObj: Date;

    dateObj = new Date(date);

    return dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  getAppointmentStatusClass(status: string): string {
    switch (status) {
      case "SCHEDULED":
        return "status-scheduled";
      case "IN_PROGRESS":
        return "status-in-progress";
      case "COMPLETED":
        return "status-completed";
      case "CANCELLED":
        return "status-cancelled";
      default:
        return "status-default";
    }
  }

  getDoctorName(appointment: AppointmentWithDetails): string {
    if (appointment.doctor?.firstName && appointment.doctor?.lastName) {
      return `${appointment.doctor.firstName} ${appointment.doctor.lastName}`;
    } else if (appointment.doctor?.name) {
      return appointment.doctor.name;
    } else {
      return "Unknown Doctor";
    }
  }

  showRecommendations(appointmentId: string): void {
    this.selectedAppointmentId = appointmentId;
    this.showRecommendationsPopup = true;
  }

  closeRecommendationsPopup(): void {
    this.showRecommendationsPopup = false;
    this.selectedAppointmentId = null;
  }

  writePrescription(): void {
    if (this.patientId) {
      this.router.navigate(["/prescription-form"], {
        queryParams: { patientId: this.patientId },
      });
    }
  }
}
