import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { Observable, of } from "rxjs";
import { SOAPNote, DialogMessage, Appointment } from "../../models";
import { SoapNoteService } from "../../services/soap-note.service";
import { AppointmentService } from "../../services/appointment.service";

@Component({
  selector: "app-soap-note",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./soap-note.component.html",
  styleUrls: ["./soap-note.component.scss"],
})
export class SoapNoteComponent implements OnInit {
  appointmentId!: string;
  appointment$!: Observable<Appointment | undefined>;
  soapNote$!: Observable<SOAPNote | undefined>;

  // Dialog state
  dialogMessages: DialogMessage[] = [];
  newMessage = "";
  currentSender: "doctor" | "patient" = "doctor";

  // SOAP fields
  subjective = "";
  objective = "";
  assessment = "";
  plan = "";

  // AI Generation
  isGeneratingPlan = false;
  generatedPlan = "";

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private soapNoteService: SoapNoteService,
    private appointmentService: AppointmentService,
  ) {}

  ngOnInit(): void {
    this.appointmentId = this.route.snapshot.paramMap.get("appointmentId")!;
    this.appointment$ = this.appointmentService.getAppointmentById(
      this.appointmentId,
    );
    this.soapNote$ = this.soapNoteService.getSoapNoteByAppointmentId(
      this.appointmentId,
    );

    // Load existing dialog messages
    this.loadDialogMessages();
  }

  loadDialogMessages(): void {
    // Mock dialog messages for demo
    this.dialogMessages = [
      {
        id: "1",
        sender: "doctor",
        message: "Good morning! How are you feeling today?",
        timestamp: new Date(Date.now() - 10 * 60 * 1000),
        type: "text",
      },
      {
        id: "2",
        sender: "patient",
        message: "I've been having some chest pain and shortness of breath.",
        timestamp: new Date(Date.now() - 9 * 60 * 1000),
        type: "text",
      },
      {
        id: "3",
        sender: "doctor",
        message: "When did this start? Can you describe the pain?",
        timestamp: new Date(Date.now() - 8 * 60 * 1000),
        type: "text",
      },
      {
        id: "4",
        sender: "patient",
        message:
          "It started about 3 days ago. It's a sharp pain, especially when I take deep breaths.",
        timestamp: new Date(Date.now() - 7 * 60 * 1000),
        type: "text",
      },
    ];
  }

  addMessage(): void {
    if (!this.newMessage.trim()) return;

    const message: DialogMessage = {
      id: Date.now().toString(),
      sender: this.currentSender,
      message: this.newMessage.trim(),
      timestamp: new Date(),
      type: "text",
    };

    this.dialogMessages.push(message);
    this.newMessage = "";

    // Force change detection
    this.dialogMessages = [...this.dialogMessages];

    console.log("Message added:", message);
    console.log("Total messages:", this.dialogMessages.length);
  }

  switchSender(): void {
    this.currentSender = this.currentSender === "doctor" ? "patient" : "doctor";
  }

  generateAIPlan(): void {
    const input =
      this.plan?.trim() ||
      this.subjective + "\n" + this.objective + "\n" + this.assessment;
    console.log("Generate AI Plan called with input:", input);
    if (!input.trim()) {
      console.log("No input provided, using dialog messages");
      const dialogText = this.dialogMessages.map((m) => m.message).join("\n");
      if (!dialogText.trim()) {
        console.log("No dialog messages either, cannot generate plan");
        return;
      }
      this.generatePlanFromText(dialogText);
      return;
    }
    this.generatePlanFromText(input);
  }

  private generatePlanFromText(input: string): void {
    this.isGeneratingPlan = true;
    console.log("Calling LLM with input:", input);
    this.soapNoteService.generateCarePlanFromInput(input).subscribe({
      next: (plan) => {
        console.log("AI Plan:", plan);
        this.generatedPlan = plan;
        this.isGeneratingPlan = false;
      },
      error: (error) => {
        console.error("Error generating plan:", error);
        this.isGeneratingPlan = false;
      },
    });
  }

  saveSoapNote(): void {
    const soapNote: Partial<SOAPNote> = {
      appointmentId: this.appointmentId,
      dialogMessages: this.dialogMessages,
      subjective: this.subjective,
      objective: this.objective,
      assessment: this.assessment,
      plan: this.plan,
      generatedPlan: this.generatedPlan,
    };

    console.log("Saving SOAP note:", soapNote);
    // In a real app, this would call the service
    alert("SOAP note saved successfully!");
  }

  formatTime(date: Date): string {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  goBack(): void {
    this.router.navigate(["/appointments"]);
  }

  onEnter(event: KeyboardEvent) {
    if (!event.shiftKey) {
      const text = this.newMessage.trim();
      this.addMessage();
      if (text) {
        this.isGeneratingPlan = true;
        this.soapNoteService.generateCarePlanFromInput(text).subscribe({
          next: (plan) => {
            console.log("AI Plan:", plan);
            this.generatedPlan = plan;
            this.isGeneratingPlan = false;
          },
          error: () => {
            this.isGeneratingPlan = false;
          },
        });
      }
      event.preventDefault();
    }
  }
}
