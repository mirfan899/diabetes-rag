import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, BehaviorSubject } from "rxjs";
import { tap } from "rxjs/operators";
import { environment } from "../../environments/environment";

interface DoctorResponse {
  id: string;
  email: string;
  phoneNumber: string;
  name: string;
  doctorId: string;
  specialization: string;
}

@Injectable({
  providedIn: "root",
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/doctors`;
  private currentDoctorSubject = new BehaviorSubject<DoctorResponse | null>(
    null
  );
  public currentDoctor$ = this.currentDoctorSubject.asObservable();

  constructor(private http: HttpClient) {
    const storedDoctor = localStorage.getItem("currentDoctor");
    if (storedDoctor) {
      this.currentDoctorSubject.next(JSON.parse(storedDoctor));
    }
  }

  signup(data: any): Observable<DoctorResponse> {
    return this.http.post<DoctorResponse>(`${this.apiUrl}/signup`, data).pipe(
      tap((doctor) => {
        localStorage.setItem("currentDoctor", JSON.stringify(doctor));
        this.currentDoctorSubject.next(doctor);
      })
    );
  }

  login(phoneNumber: string, password: string): Observable<DoctorResponse>;
  login(email: string, password: string, isEmail: boolean): Observable<DoctorResponse>;
  login(identifier: string, password: string, isEmail?: boolean): Observable<DoctorResponse> {
    const loginData = isEmail 
      ? { email: identifier, password }
      : { phoneNumber: identifier, password };
    
    return this.http
      .post<DoctorResponse>(`${this.apiUrl}/login`, loginData)
      .pipe(
        tap((doctor) => {
          localStorage.setItem("currentDoctor", JSON.stringify(doctor));
          this.currentDoctorSubject.next(doctor);
        })
      );
  }

  setEulaAccepted(): void {
    localStorage.setItem("eulaAccepted", "true");
  }

  isEulaAccepted(): boolean {
    return localStorage.getItem("eulaAccepted") === "true";
  }

  logout(): void {
    localStorage.removeItem("currentDoctor");
    localStorage.removeItem("eulaAccepted");
    this.currentDoctorSubject.next(null);
  }

  isLoggedIn(): boolean {
    return !!this.currentDoctorSubject.value;
  }

  getCurrentDoctor(): DoctorResponse | null {
    return this.currentDoctorSubject.value;
  }
}
