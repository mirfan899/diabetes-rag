import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ActivatedRoute, Router } from "@angular/router";
import { Observable, of, combineLatest } from "rxjs";
import { map } from "rxjs/operators";
import { Appointment, AppointmentView, Patient, Doctor } from "../../models";
import { AppointmentService } from "../../services/appointment.service";
import { PatientService } from "../../services/patient.service";
import { DoctorService } from "../../services/doctor.service";
import { AvatarComponent } from "../../shared/components/avatar/avatar.component";

@Component({
  selector: "app-appointment-detail",
  standalone: true,
  imports: [CommonModule, AvatarComponent],
  templateUrl: "./appointment-detail.component.html",
  styleUrls: ["./appointment-detail.component.scss"],
})
export class AppointmentDetailComponent implements OnInit {
  appointmentId!: string;
  appointment$!: Observable<Appointment | undefined>;
  appointmentWithDetails$!: Observable<
    | {
        appointment: Appointment;
        patient: Patient;
        doctor: Doctor;
      }
    | undefined
  >;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private appointmentService: AppointmentService,
    private patientService: PatientService,
    private doctorService: DoctorService
  ) {}

  ngOnInit(): void {
    this.appointmentId = this.route.snapshot.paramMap.get("id")!;
    console.log("Appointment ID:", this.appointmentId);
    this.appointment$ = this.appointmentService.getAppointmentById(
      this.appointmentId
    );

    // Load appointment with full patient and doctor details
    this.appointmentWithDetails$ = combineLatest([
      this.appointment$,
      this.patientService.getPatients(),
      this.doctorService.getDoctors(),
    ]).pipe(
      map(([appointment, patients, doctors]) => {
        if (!appointment) return undefined;

        const patient = patients.find((p) => p.id === appointment.patientId);
        const doctor = doctors.find((d) => d.id === appointment.doctorId);

        if (!patient || !doctor) return undefined;

        return {
          appointment,
          patient,
          doctor,
        };
      })
    );
  }

  goBack(): void {
    this.router.navigate(["/appointments"]);
  }

  editAppointment(): void {
    // Navigate to edit form (not implemented yet)
    console.log("Edit appointment:", this.appointmentId);
  }

  startSoapNote(): void {
    this.router.navigate(["/soap-note/" + this.appointmentId]);
  }

  writePrescription(): void {
    // Get patient ID from the appointment details
    this.appointmentWithDetails$.subscribe((appointmentDetails) => {
      if (appointmentDetails) {
        this.router.navigate(["/prescription-form"], {
          queryParams: {
            patientId: appointmentDetails.patient.id,
            appointmentId: this.appointmentId,
          },
        });
      }
    });
  }

  formatDateTime(date: Date): string {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  getStatusClass(status: string): string {
    const statusClasses: Record<string, string> = {
      scheduled: "scheduled",
      confirmed: "confirmed",
      "in-progress": "in-progress",
      completed: "completed",
      cancelled: "cancelled",
      "no-show": "no-show",
    };
    return statusClasses[status] || "scheduled";
  }

  calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
}
