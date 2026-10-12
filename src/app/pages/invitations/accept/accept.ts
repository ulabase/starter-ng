import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { RhAuthService, getToken } from '@ulabase/kit-ng';
import type { Invitation } from '@ulabase/kit-ng';
import { Alert } from '../../../ui/alert/alert';

@Component({
  selector: 'app-accept',
  imports: [ReactiveFormsModule, Alert],
  templateUrl: './accept.html',
  styleUrl: './accept.css',
})
export class Accept {
  private readonly fb = inject(FormBuilder);
  protected readonly auth = inject(RhAuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly email = this.route.snapshot.queryParamMap.get('email') ?? '';
  private readonly token = this.route.snapshot.queryParamMap.get('token') ?? '';

  readonly missingParams = !this.email || !this.token;
  readonly loading = signal(!this.missingParams);
  readonly error = signal<string | null>(null);
  readonly invitation = signal<Invitation | null>(null);
  readonly done = signal(false);

  readonly newUserForm = this.fb.nonNullable.group({
    password: ['', [Validators.required, Validators.minLength(8)]],
  });
  readonly showNewUserPassword = signal(false);

  readonly loginForm = this.fb.nonNullable.group({
    password: ['', [Validators.required]],
  });
  readonly showLoginPassword = signal(false);

  constructor() {
    // the route has no guard, and the guards are what load the session: load it here, so a user
    // already signed in (back from the consents gate, say) sees "Join team", not a login form
    if (getToken()) this.auth.checkSession().subscribe({ error: () => undefined });
    if (!this.missingParams) {
      this.auth.getInvitation(this.email, this.token).subscribe({
        next: inv => {
          this.invitation.set(inv);
          this.loading.set(false);
        },
        error: (err: unknown) => {
          // a signed-in user back on a link already used (the page reloads after the consents
          // gate, once the invitation was accepted) belongs in the app, not on "invalid link"
          if ((err as { status?: number })?.status === 404 && getToken()) {
            this.router.navigateByUrl('/');
            return;
          }
          this.loading.set(false);
          this.error.set(this.messageFor(err));
        },
      });
    }
  }

  submitNewUser(): void {
    if (this.newUserForm.invalid) {
      this.newUserForm.markAllAsTouched();
      return;
    }
    const { password } = this.newUserForm.getRawValue();
    this.auth.activate({ email: this.email, token: this.token, password }).subscribe({
      next: () => this.router.navigateByUrl('/'),
      error: (err: unknown) => this.error.set(this.messageFor(err)),
    });
  }

  submitLoginAndAccept(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    const { password } = this.loginForm.getRawValue();
    this.auth.login(this.email, password).subscribe({
      next: () => this.acceptForLoggedInUser(),
      error: (err: unknown) => this.error.set(this.messageFor(err)),
    });
  }

  acceptForLoggedInUser(): void {
    this.auth.acceptInvite(this.token).subscribe({
      next: () => {
        this.done.set(true);
        setTimeout(() => this.router.navigateByUrl('/'), 1200);
      },
      error: (err: unknown) => this.error.set(this.messageFor(err)),
    });
  }

  private messageFor(err: unknown): string {
    const e = err as { status?: number; message?: string };
    if (e?.status === 404) return 'This invitation is invalid or has expired.';
    if (e?.status === 401) return 'Invalid password.';
    return e?.message ?? 'Something went wrong. Please try again.';
  }
}
