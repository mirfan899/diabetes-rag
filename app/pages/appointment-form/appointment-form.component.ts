import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router, ActivatedRoute } from "@angular/router";
import { Observable } from "rxjs";
import {
  Doctor,
  Patient,
  Appointment,
  AppointmentStatus,
  CreateAppointmentDto,
} from "../../models";
import { DoctorService } from "../../services/doctor.service";
import { PatientService } from "../../services/patient.service";
import { AppointmentService } from "../../services/appointment.service";
import { AuthService } from "../../services/auth.service";
import { FindPipe } from "../../shared/pipes/find.pipe";

@Component({
  selector: "app-appointment-form",
  standalone: true,
  imports: [CommonModule, FormsModule, FindPipe],
  templateUrl: "./appointment-form.component.html",
  styleUrls: ["./appointment-form.component.scss"],
})
export class AppointmentFormComponent implements OnInit {
  doctors$: Observable<Doctor[]>;
  patients$: Observable<Patient[]>;

  appointmentForm = {
    patientId: "",
    doctorId: "",
    date: "",
    time: "",
    duration: 15,
    type: "consultation" as "consultation" | "follow-up" | "emergency",
    notes: "",
  };

  appointmentTypes = [
    { value: "consultation", label: "Consultation" },
    { value: "follow-up", label: "Follow-up" },
    { value: "emergency", label: "Emergency" },
  ];

  durations = [
    { value: 15, label: "15 minutes" },
    { value: 30, label: "30 minutes" },
  ];

  availableTimeSlots: string[] = [];
  isLoading = false;
  minDate: string = new Date().toISOString().split("T")[0];
  isEditing = false;
  editingAppointmentId: string | null = null;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private doctorService: DoctorService,
    private patientService: PatientService,
    private appointmentService: AppointmentService,
    private authService: AuthService
  ) {
    this.doctors$ = this.doctorService.getDoctors();
    this.patients$ = this.patientService.getPatients();
  }

  ngOnInit(): void {
    // Set the logged-in doctor as default
    const currentDoctor = this.authService.getCurrentDoctor();
    if (currentDoctor) {
      this.appointmentForm.doctorId = currentDoctor.doctorId;
    }

    // Check if patient ID was passed as query parameter
    const patientId = this.route.snapshot.queryParamMap.get("patientId");
    if (patientId) {
      this.appointmentForm.patientId = patientId;
    }

    // Check if editing an existing appointment
    const editId = this.route.snapshot.queryParamMap.get("editId");
    if (editId) {
      this.loadAppointmentForEdit(editId);
    } else {
      // Set default date to tomorrow for new appointments
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      this.appointmentForm.date = tomorrow.toISOString().split("T")[0];

      // Load time slots for the default date if doctor is set
      if (this.appointmentForm.doctorId && this.appointmentForm.date) {
        this.loadAvailableTimeSlots();
      }
    }
  }

  onDoctorChange(): void {
    this.loadAvailableTimeSlots();
  }

  onDateChange(): void {
    this.loadAvailableTimeSlots();
  }

  loadAvailableTimeSlots(): void {
    if (!this.appointmentForm.doctorId || !this.appointmentForm.date) {
      this.availableTimeSlots = [];
      return;
    }

    const selectedDate = new Date(this.appointmentForm.date);
    this.appointmentService
      .getAvailableTimeSlots(this.appointmentForm.doctorId, selectedDate)
      .subscribe({
        next: (slots) => {
          this.availableTimeSlots = slots;
          console.log("Available time slots:", slots);
          // Reset selected time if it's no longer available
          if (!slots.includes(this.appointmentForm.time)) {
            this.appointmentForm.time = "";
          }
        },
        error: (error: any) => {
          console.error("Error loading time slots:", error);
          this.availableTimeSlots = [];
        },
      });
  }

  onSubmit(): void {
    if (!this.isFormValid()) {
      return;
    }

    this.isLoading = true;

    if (this.isEditing && this.editingAppointmentId) {
      // Update existing appointment
      const updateData = {
        patientId: this.appointmentForm.patientId,
        doctorId: this.appointmentForm.doctorId,
        date: new Date(
          `${this.appointmentForm.date}T${this.appointmentForm.time}`
        ),
        duration: this.appointmentForm.duration,
        type: this.appointmentForm.type,
        status: "SCHEDULED" as AppointmentStatus,
        notes: this.appointmentForm.notes,
      };

      this.appointmentService
        .updateAppointment(this.editingAppointmentId, updateData)
        .subscribe({
          next: (updatedAppointment) => {
            console.log("Appointment updated:", updatedAppointment);
            this.router.navigate(["/appointments"]);
          },
          error: (error: any) => {
            console.error("Error updating appointment:", error);
            this.isLoading = false;
          },
        });
    } else {
      // Create new appointment
      const createData: CreateAppointmentDto = {
        patientId: this.appointmentForm.patientId,
        doctorId: this.appointmentForm.doctorId,
        date: this.appointmentForm.date,
        time: this.appointmentForm.time,
        duration: this.appointmentForm.duration,
        type: this.appointmentForm.type,
        status: "SCHEDULED" as AppointmentStatus,
        notes: this.appointmentForm.notes,
      };

      this.appointmentService.createAppointment(createData).subscribe({
        next: (createdAppointment) => {
          console.log("Appointment created:", createdAppointment);
          this.router.navigate(["/appointments"]);
        },
        error: (error: any) => {
          console.error("Error creating appointment:", error);
          this.isLoading = false;
        },
      });
    }
  }

  isFormValid(): boolean {
    return !!(
      this.appointmentForm.patientId &&
      this.appointmentForm.doctorId &&
      this.appointmentForm.date &&
      this.appointmentForm.time &&
      this.appointmentForm.duration > 0
    );
  }

  cancel(): void {
    this.router.navigate(["/appointments"]);
  }

  getDoctorName(doctorId: string): string {
    if (!doctorId) return "";
    // Find the doctor from the doctors$ observable
    let doctorName = "";
    this.doctors$.subscribe((doctors) => {
      const doctor = doctors.find((d) => d.id === doctorId);
      if (doctor) {
        doctorName = `Dr. ${doctor.firstName} ${doctor.lastName}`;
      }
    });
    return doctorName;
  }

  getPatientName(patientId: string): string {
    if (!patientId) return "";
    // Find the patient from the patients$ observable
    let patientName = "";
    this.patients$.subscribe((patients) => {
      const patient = patients.find((p) => p.id === patientId);
      if (patient) {
        patientName = `${patient.user.firstName} ${patient.user.lastName}`;
      }
    });
    return patientName;
  }

  getCurrentDoctorName(): string {
    const currentDoctor = this.authService.getCurrentDoctor();
    return currentDoctor ? currentDoctor.name : "Current Doctor";
  }

  loadAppointmentForEdit(appointmentId: string): void {
    this.isEditing = true;
    this.editingAppointmentId = appointmentId;

    // Load the appointment data
    this.appointmentService.getAppointmentById(appointmentId).subscribe({
      next: (appointment) => {
        this.appointmentForm = {
          patientId: appointment.patientId,
          doctorId: appointment.doctorId,
          date: new Date(appointment.date).toISOString().split("T")[0],
          time: new Date(appointment.date).toTimeString().slice(0, 5),
          duration: appointment.duration,
          type: appointment.type,
          notes: appointment.notes || "",
        };

        // Load available time slots for the selected date and doctor
        this.loadAvailableTimeSlots();
      },
      error: (error: any) => {
        console.error("Error loading appointment:", error);
        // Navigate back to appointments list on error
        this.router.navigate(["/appointments"]);
      },
    });
  }
}
