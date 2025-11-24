import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router, ActivatedRoute } from "@angular/router";
import { Observable, of } from "rxjs";
import { Doctor } from "../../models";
import { DoctorService } from "../../services/doctor.service";
import { AvatarComponent } from "../../shared/components/avatar/avatar.component";

@Component({
  selector: "app-doctor-view",
  standalone: true,
  imports: [CommonModule, AvatarComponent],
  templateUrl: "./doctor-view.component.html",
  styleUrls: ["./doctor-view.component.scss"],
})
export class DoctorViewComponent implements OnInit {
  doctorId!: string;
  doctor$!: Observable<Doctor | undefined>;
  isLoading = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private doctorService: DoctorService
  ) {}

  ngOnInit(): void {
    this.doctorId = this.route.snapshot.paramMap.get("id")!;
    if (this.doctorId) {
      this.loadDoctor();
    }
  }

  loadDoctor(): void {
    this.isLoading = true;
    this.doctorService.getDoctorById(this.doctorId).subscribe({
      next: (doctor) => {
        this.doctor$ = of(doctor);
        this.isLoading = false;
      },
      error: (error) => {
        console.error("Error loading doctor:", error);
        this.isLoading = false;
      },
    });
  }

  editDoctor(): void {
    this.router.navigate(["/doctors", this.doctorId, "edit"]);
  }

  scheduleAppointment(): void {
    this.router.navigate(["/appointments/new"], {
      queryParams: { doctorId: this.doctorId },
    });
  }

  viewAppointments(): void {
    this.router.navigate(["/appointments"], {
      queryParams: { doctorId: this.doctorId },
    });
  }

  formatDate(date: Date | string): string {
    if (!date) return "Not specified";
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
}
