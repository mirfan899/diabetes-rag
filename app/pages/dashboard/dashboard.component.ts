import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule, Router } from "@angular/router";
import { Observable, combineLatest, map } from "rxjs";
import { DoctorService } from "../../services/doctor.service";
import { PatientService } from "../../services/patient.service";
import { AppointmentService } from "../../services/appointment.service";
import { AuthService } from "../../services/auth.service";
import {
  AppointmentWithDetails,
  DoctorWithStats,
  PatientWithLastVisit,
} from "../../models";
import { AvatarComponent } from "../../shared/components/avatar/avatar.component";

@Component({
  selector: "app-dashboard",
  standalone: true,
  imports: [CommonModule, RouterModule, AvatarComponent],
  templateUrl: "./dashboard.component.html",
  styleUrls: ["./dashboard.component.scss"],
})
export class DashboardComponent implements OnInit {
  currentDate = new Date();

  dashboardStats$!: Observable<{
    todayAppointments: number;
    totalDoctors: number;
    totalPatients: number;
    upcomingAppointments: number;
  }>;

  todayAppointments$!: Observable<AppointmentWithDetails[]>;
  recentPatients$!: Observable<PatientWithLastVisit[]>;

  constructor(
    private doctorService: DoctorService,
    private patientService: PatientService,
    private appointmentService: AppointmentService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadDashboardData();
  }

  private loadDashboardData() {
    const currentDoctor = this.authService.getCurrentDoctor();

    // Load dashboard statistics
    this.dashboardStats$ = combineLatest([
      // Today's appointments
      currentDoctor?.doctorId
        ? this.appointmentService
            .getAppointmentsByDoctor(currentDoctor.doctorId)
            .pipe(
              map((appointments) =>
                appointments.filter((a) => {
                  const today = new Date();
                  const startOfDay = new Date(
                    today.getFullYear(),
                    today.getMonth(),
                    today.getDate()
                  );
                  const endOfDay = new Date(
                    today.getFullYear(),
                    today.getMonth(),
                    today.getDate() + 1
                  );
                  const appointmentDate = new Date(a.date);
                  const isToday =
                    appointmentDate >= startOfDay && appointmentDate < endOfDay;
                  const isNotCompleted = a.status !== "COMPLETED";
                  return isToday && isNotCompleted;
                })
              )
            )
        : this.appointmentService.getTodaysAppointments(),

      this.doctorService.getDoctors(),
      this.patientService.getPatients(),

      // Upcoming appointments (from today onwards)
      currentDoctor?.doctorId
        ? this.appointmentService
            .getAppointmentsByDoctor(currentDoctor.doctorId)
            .pipe(
              map((appointments) =>
                appointments.filter((a) => {
                  const today = new Date();
                  const startOfDay = new Date(
                    today.getFullYear(),
                    today.getMonth(),
                    today.getDate()
                  );
                  const appointmentDate = new Date(a.date);
                  return (
                    appointmentDate >= startOfDay && a.status === "SCHEDULED"
                  );
                })
              )
            )
        : this.appointmentService.getUpcomingAppointments(),
    ]).pipe(
      map(([todayAppointments, doctors, patients, upcomingAppointments]) => ({
        todayAppointments: todayAppointments.length,
        totalDoctors: doctors.length,
        totalPatients: patients.length,
        upcomingAppointments: upcomingAppointments.length,
      }))
    );

    // Load today's appointments filtered by current doctor
    if (currentDoctor?.doctorId) {
      this.todayAppointments$ = this.appointmentService
        .getAppointmentsByDoctor(currentDoctor.doctorId)
        .pipe(
          map((appointments) =>
            appointments.filter((a) => {
              const today = new Date();
              const startOfDay = new Date(
                today.getFullYear(),
                today.getMonth(),
                today.getDate()
              );
              const endOfDay = new Date(
                today.getFullYear(),
                today.getMonth(),
                today.getDate() + 1
              );
              const appointmentDate = new Date(a.date);
              const isToday =
                appointmentDate >= startOfDay && appointmentDate < endOfDay;
              const isNotCompleted = a.status !== "COMPLETED";
              return isToday && isNotCompleted;
            })
          )
        );
    } else {
      this.todayAppointments$ = this.appointmentService.getTodaysAppointments();
    }

    // Load recent patients
    this.recentPatients$ = this.patientService.getPatientsWithLastVisit();
  }

  trackByAppointmentId(
    index: number,
    appointment: AppointmentWithDetails
  ): string {
    return appointment.id;
  }

  trackByPatientId(index: number, patient: PatientWithLastVisit): string {
    return patient.id;
  }

  getAge(dateOfBirth: Date): number {
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

  openPrescriptionForm(patientId: string, appointmentId: string): void {
    this.router.navigate(["/prescription-form"], {
      queryParams: {
        patientId: patientId,
        appointmentId: appointmentId,
      },
    });
  }
}
