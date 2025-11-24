import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import {
  BehaviorSubject,
  Observable,
  catchError,
  combineLatest,
  map,
  tap,
  throwError,
  of,
} from "rxjs";
import {
  Appointment,
  AppointmentWithDetails,
  AppointmentStatus,
  AppointmentView,
  CreateAppointmentDto,
} from "../models";
import { DoctorService } from "./doctor.service";
import { PatientService } from "./patient.service";
import { environment } from "../../environments/environment";

@Injectable({
  providedIn: "root",
})
export class AppointmentService {
  private apiUrl = `${environment.apiUrl}/appointments`;
  private appointmentsSubject = new BehaviorSubject<Appointment[]>([]);
  public appointments$ = this.appointmentsSubject.asObservable();

  constructor(
    private http: HttpClient,
    private doctorService: DoctorService,
    private patientService: PatientService
  ) {
    this.loadAppointments();
  }

  private loadAppointments(): void {
    this.http
      .get<any[]>(this.apiUrl)
      .pipe(
        map((rows) => rows.map((row) => this.mapAppointment(row))),
        catchError((error) => {
          console.error("Error loading appointments:", error);
          return throwError(() => error);
        })
      )
      .subscribe((appointments) => {
        this.appointmentsSubject.next(appointments);
      });
  }

  getAppointments(): Observable<Appointment[]> {
    return this.appointments$;
  }

