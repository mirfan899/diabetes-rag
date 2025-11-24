export type AppointmentStatus =
  | "SCHEDULED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export interface Appointment {
  id: string;
  date: string;
  status: AppointmentStatus;
  patientId: string;
  doctorId: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  soapNoteId?: string;
}

export interface AppointmentWithDetails extends Appointment {
  patientName: string;
  doctorName: string;
}

export interface AppointmentView {
  id: string;
  date: Date;
  status: AppointmentStatus;
  patientName: string;
  doctorName: string;
  notes?: string;
}
