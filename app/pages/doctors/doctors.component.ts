import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { Observable } from "rxjs";
import { DoctorService } from "../../services/doctor.service";
import { AuthService } from "../../services/auth.service";
import { Doctor } from "../../models";
import { AvatarComponent } from "../../shared/components/avatar/avatar.component";

@Component({
  selector: "app-doctors",
  standalone: true,
  imports: [CommonModule, FormsModule, AvatarComponent],
  templateUrl: "./doctors.component.html",
  styleUrls: ["./doctors.component.scss"],
})
export class DoctorsComponent implements OnInit {
  currentDoctor$: Observable<any>;
  searchQuery = "";
  selectedSpecialty = "";
  specialties = [
    "All",
    "Cardiology",
    "Dermatology",
    "Neurology",
    "Pediatrics",
    "Orthopedics",
    "Internal Medicine",
  ];

  constructor(
    private doctorService: DoctorService,
    private authService: AuthService,
    private router: Router
  ) {
    // Get current logged-in doctor instead of all doctors
    this.currentDoctor$ = this.authService.currentDoctor$;
  }

  ngOnInit(): void {}

  editProfile(): void {
    const currentDoctor = this.authService.getCurrentDoctor();
    if (currentDoctor) {
      this.router.navigate(["/doctors/" + currentDoctor.id + "/edit"]);
    }
  }

  viewPatients(): void {
    this.router.navigate(["/patients"]);
  }

  viewAppointments(): void {
    this.router.navigate(["/appointments"]);
  }

  goToLogin(): void {
    this.router.navigate(["/login"]);
  }
}
