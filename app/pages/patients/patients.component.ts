import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { Observable, map } from "rxjs";
import { AvatarComponent } from "../../shared/components/avatar/avatar.component";
import { PatientService } from "../../services/patient.service";
import { Patient } from "../../models";

@Component({
  selector: "app-patients",
  standalone: true,
  imports: [CommonModule, FormsModule, AvatarComponent],
  templateUrl: "./patients.component.html",
  styleUrls: ["./patients.component.scss"],
})
export class PatientsComponent implements OnInit {
  allPatients$: Observable<Patient[]>;
  filteredPatients$: Observable<Patient[]>;
  paginatedPatients$: Observable<Patient[]>;
  searchQuery = "";
  selectedStatus = "All";
  statusOptions = ["All", "Active", "Inactive"];

  // Pagination properties
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  totalPages = 0;

  // Make Math available in template
  Math = Math;

  constructor(private patientService: PatientService, private router: Router) {
    this.allPatients$ = this.patientService.getPatients();
    this.filteredPatients$ = this.allPatients$;
    this.paginatedPatients$ = this.allPatients$;
  }

  ngOnInit(): void {
    this.applyFilters();
  }

  onSearch(): void {
    this.applyFilters();
  }

  onStatusChange(): void {
    this.applyFilters();
  }

  private applyFilters(): void {
    this.filteredPatients$ = this.allPatients$.pipe(
      map((patients) => {
        let filtered = patients;

        // Filter by status
        if (this.selectedStatus !== "All") {
          if (this.selectedStatus === "Active") {
            filtered = filtered.filter(
              (patient) => patient.user.isActive === true
            );
          } else if (this.selectedStatus === "Inactive") {
            filtered = filtered.filter(
              (patient) => patient.user.isActive === false
            );
          }
        }

        // Filter by search query
        if (this.searchQuery.trim()) {
          const query = this.searchQuery.toLowerCase().trim();
          filtered = filtered.filter((patient) => {
            const fullName =
              `${patient.user.firstName} ${patient.user.lastName}`.toLowerCase();
            const phone = patient.user.phoneNumber?.toLowerCase() || "";

            return fullName.includes(query) || phone.includes(query);
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
    this.paginatedPatients$ = this.filteredPatients$.pipe(
      map((patients) => {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        return patients.slice(startIndex, endIndex);
      })
    );
  }

  viewPatientProfile(patientId: string): void {
    this.router.navigate(["/patients", patientId]);
  }

  editPatient(patientId: string): void {
    this.router.navigate(["/patients", patientId, "edit"]);
  }

  addNewPatient(): void {
    this.router.navigate(["/patients/new"]);
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

  // Helper method to convert string or array to array
  toArray(value: string[] | string | undefined): string[] {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    return [value];
  }

  scheduleAppointment(patientId: string): void {
    this.router.navigate(["/appointments/new"], {
      queryParams: { patientId },
    });
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
