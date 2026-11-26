import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RhAuthService } from '@ulabase/kit-ng';
import { Alert } from '../../../ui/alert/alert';

@Component({
  selector: 'app-new-team',
  imports: [ReactiveFormsModule, RouterLink, Alert],
  templateUrl: './new-team.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './new-team.css',
})
export class NewTeam {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  protected readonly auth = inject(RhAuthService);

  protected readonly form = this.fb.nonNullable.group({
    teamName: ['', [Validators.required]],
  });
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  createTeam(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.error.set(null);
    const { teamName } = this.form.getRawValue();

    this.auth.createTeam(teamName).subscribe({
      next: () => {
        this.router.navigate(['/teams']);
      },
      error: (err: unknown) => {
        this.saving.set(false);
        const e = err as { message?: string };
        this.error.set(e?.message ?? 'Something went wrong. Please try again.');
      },
    });
  }
}
