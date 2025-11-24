import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable, of, map } from "rxjs";
import { SOAPNote, DialogMessage } from "../models";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../environments/environment";

@Injectable({
  providedIn: "root",
})
export class SoapNoteService {
  private apiUrl = `${environment.apiUrl}/soap-notes`;
  private soapNotesSubject = new BehaviorSubject<SOAPNote[]>([]);
  public soapNotes$ = this.soapNotesSubject.asObservable();

  constructor(private http: HttpClient) {}

  getSoapNotes(): Observable<SOAPNote[]> {
    // No list endpoint in backend; return current state
    return this.soapNotes$;
  }

  getSoapNoteById(id: string): Observable<SOAPNote | undefined> {
    // Not implemented in backend
    return this.soapNotes$.pipe(map((list) => list.find((s) => s.id === id)));
  }

  getSoapNoteByAppointmentId(
    appointmentId: string
  ): Observable<SOAPNote | undefined> {
    return this.http
      .get<any>(`${this.apiUrl}/${appointmentId}`)
      .pipe(map((row) => (row ? this.mapSoapNote(row) : undefined)));
  }

  getSoapNotesByPatient(patientId: string): Observable<SOAPNote[]> {
    return this.soapNotes$.pipe(
      map((list) => list.filter((s: SOAPNote) => s.patientId === patientId))
    );
  }

  getSoapNotesByDoctor(doctorId: string): Observable<SOAPNote[]> {
    return this.soapNotes$.pipe(
      map((list) => list.filter((s: SOAPNote) => s.doctorId === doctorId))
    );
  }

  createSoapNote(
    soapNote: Omit<SOAPNote, "id" | "createdAt" | "updatedAt">
  ): Observable<SOAPNote> {
    return this.http
      .post<any>(this.apiUrl, soapNote)
      .pipe(map((row) => this.mapSoapNote(row)));
  }

  updateSoapNote(
    id: string,
    updates: Partial<SOAPNote>
  ): Observable<SOAPNote | null> {
    return this.http
      .put<any>(`${this.apiUrl}/${id}`, updates)
      .pipe(map((row) => this.mapSoapNote(row)));
  }

  addDialogMessage(
    soapNoteId: string,
    message: Omit<DialogMessage, "id">
  ): Observable<DialogMessage | null> {
    // Not supported in backend; emulate locally
    return of(null);
  }

  generateCarePlanFromInput(input: string): Observable<string> {
    return this.http
      .post<{ plan: string }>(`${this.apiUrl}/generate-plan`, { input })
      .pipe(map((resp) => resp.plan));
  }

  deleteSoapNote(id: string): Observable<boolean> {
    // Not implemented in backend
    return of(false);
  }

  private mapSoapNote(row: any): SOAPNote {
    return {
      id: row.id,
      appointmentId: row.appointmentId,
      doctorId: row.appointment?.doctorId || row.doctorId,
      patientId: row.appointment?.patientId || row.patientId,
      dialogMessages: Array.isArray(row.dialogMessages)
        ? row.dialogMessages.map((m: any, idx: number) => ({
            id: String(idx + 1),
            sender: m.role === "doctor" ? "doctor" : "patient",
            message: m.text || "",
            timestamp: new Date(),
            type: "text",
          }))
        : [],
      subjective: row.subjective || undefined,
      objective: row.objective || undefined,
      assessment: row.assessment || undefined,
      plan: row.plan || undefined,
      generatedPlan: row.generatedPlan || undefined,
      createdAt: new Date(row.createdAt || Date.now()),
      updatedAt: new Date(row.updatedAt || Date.now()),
    };
  }
}
