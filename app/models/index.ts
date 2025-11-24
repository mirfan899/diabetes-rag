export type AppointmentStatus =
  | "SCHEDULED"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

export interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
  name: string; // computed property for backward compatibility
  specialization: string;
  department: string;
  email: string;
  phoneNumber: string;
  avatar?: string;
  isAvailable: boolean;
  experience: number; // years
  rating?: number; // 1-5
  bio?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Patient {
  id: string;
  userId: string;
  hospitalNo: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  bloodType?: string;
  allergies?: string[] | string;
  medicalHistory?: string[] | string;
  currentMedications?: string[] | string;
  createdAt: Date;
  updatedAt: Date;
  // User fields (from related User model)
  user: {
    id: string;
    firstName: string;
    lastName: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    dateOfBirth: Date;
    gender: "male" | "female" | "other";
    address: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
}

export interface Appointment {
  id: string;
  doctorId: string;
  patientId: string;
  date: Date;
  duration: number; // minutes
  status: AppointmentStatus;
  type: "consultation" | "follow-up" | "emergency";
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// DTO interface for creating appointments (matches backend)
export interface CreateAppointmentDto {
  patientId: string;
  doctorId: string;
  date: string;
  time: string;
  duration: number;
  type: "consultation" | "follow-up" | "emergency";
  status: AppointmentStatus;
  notes?: string;
}

export interface SOAPNote {
  id: string;
  appointmentId: string;
  doctorId: string;
  patientId: string;
  dialogMessages: DialogMessage[];
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  generatedPlan?: string; // AI-generated plan
  createdAt: Date;
  updatedAt: Date;
}

export interface DialogMessage {
  id: string;
  sender: "doctor" | "patient";
  message: string;
  timestamp: Date;
  type: "text" | "voice-transcription";
}

export interface CarePlan {
  id: string;
  soapNoteId: string;
  patientId: string;
  generatedBy: "doctor" | "ai";
  content: string;
  recommendations: string[];
  medications?: Medication[];
  followUpInstructions?: string;
  nextAppointmentSuggested?: Date;
  createdAt: Date;
}

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

// View Models for UI
export interface DoctorWithStats extends Doctor {
  totalAppointments: number;
  todaysAppointments: number;
  completedAppointments: number;
}

export interface PatientWithLastVisit extends Patient {
  lastVisit?: Date;
  totalVisits: number;
  upcomingAppointments: number;
}

export interface AppointmentView extends Appointment {
  doctorName: string;
  patientName: string;
  doctorSpecialization: string;
  patientAge: number;
  soapNote?: SOAPNote;
}

export interface AppointmentWithDetails extends Appointment {
  doctor: Doctor;
  patient: Patient;
  doctorName: string;
  patientName: string;
  doctorSpecialization: string;
  patientAge: number;
  soapNote?: SOAPNote;
}
