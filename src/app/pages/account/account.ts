import {
  Component,
  OnInit,
  computed,
  inject,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RhAuthService } from '@ulabase/kit-ng';
import { Alert } from '../../ui/alert/alert';

/**
 * `socialAuths` is present in the raw `/users/me` response (restheart-cloud-server's
 * AmISignedIn strips `password`/`otp`/tokens but not this) — it's just not declared on
 * `@ulabase/kit`'s `UserInfo` type. Augmented locally here instead of changing
 * the shared kit package for a single field used by only this page.
 */
interface UserWithSocialAuths {
  socialAuths?: Array<{ provider: string }>;
}

@Component({
  selector: 'app-account',
  imports: [ReactiveFormsModule, Alert],
  templateUrl: './account.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './account.css',
})
export class Account implements OnInit {
  private readonly fb = inject(FormBuilder);
  protected readonly auth = inject(RhAuthService);

  // ── Profile ────────────────────────────────────────────────────────────
  protected readonly profileForm = this.fb.nonNullable.group({
    firstName: [{ value: '', disabled: true }, [Validators.required]],
    lastName: [{ value: '', disabled: true }, [Validators.required]],
  });
  protected readonly profileLoading = signal(true);
  protected readonly profileSaving = signal(false);
  protected readonly profileSaved = signal(false);
  protected readonly profileError = signal<string | null>(null);

  // ── Change password ───────────────────────────────────────────────────
  // currentPassword is intentionally NOT required at the form level: accounts
  // that signed up via OAuth may never have set one. The backend only verifies
  // it when the account actually has a password (PATCH /auth/change-password),
  // so leaving it blank is valid for those accounts and correctly rejected as
  // "Invalid current password" for everyone else.
  protected readonly passwordForm = this.fb.nonNullable.group({
    currentPassword: [''],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
  });
  protected readonly passwordSaving = signal(false);
  protected readonly passwordSaved = signal(false);
  protected readonly passwordError = signal<string | null>(null);
  protected readonly showCurrentPassword = signal(false);
  protected readonly showNewPassword = signal(false);
  // True only for accounts linked to at least one OAuth provider — used solely to
  // show a hint that current-password may never have been set. See UserWithSocialAuths above.
  protected readonly isOAuthUser = computed(() => {
    const socialAuths = (this.auth.user() as UserWithSocialAuths | null)?.socialAuths;
    return (socialAuths?.length ?? 0) > 0;
  });

  ngOnInit(): void {
    // Subscribe BEFORE patchValue so the clear-on-edit handler is in place
    // when the initial data load triggers valueChanges.
    this.profileForm.valueChanges.subscribe(() => this.profileSaved.set(false));
    this.passwordForm.valueChanges.subscribe(() => this.passwordSaved.set(false));

    this.auth.checkSession().subscribe((user) => {
      if (user) {
        this.profileForm.patchValue({
          firstName: user.profile?.name ?? '',
          lastName: user.profile?.surname ?? '',
        });
      }
      this.profileForm.enable();
      this.profileLoading.set(false);
    });
  }

  saveProfile(): void {
    if (this.profileForm.disabled || this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.profileSaving.set(true);
    this.profileError.set(null);
    this.profileSaved.set(false);

    this.auth.updateProfile(this.profileForm.getRawValue()).subscribe({
      next: () => {
        this.profileSaving.set(false);
        this.profileSaved.set(true);
        this.profileForm.markAsPristine();
      },
      error: (err: unknown) => {
        this.profileSaving.set(false);
        const e = err as { message?: string };
        this.profileError.set(e?.message ?? 'Something went wrong. Please try again.');
      },
    });
  }

  changePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.passwordSaving.set(true);
    this.passwordError.set(null);
    this.passwordSaved.set(false);
    const { currentPassword, newPassword } = this.passwordForm.getRawValue();

    this.auth.changePassword(currentPassword, newPassword).subscribe({
      next: () => {
        this.passwordSaving.set(false);
        this.passwordSaved.set(true);
        this.passwordForm.reset({ currentPassword: '', newPassword: '' });
      },
      error: (err: unknown) => {
        this.passwordSaving.set(false);
        const e = err as { message?: string };
        this.passwordError.set(e?.message ?? 'Something went wrong. Please try again.');
      },
    });
  }
}
