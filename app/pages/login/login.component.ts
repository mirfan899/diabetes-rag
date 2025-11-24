import { Component } from "@angular/core";
import { Router } from "@angular/router";
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from "@angular/forms";
import { CommonModule } from "@angular/common";
import { AuthService } from "../../services/auth.service";
import { EulaPopupComponent } from "../../shared/components/eula-popup/eula-popup.component";

@Component({
  selector: "app-login",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, EulaPopupComponent],
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.scss"],
})
export class LoginComponent {
  showDoctorLogin = false;
  isSignup = false;
  isLoading = false;
  error = "";
  showEulaPopup = false;
  isEmailLogin = false;
  doctorForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {
    this.doctorForm = this.fb.group({
      name: [""],
      identifier: ["", [Validators.required]],
      password: ["", Validators.required],
    });
  }

  ngOnInit() {
    this.updateValidators();
  }

  detectInputType(event: any) {
    const value = event.target.value;
    // Simple detection: if it contains @, treat as email, otherwise as phone
    this.isEmailLogin = value.includes("@");
    this.updateValidators();
  }

  updateValidators() {
    const nameControl = this.doctorForm.get("name");
    const identifierControl = this.doctorForm.get("identifier");

    if (this.isSignup) {
      nameControl?.setValidators([Validators.required]);
      // For signup, we need to be more flexible with validation
      identifierControl?.setValidators([
        Validators.required,
        // Use a custom validator that accepts both email and phone
        this.emailOrPhoneValidator(),
      ]);
    } else {
      nameControl?.clearValidators();
      identifierControl?.setValidators([
        Validators.required,
        this.emailOrPhoneValidator(),
      ]);
    }

    nameControl?.updateValueAndValidity();
    identifierControl?.updateValueAndValidity();
  }

  private emailOrPhoneValidator() {
    return (control: any) => {
      const value = control.value;
      if (!value) return null;

      // Check if it's a valid email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(value)) {
        return null; // Valid email
      }

      // Check if it's a valid phone number
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      if (phoneRegex.test(value)) {
        return null; // Valid phone
      }

      return { invalidFormat: true }; // Invalid format
    };
  }

  ngDoCheck() {
    this.updateValidators();
  }

  onSubmit() {
    if (this.doctorForm.valid) {
      this.isLoading = true;
      this.error = "";

      if (this.isSignup) {
        const formData = this.doctorForm.value;
        const signupData = {
          firstName: formData.name.split(" ")[0] || formData.name,
          lastName: formData.name.split(" ").slice(1).join(" ") || "",
          fullName: formData.name,
          email: this.isEmailLogin ? formData.identifier : "",
          password: formData.password,
          phoneNumber: this.isEmailLogin ? "" : formData.identifier,
          specialization: "General Medicine", // Default specialization
          gender: "Not specified",
        };

        this.authService.signup(signupData).subscribe({
          next: () => {
            this.isLoading = false;
            if (this.authService.isEulaAccepted()) {
              this.router.navigate(["/dashboard"]);
            } else {
              this.showEulaPopup = true;
            }
          },
          error: (err: any) => {
            this.isLoading = false;
            this.error =
              err.error?.message || "Signup failed. Please try again.";
          },
        });
      } else {
        const { identifier, password } = this.doctorForm.value;
        this.authService
          .login(identifier, password, this.isEmailLogin)
          .subscribe({
            next: () => {
              this.isLoading = false;
              if (this.authService.isEulaAccepted()) {
                this.router.navigate(["/dashboard"]);
              } else {
                this.showEulaPopup = true;
              }
            },
            error: (err: any) => {
              this.isLoading = false;
              this.error =
                err.error?.message ||
                "Login failed. Please check your credentials.";
            },
          });
      }
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched() {
    Object.keys(this.doctorForm.controls).forEach((key) => {
      const control = this.doctorForm.get(key);
      control?.markAsTouched();
    });
  }

  onEulaAgree() {
    this.authService.setEulaAccepted();
    this.showEulaPopup = false;
    this.router.navigate(["/dashboard"]);
  }

  onEulaCancel() {
    this.showEulaPopup = false;
    this.authService.logout();
  }
}
