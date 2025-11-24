import { Component, OnDestroy, HostListener, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  RouterModule,
  RouterOutlet,
  Router,
  NavigationEnd,
} from "@angular/router";
import { HeaderComponent } from "./shared/components/header/header.component";
import { SidebarComponent } from "./shared/components/sidebar/sidebar.component";
import { filter } from "rxjs/operators";
import { AuthService } from "./services/auth.service";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    RouterOutlet,
    HeaderComponent,
    SidebarComponent,
  ],
  template: `
    <div class="app-container">
      <app-header
        *ngIf="isLoggedIn"
        (sidebarToggle)="toggleSidebar()"
      ></app-header>
      <div class="main-layout" [class.with-header]="isLoggedIn">
        <app-sidebar
          *ngIf="isLoggedIn"
          [isOpen]="isSidebarOpen"
          (sidebarClose)="closeSidebar()"
        ></app-sidebar>
        <main class="content" [class.with-sidebar]="isLoggedIn">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styleUrls: ["./app.component.scss"],
})
export class AppComponent implements OnInit, OnDestroy {
  title = "GlucoPlanner";
  isSidebarOpen = false;
  isLoggedIn = false;

  constructor(
    private router: Router,
    private authService: AuthService,
  ) {
    // Close sidebar when navigating to a new route on mobile
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        if (window.innerWidth <= 768 && this.isSidebarOpen) {
          this.closeSidebar();
        }
      });
  }

  ngOnInit() {
    this.authService.currentDoctor$.subscribe((doctor) => {
      this.isLoggedIn = !!doctor;
    });
  }

  @HostListener("window:resize", ["$event"])
  onResize(event: any) {
    // Close sidebar when switching from mobile to desktop
    if (event.target.innerWidth > 768 && this.isSidebarOpen) {
      this.closeSidebar();
    }
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
    this.updateBodyScroll();
  }

  closeSidebar() {
    this.isSidebarOpen = false;
    this.updateBodyScroll();
  }

  private updateBodyScroll() {
    if (window.innerWidth <= 768) {
      if (this.isSidebarOpen) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
      }
    }
  }

  ngOnDestroy() {
    // Restore body scroll when component is destroyed
    document.body.style.overflow = "";
  }
}
