import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import {
  BehaviorSubject,
  Observable,
  catchError,
  map,
  tap,
  throwError,
} from "rxjs";
import { Doctor } from "../models";

export interface CreateDoctorDto {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  specialization: string;
  department?: string;
  experience?: number;
  avatar?: string;
  isAvailable?: boolean;
}
import { environment } from "../../environments/environment";

@Injectable({
  providedIn: "root",
})
export class DoctorService {
  private apiUrl = `${environment.apiUrl}/doctors`;
  private doctorsSubject = new BehaviorSubject<Doctor[]>([]);
  public doctors$ = this.doctorsSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadDoctors();
  }

  private loadDoctors(): void {
    this.getDoctors().subscribe((doctors) => {
      this.doctorsSubject.next(doctors);
    });
  }

  getDoctors(): Observable<Doctor[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      map((rows) => rows.map((row) => this.mapDoctor(row))),
      catchError((error) => {
        console.error("Error loading doctors:", error);
        return throwError(() => error);
      }),
    );
  }

  getDoctorById(id: string): Observable<Doctor> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map((row) => this.mapDoctor(row)),
      catchError((error) => {
        console.error(`Error loading doctor ${id}:`, error);
        return throwError(() => error);
      }),
    );
  }

  createDoctor(doctor: CreateDoctorDto): Observable<Doctor> {
    return this.http.post<Doctor>(this.apiUrl, doctor).pipe(
      tap((newDoctor) => {
        const currentDoctors = this.doctorsSubject.value;
        this.doctorsSubject.next([...currentDoctors, newDoctor]);
      }),
      catchError((error) => {
        console.error("Error creating doctor:", error);
        return throwError(() => error);
      }),
    );
  }

  updateDoctor(id: string, doctor: Partial<Doctor>): Observable<Doctor> {
    return this.http.patch<Doctor>(`${this.apiUrl}/${id}`, doctor).pipe(
      tap((updatedDoctor) => {
        const currentDoctors = this.doctorsSubject.value;
        const index = currentDoctors.findIndex((d) => d.id === id);
        if (index !== -1) {
          currentDoctors[index] = updatedDoctor;
          this.doctorsSubject.next([...currentDoctors]);
        }
      }),
      catchError((error) => {
        console.error(`Error updating doctor ${id}:`, error);
        return throwError(() => error);
      }),
    );
  }

  deleteDoctor(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        const currentDoctors = this.doctorsSubject.value;
        this.doctorsSubject.next(currentDoctors.filter((d) => d.id !== id));
      }),
      catchError((error) => {
        console.error(`Error deleting doctor ${id}:`, error);
        return throwError(() => error);
      }),
    );
  }

  private mapDoctor(row: any): Doctor {
    const firstName =
      row.user?.firstName ||
      row.firstName ||
      row.user?.fullName?.split(" ")[0] ||
      "";
    const lastName =
      row.user?.lastName ||
      row.lastName ||
      row.user?.fullName?.split(" ").slice(1).join(" ") ||
      "";
    return {
      id: row.id,
      firstName,
      lastName,
      name: `${firstName} ${lastName}`.trim(),
      specialization: row.specialization || "General Medicine",
      department: row.department || "General",
      email: row.user?.email || row.email || "",
      phoneNumber: row.user?.phoneNumber || row.phoneNumber || "",
      avatar: row.avatar,
      isAvailable: true,
      experience: row.experience || 5,
      rating: row.rating || 4.8,
      bio: row.bio,
      createdAt: new Date(row.createdAt || Date.now()),
      updatedAt: new Date(row.updatedAt || Date.now()),
    };
  }
}
