import { Routes } from "@angular/router";
import { authGuard } from "./guards/auth.guard";
import { LoginGuard } from "./guards/login.guard";

export const routes: Routes = [
  {
    path: "",
    redirectTo: "dashboard",
    pathMatch: "full",
  },
  {
    path: "login",
    loadComponent: () =>
      import("./pages/login/login.component").then((c) => c.LoginComponent),
    canActivate: [LoginGuard],
  },
  {
    path: "dashboard",
    loadComponent: () =>
      import("./pages/dashboard/dashboard.component").then(
        (c) => c.DashboardComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: "doctors",
    loadComponent: () =>
      import("./pages/doctors/doctors.component").then(
        (c) => c.DoctorsComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: "doctors/new",
    loadComponent: () =>
      import("./pages/doctor-form/doctor-form.component").then(
        (c) => c.DoctorFormComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: "doctors/:id",
    loadComponent: () =>
      import("./pages/doctor-view/doctor-view.component").then(
        (c) => c.DoctorViewComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: "doctors/:id/edit",
    loadComponent: () =>
      import("./pages/doctor-form/doctor-form.component").then(
        (c) => c.DoctorFormComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: "patients",
    loadComponent: () =>
      import("./pages/patients/patients.component").then(
        (c) => c.PatientsComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: "patients/new",
    loadComponent: () =>
      import("./pages/patient-form/patient-form.component").then(
        (c) => c.PatientFormComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: "patients/:id",
    loadComponent: () =>
      import("./pages/patient-view/patient-view.component").then(
        (c) => c.PatientViewComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: "patients/:id/edit",
    loadComponent: () =>
      import("./pages/patient-form/patient-form.component").then(
        (c) => c.PatientFormComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: "appointments",
    loadComponent: () =>
      import("./pages/appointments/appointments.component").then(
        (c) => c.AppointmentsComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: "appointments/new",
    loadComponent: () =>
      import("./pages/appointment-form/appointment-form.component").then(
        (c) => c.AppointmentFormComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: "appointments/:id",
    loadComponent: () =>
      import("./pages/appointment-detail/appointment-detail.component").then(
        (c) => c.AppointmentDetailComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: "soap-notes/:appointmentId",
    loadComponent: () =>
      import("./pages/soap-note/soap-note.component").then(
        (c) => c.SoapNoteComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: "prescription-form",
    loadComponent: () =>
      import("./pages/prescription-form/prescription-form.component").then(
        (c) => c.PrescriptionFormComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: "prescriptions/new",
    loadComponent: () =>
      import("./pages/prescription-form/prescription-form.component").then(
        (c) => c.PrescriptionFormComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: "ada-prescription",
    loadComponent: () =>
      import("./pages/ada-prescription/ada-prescription.component").then(
        (c) => c.AdaPrescriptionComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: "**",
    redirectTo: "/dashboard",
  },
];
