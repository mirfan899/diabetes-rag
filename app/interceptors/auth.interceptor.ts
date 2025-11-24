import { Injectable } from "@angular/core";
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
} from "@angular/common/http";
import { Observable } from "rxjs";

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler,
  ): Observable<HttpEvent<unknown>> {
    // Add a default token to every request
    const defaultToken = "dummy-token-for-development";

    request = request.clone({
      setHeaders: {
        Authorization: `Bearer ${defaultToken}`,
      },
    });

    return next.handle(request);
  }
}
