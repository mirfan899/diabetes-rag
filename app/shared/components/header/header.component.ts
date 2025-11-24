import {
  Component,
  EventEmitter,
  Output,
  OnInit,
  HostListener,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router } from "@angular/router";
import { Observable } from "rxjs";
import { AuthService } from "../../../services/auth.service";
import { AppointmentService } from "../../../services/appointment.service";
import { AvatarComponent } from "../avatar/avatar.component";
import { AppointmentWithDetails } from "../../../models";

@Component({
  selector: "app-header",
  standalone: true,
  imports: [CommonModule, AvatarComponent],
  templateUrl: "./header.component.html",
  styleUrls: ["./header.component.scss"],
})
export class HeaderComponent implements OnInit {
  getFirstName(name: string | undefined): string {
    if (!name) return "";
    return name.split(" ")[0] || "";
  }

  getLastName(name: string | undefined): string {
    if (!name) return "";
    const parts = name.split(" ");
    return parts.length > 1 ? parts[parts.length - 1] : "";
  }
  @Output() sidebarToggle = new EventEmitter<void>();

  currentDoctor: any = null;
  showUserMenu = false;
  showNotifications = false;
  upcomingAppointments$: Observable<AppointmentWithDetails[]> | null = null;
  appointmentCount = 0;

  constructor(
    private authService: AuthService,
    private router: Router,
    private appointmentService: AppointmentService
  ) {}

  ngOnInit() {
    this.authService.currentDoctor$.subscribe((doctor) => {
      this.currentDoctor = doctor;
      if (doctor) {
        this.loadUpcomingAppointments();
      }
    });
  }

  loadUpcomingAppointments() {
    this.upcomingAppointments$ =
      this.appointmentService.getUpcomingAppointments();
    this.upcomingAppointments$.subscribe((appointments) => {
      this.appointmentCount = appointments.length;
    });
  }

  @HostListener("document:click", ["$event"])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest(".user-profile")) {
      this.showUserMenu = false;
    }
    if (
      !target.closest(".notification-badge") &&
      !target.closest(".notifications-dropdown")
    ) {
      this.showNotifications = false;
    }
  }

  toggleSidebar() {
    this.sidebarToggle.emit();
  }

  toggleUserMenu(event: Event) {
    event.stopPropagation();
    this.showUserMenu = !this.showUserMenu;
  }

  toggleNotifications(event: Event) {
    event.stopPropagation();
    this.showNotifications = !this.showNotifications;
  }

  formatAppointmentTime(date: Date): string {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }

  formatAppointmentDate(date: Date): string {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }

  navigateToAppointment(appointmentId: string) {
    this.router.navigate(["/appointments", appointmentId]);
    this.showNotifications = false;
  }

  navigateToProfile() {
    if (this.currentDoctor?.id) {
      this.router.navigate(["/doctors", this.currentDoctor.id]);
    }
    this.showUserMenu = false;
  }

  navigateToSettings() {
    // TODO: Navigate to settings page
    console.log("Navigate to settings");
    this.showUserMenu = false;
  }

  navigateToAppointments() {
    this.router.navigate(["/appointments"]);
    this.showUserMenu = false;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(["/login"]);
    this.showUserMenu = false;
  }
}
