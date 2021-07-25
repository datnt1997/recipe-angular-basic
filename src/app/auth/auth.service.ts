import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { BehaviorSubject, throwError } from "rxjs";
import { catchError, tap } from "rxjs/operators";
import { User } from "./user.model";

export interface AuthResponseData {
  kind: string;
  email: string;
  refreshToken: string;
  expiresIn: string;
  localId: string;
  registered?: boolean;
  idToken: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  user = new BehaviorSubject<User>(null);
  private tokenExpirationTimer: any;
  SIGN_UP_URL = 'https://www.googleapis.com/identitytoolkit/v3/relyingparty/signupNewUser?key=AIzaSyBqNYklap-pMGToa1nGp-3AAa5iSZyR6GE';
  LOGIN_URL = 'https://www.googleapis.com/identitytoolkit/v3/relyingparty/verifyPassword?key=AIzaSyBqNYklap-pMGToa1nGp-3AAa5iSZyR6GE';

  constructor(private http: HttpClient, private router: Router) { }

  signUp(email: string, password: string) {
    return this.http.post<AuthResponseData>(this.SIGN_UP_URL, {
      email, password, returnSecureToken: true
    }).pipe(
      catchError(this.handleError),
      tap(resData => {
        const { email, localId, expiresIn, idToken } = resData;
        this.handleAuthentication(email, localId, idToken, Number(expiresIn));
      }));
  }

  login(email: string, password: string) {
    return this.http.post<AuthResponseData>(this.LOGIN_URL,
      { email, password, returnSecureToken: true }
    ).pipe(
      catchError(this.handleError),
      tap(resData => {
        const { email, localId, expiresIn, idToken } = resData;
        this.handleAuthentication(email, localId, idToken, Number(expiresIn));
      })
    );
  }

  autoLogin() {
    const userData: {
      email: string;
      id: string;
      _token: string;
      _tokenExpiration: string;
    } = JSON.parse(localStorage.getItem('userData'));
    if (!userData) {
      return;
    }

    const { email, id, _token, _tokenExpiration } = userData;
    const loadedUser = new User(email, id, _token, new Date(_tokenExpiration));

    if (loadedUser.token) {
      this.user.next(loadedUser);
      const expirationDuration = new Date(_tokenExpiration).getTime() - new Date().getTime();
      this.autoLogout(expirationDuration);
    }
  }

  logout() {
    this.user.next(null);
    this.router.navigate(['/auth']);
    localStorage.removeItem('userData');
    if(this.tokenExpirationTimer){
      clearTimeout(this.tokenExpirationTimer);
    }
    this.tokenExpirationTimer = null;
  }

  autoLogout(expirationDuration: number) {
    this.tokenExpirationTimer = setTimeout(() => {
      this.logout();
    }, expirationDuration);
  }

  private handleAuthentication(
    userId: string, email: string, token: string, expiresIn: number
  ) {
    const expirationDate = new Date(new Date().getTime() + expiresIn * 1000);
    const user = new User(email, userId, token, expirationDate);
    this.user.next(user);
    this.autoLogout(expiresIn * 1000);
    localStorage.setItem('userData', JSON.stringify(user));
  }

  private handleError(errorRes: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred!';
    if (!errorRes?.error?.error) {
      return throwError(errorMessage);
    }
    switch (errorRes.error.error.message) {
      case 'EMAIL_EXISTS':
        errorMessage = 'This email exists already';
        break;
      case 'EMAIL_NOT_FOUND':
        errorMessage = 'This email does not exist.';
        break;
      case 'INVALID_PASSWORD':
        errorMessage = 'This password is not correct.';
        break;
      default:
        break;
    }
    return throwError(errorMessage);
  }
}