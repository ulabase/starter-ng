import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { RhAuthService } from '@ulabase/kit-ng';
import { environment } from '../../../../environments/environment';
import { OauthButtons } from '../oauth-buttons/oauth-buttons';
import { Alert } from '../../../ui/alert/alert';

const ERROR_MESSAGES: Record<string, string> = {
  invalid_token: 'This link is invalid or has expired.',
  token_expired:
    'This verification link has expired. Use "Forgot password?" below to get a new link: it also verifies your email.',
};

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, OauthButtons, Alert],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(RhAuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly features = environment.features;

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  readonly loading = signal(false);
  readonly showPassword = signal(false);
  // The backend redirects here with ?error=... when a link it handled
  // directly (e.g. email verification) fails — surface that up front.
  readonly error = signal<string | null>(
    ERROR_MESSAGES[this.route.snapshot.queryParamMap.get('error') ?? ''] ?? null
  );

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    const { email, password } = this.form.getRawValue();

    this.auth.login(email, password).subscribe({
      next: () => this.router.navigateByUrl('/'),
      error: (err: unknown) => {
        this.loading.set(false);
        this.error.set(this.messageFor(err));
      },
    });
  }

  private messageFor(err: unknown): string {
    const e = err as { status?: number; message?: string };
    if (e?.status === 401) return 'Invalid email or password.';
    return e?.message ?? 'Something went wrong. Please try again.';
  }
}