  getAppointmentById(id: string): Observable<Appointment> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map((row) => this.mapAppointment(row)),
      catchError((error) => {
        console.error(`Error loading appointment ${id}:`, error);
        return throwError(() => error);
      })
    );
  }

  createAppointment(
    appointment: CreateAppointmentDto
  ): Observable<Appointment> {
    return this.http.post<any>(this.apiUrl, appointment).pipe(
      map((row) => this.mapAppointment(row)),
      tap((newAppointment) => {
        const currentAppointments = this.appointmentsSubject.value;
        this.appointmentsSubject.next([...currentAppointments, newAppointment]);
      }),
      catchError((error) => {
        console.error("Error creating appointment:", error);
        return throwError(() => error);
      })
    );
  }

  updateAppointment(
    id: string,
    appointment: Partial<Appointment>
  ): Observable<Appointment> {
    return this.http.patch<any>(`${this.apiUrl}/${id}`, appointment).pipe(
      map((row) => this.mapAppointment(row)),
      tap((updatedAppointment) => {
        const currentAppointments = this.appointmentsSubject.value;
        const index = currentAppointments.findIndex((a) => a.id === id);
        if (index !== -1) {
          currentAppointments[index] = updatedAppointment;
          this.appointmentsSubject.next([...currentAppointments]);
        }
      }),
      catchError((error) => {
        console.error(`Error updating appointment ${id}:`, error);
        return throwError(() => error);
      })
    );
  }

  deleteAppointment(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        const currentAppointments = this.appointmentsSubject.value;
        this.appointmentsSubject.next(
          currentAppointments.filter((a) => a.id !== id)
        );
      }),
      catchError((error) => {
        console.error(`Error deleting appointment ${id}:`, error);
        return throwError(() => error);
      })
    );
  }

  updateAppointmentStatus(
    id: string,
    status: AppointmentStatus
  ): Observable<Appointment> {
    return this.updateAppointment(id, { status });
  }

  getAppointmentsWithDetails(): Observable<AppointmentWithDetails[]> {
    // Get appointments directly from API with included patient and doctor data
    return this.http.get<any[]>(this.apiUrl).pipe(
      map((appointments) => {
        return appointments.map((appointment) => {
          const doctor = appointment.doctor;
          const patient = appointment.patient;

          return {
            ...appointment,
            doctorName: `${doctor.user.firstName} ${doctor.user.lastName}`,
            patientName: `${patient.user.firstName} ${patient.user.lastName}`,
            doctorSpecialization: doctor?.specialization || "General Medicine",
            patientAge: patient?.user?.dateOfBirth
              ? this.calculateAge(patient.user.dateOfBirth)
              : 0,
          };
        });
      }),
      catchError((error) => {
        console.error("Error loading appointments with details:", error);
        return throwError(() => error);
      })
    );
  }

  getAppointmentViews(): Observable<AppointmentView[]> {
    return combineLatest([
      this.appointments$,
      this.doctorService.getDoctors(),
      this.patientService.getPatients(), // Use getPatients
    ]).pipe(
      map(([appointments, doctors, patients]) => {
        return appointments.map((appointment) => {
          const doctor = doctors.find((d) => d.id === appointment.doctorId);
          const patient = patients.find((p) => p.id === appointment.patientId);

          const calculateAge = (dateOfBirth: Date): number => {
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
          };

          return {
            ...appointment,
            doctorName: doctor
              ? `${doctor.firstName} ${doctor.lastName}`
              : "Unknown Doctor",
            patientName: patient
              ? `${patient.user.firstName} ${patient.user.lastName}`
              : "Unknown Patient",
            doctorSpecialization: doctor
              ? doctor.specialization
              : "General Medicine",
            patientAge: patient ? calculateAge(patient.user.dateOfBirth) : 0,
          };
        });
      })
    );
  }

  getAppointmentsByDoctor(
    doctorId: string
  ): Observable<AppointmentWithDetails[]> {
    return this.getAppointmentsWithDetails().pipe(
      map((appointments) => appointments.filter((a) => a.doctorId === doctorId))
    );
  }

  getAppointmentViewsByDoctor(doctorId: string): Observable<AppointmentView[]> {
    return this.getAppointmentViews().pipe(
      map((appointments) => appointments.filter((a) => a.doctorId === doctorId))
    );
  }

  getAppointmentsByPatient(
    patientId: string
  ): Observable<AppointmentWithDetails[]> {
    return this.getAppointmentsWithDetails().pipe(
      map((appointments) =>
        appointments.filter((a) => a.patientId === patientId)
      )
    );
  }

  getTodaysAppointments(): Observable<AppointmentWithDetails[]> {
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

    return this.getAppointmentsWithDetails().pipe(
      map((appointments) =>
        appointments.filter((a) => {
          const appointmentDate = new Date(a.date);
          const isToday =
            appointmentDate >= startOfDay && appointmentDate < endOfDay;
          const isNotCompleted = a.status !== "COMPLETED";
          return isToday && isNotCompleted;
        })
      )
    );
  }

  getUpcomingAppointments(): Observable<AppointmentWithDetails[]> {
    const today = new Date();
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    return this.getAppointmentsWithDetails().pipe(
      map((appointments) =>
        appointments
          .filter((a) => {
            const appointmentDate = new Date(a.date);
            return appointmentDate >= startOfDay && a.status === "SCHEDULED";
          })
          .sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
          )
      )
    );
  }

  getAvailableTimeSlots(doctorId: string, date: Date): Observable<string[]> {
    const startHour = 9;
    const endHour = 17;
    const slots: string[] = [];

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeSlot = `${hour.toString().padStart(2, "0")}:${minute
          .toString()
          .padStart(2, "0")}`;
        slots.push(timeSlot);
      }
    }

    return combineLatest({
      appointments: this.appointments$,
      availableSlots: of(slots),
    }).pipe(
      map((result) => {
        const selectedDate = new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate()
        );
        const bookedSlots = result.appointments
          .filter(
            (appointment) =>
              appointment.doctorId === doctorId &&
              new Date(appointment.date).getFullYear() ===
                selectedDate.getFullYear() &&
              new Date(appointment.date).getMonth() ===
                selectedDate.getMonth() &&
              new Date(appointment.date).getDate() === selectedDate.getDate() &&
              appointment.status !== "CANCELLED"
          )
          .map((appointment) => {
            const appointmentDate = new Date(appointment.date);
            return `${appointmentDate
              .getHours()
              .toString()
              .padStart(2, "0")}:${appointmentDate
              .getMinutes()
              .toString()
              .padStart(2, "0")}`;
          });

        return result.availableSlots.filter(
          (slot) => !bookedSlots.includes(slot)
        );
      })
    );
  }

  private mapAppointment(row: any): Appointment {
    return {
      id: row.id,
      doctorId: row.doctorId,
      patientId: row.patientId,
      date: new Date(row.date || row.dateTime),
      duration: row.duration || 30,
      status: (row.status || "SCHEDULED") as AppointmentStatus,
      type: (row.type || "consultation") as any,
      notes: row.notes || "",
      createdAt: new Date(row.createdAt || Date.now()),
      updatedAt: new Date(row.updatedAt || Date.now()),
    };
  }

  private calculateAge(dateOfBirth: string | Date): number {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
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
}
