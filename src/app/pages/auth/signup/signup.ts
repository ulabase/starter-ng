import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { RhAuthService } from '@ulabase/kit-ng';
import { environment } from '../../../../environments/environment';
import { OauthButtons } from '../oauth-buttons/oauth-buttons';
import { Alert } from '../../../ui/alert/alert';

@Component({
  selector: 'app-signup',
  imports: [ReactiveFormsModule, RouterLink, OauthButtons, Alert],
  templateUrl: './signup.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './signup.css',
})
export class Signup {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(RhAuthService);

  protected readonly features = environment.features;

  readonly form = this.fb.nonNullable.group({
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  readonly loading = signal(false);
  readonly showPassword = signal(false);
  readonly error = signal<string | null>(null);
  readonly submitted = signal(false);

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    const { firstName, lastName, email, password } = this.form.getRawValue();

    // restheart-accounts requires a teamName, but there's no dedicated
    // "rename team" endpoint — so rather than ask for a name upfront
    // (one more field, more friction), generate a reasonable default.
    // Users can still change it later via a direct API call if you wire
    // that up in your app.
    const teamName = firstName ? `${firstName}'s Team` : `${email.split('@')[0]}'s Team`;

    this.auth.register({ teamName, firstName, lastName, email, password }).subscribe({
      next: () => this.submitted.set(true),
      error: (err: unknown) => {
        this.loading.set(false);
        this.error.set(this.messageFor(err));
      },
    });
  }

  private messageFor(err: unknown): string {
    const e = err as { status?: number; message?: string };
    if (e?.status === 409) return 'An account with this email already exists.';
    return e?.message ?? 'Something went wrong. Please try again.';
  }
}
