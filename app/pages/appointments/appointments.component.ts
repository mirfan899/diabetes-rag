import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { Observable, map } from "rxjs";
import { AppointmentService } from "../../services/appointment.service";
import { AppointmentView, AppointmentStatus } from "../../models";
import { AuthService } from "../../services/auth.service";

@Component({
  selector: "app-appointments",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./appointments.component.html",
  styleUrls: ["./appointments.component.scss"],
})
export class AppointmentsComponent implements OnInit {
  allAppointments$: Observable<AppointmentView[]>;
  filteredAppointments$: Observable<AppointmentView[]>;
  paginatedAppointments$: Observable<AppointmentView[]>;
  searchQuery = "";
  selectedStatus: AppointmentStatus | "All" = "All";
  selectedDate = "";
  statusOptions: (AppointmentStatus | "All")[] = [
    "All",
    "SCHEDULED",
    "CONFIRMED",
    "IN_PROGRESS",
    "COMPLETED",
    "CANCELLED",
    "NO_SHOW",
  ];

  // Pagination properties
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  totalPages = 0;

  // Make Math available in template
  Math = Math;

  constructor(
    private appointmentService: AppointmentService,
    private router: Router,
    private authService: AuthService
  ) {
    // Get appointments filtered by current doctor
    const currentDoctor = this.authService.getCurrentDoctor();
    if (currentDoctor?.doctorId) {
      this.allAppointments$ =
        this.appointmentService.getAppointmentViewsByDoctor(
          currentDoctor.doctorId
        );
    } else {
      this.allAppointments$ = this.appointmentService.getAppointmentViews();
    }
    this.filteredAppointments$ = this.allAppointments$;
    this.paginatedAppointments$ = this.allAppointments$;
  }

  ngOnInit(): void {
    // Don't set a default date - show all appointments initially
    this.selectedDate = "";
    this.applyFilters();
  }

  onSearch(): void {
    this.applyFilters();
  }

  onStatusChange(): void {
    this.applyFilters();
  }

  onDateChange(): void {
    this.applyFilters();
  }

  private applyFilters(): void {
    this.filteredAppointments$ = this.allAppointments$.pipe(
      map((appointments) => {
        let filtered = appointments;

        // Filter by status
        if (this.selectedStatus !== "All") {
          filtered = filtered.filter(
            (appointment) => appointment.status === this.selectedStatus
          );
        }

        // Filter by date
        if (this.selectedDate) {
          const selectedDateObj = new Date(this.selectedDate);
          filtered = filtered.filter((appointment) => {
            const appointmentDate = new Date(appointment.date);
            return (
              appointmentDate.toDateString() === selectedDateObj.toDateString()
            );
          });
        }

        // Filter by search query
        if (this.searchQuery && this.searchQuery.trim()) {
          const query = this.searchQuery.toLowerCase().trim();
          filtered = filtered.filter((appointment) => {
            const patientName = appointment.patientName?.toLowerCase() || "";
            const appointmentType = appointment.type?.toLowerCase() || "";

            return (
              patientName.includes(query) || appointmentType.includes(query)
            );
          });
        }

        // Update pagination info
        this.totalItems = filtered.length;
        this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);

        // Reset to first page if current page is beyond total pages
        if (this.currentPage > this.totalPages && this.totalPages > 0) {
          this.currentPage = 1;
        }

        return filtered;
      })
    );

    // Apply pagination
    this.applyPagination();
  }

  private applyPagination(): void {
    this.paginatedAppointments$ = this.filteredAppointments$.pipe(
      map((appointments) => {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        return appointments.slice(startIndex, endIndex);
      })
    );
  }

  viewAppointmentDetails(appointmentId: string): void {
    this.router.navigate(["/appointments/" + appointmentId]);
  }

  openPrescriptionForm(patientId: string, appointmentId: string): void {
    this.router.navigate(["/prescription-form"], {
      queryParams: {
        patientId: patientId,
        appointmentId: appointmentId,
      },
    });
  }

  scheduleNewAppointment(): void {
    this.router.navigate(["/appointments/new"]);
  }

  updateAppointmentStatus(
    appointmentId: string,
    status: AppointmentStatus
  ): void {
    // In a real app, this would call the service
    console.log("Update appointment status:", appointmentId, status);
  }

  editAppointment(appointmentId: string): void {
    this.router.navigate(["/appointments/new"], {
      queryParams: { editId: appointmentId },
    });
  }

  deleteAppointment(appointmentId: string): void {
    if (confirm("Are you sure you want to delete this appointment?")) {
      this.appointmentService.deleteAppointment(appointmentId).subscribe({
        next: () => {
          console.log("Appointment deleted successfully");
          // The appointments list will automatically update due to the service's BehaviorSubject
        },
        error: (error: any) => {
          console.error("Error deleting appointment:", error);
          alert("Failed to delete appointment. Please try again.");
        },
      });
    }
  }

  getStatusClass(status: AppointmentStatus): string {
    const statusClasses: Record<AppointmentStatus, string> = {
      SCHEDULED: "scheduled",
      CONFIRMED: "confirmed",
      IN_PROGRESS: "in-progress",
      COMPLETED: "completed",
      CANCELLED: "cancelled",
      NO_SHOW: "no-show",
    };
    return statusClasses[status] || "scheduled";
  }

  formatTime(date: Date): string {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }

  isToday(date: Date): boolean {
    const today = new Date();
    const appointmentDate = new Date(date);
    return today.toDateString() === appointmentDate.toDateString();
  }

  isUpcoming(date: Date): boolean {
    const now = new Date();
    return new Date(date) > now;
  }

  // Pagination methods
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.applyPagination();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.applyPagination();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.applyPagination();
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(
      1,
      this.currentPage - Math.floor(maxVisiblePages / 2)
    );
    let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }

  onItemsPerPageChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }
}
