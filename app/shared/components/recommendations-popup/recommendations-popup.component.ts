import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { PatientService } from "../../../services/patient.service";

@Component({
  selector: "app-recommendations-popup",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./recommendations-popup.component.html",
  styleUrls: ["./recommendations-popup.component.scss"],
})
export class RecommendationsPopupComponent implements OnInit, OnChanges {
  @Input() appointmentId: string | null = null;
  @Input() isVisible: boolean = false;
  @Output() close = new EventEmitter<void>();

  recommendations: any = null;
  isLoading = false;
  error: string | null = null;

  // Notes editing
  isEditingNotes = false;
  editedNotes = "";
  isSavingNotes = false;

  constructor(private patientService: PatientService) {}

  ngOnInit(): void {
    if (this.appointmentId && this.isVisible) {
      this.loadRecommendations();
    }
  }

  ngOnChanges(): void {
    if (this.appointmentId && this.isVisible) {
      this.loadRecommendations();
    }
  }

  loadRecommendations(): void {
    if (!this.appointmentId) return;

    this.isLoading = true;
    this.error = null;
    this.recommendations = null;

    // TODO: Implement getRecommendationsByAppointmentId method in PatientService
    // For now, set recommendations to null to avoid errors
    this.recommendations = null;
    this.isLoading = false;
    this.error = "Recommendations feature not yet implemented";
  }

  closePopup(): void {
    this.close.emit();
  }

  formatText(text: string): string {
    if (!text) return "";
    return text
      .replace(/\n/g, "<br>")
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/•/g, "&#8226;");
  }

  formatArray(array: any): any[] {
    if (!array) return [];
    if (Array.isArray(array)) return array;
    return [array];
  }

  formatDate(date: string | Date): string {
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  getMedicineReason(medicine: any): string {
    if (!medicine.reason) return "";
    if (Array.isArray(medicine.reason)) {
      return medicine.reason.join(", ");
    }
    return medicine.reason;
  }

  startEditingNotes(): void {
    this.isEditingNotes = true;
    this.editedNotes = this.recommendations?.notes || "";
  }

  cancelEditingNotes(): void {
    this.isEditingNotes = false;
    this.editedNotes = "";
  }

  saveNotes(): void {
    if (!this.recommendations?.id) return;

    this.isSavingNotes = true;

    // TODO: Implement updateRecommendationNotes method in PatientService
    // For now, simulate saving
    setTimeout(() => {
      this.recommendations.notes = this.editedNotes;
      this.isEditingNotes = false;
      this.isSavingNotes = false;
      console.log("Notes saved successfully (simulated)");
    }, 500);
  }
}
