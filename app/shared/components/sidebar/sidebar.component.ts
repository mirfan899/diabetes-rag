import { Component, Input, Output, EventEmitter, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule, Router } from "@angular/router";
import { AuthService } from "../../../services/auth.service";

interface NavItem {
  label: string;
  icon: string;
  route: string;
  badge?: number;
}

@Component({
  selector: "app-sidebar",
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: "./sidebar.component.html",
  styleUrls: ["./sidebar.component.scss"],
})
export class SidebarComponent implements OnInit {
  @Input() isOpen: boolean = false;
  @Output() sidebarClose = new EventEmitter<void>();

  currentDoctor: any = null;

  mainNavItems: NavItem[] = [
    {
      label: "Dashboard",
      icon: "fa-chart-line",
      route: "/dashboard",
    },
    {
      label: "Appointments",
      icon: "fa-calendar-alt",
      route: "/appointments",
    },
    // {
    //   label: "ADA Prescription",
    //   icon: "fa-prescription-bottle-alt",
    //   route: "/ada-prescription",
    // },
  ];

  managementNavItems: NavItem[] = [
    {
      label: "My Profile",
      icon: "fa-user-md",
      route: "/doctors", // Will be updated dynamically
    },
    {
      label: "Patients",
      icon: "fa-users",
      route: "/patients",
    },
  ];

  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit() {
    this.authService.currentDoctor$.subscribe((doctor: any) => {
      this.currentDoctor = doctor;
      if (doctor?.id) {
        // Update the My Profile route to point to the current doctor's profile
        this.managementNavItems[0].route = `/doctors/${doctor.id}`;
      }
    });
  }

  closeSidebar() {
    this.sidebarClose.emit();
  }
}
