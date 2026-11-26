/* ─────────────────────────────────────────────────────────────────────────
   PLACEHOLDER SHOWCASE — replace this page with your app's own content.

   It exists to present the starter itself: what is already wired up, and a
   plan for turning it into your application. Delete this whole folder
   (src/app/pages/home/) once you have your own landing screen, and point the
   `home` route in app.routes.ts at it instead.
   ───────────────────────────────────────────────────────────────────────── */

import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { JsonPipe } from '@angular/common';
import { catchError, map, of, switchMap, tap } from 'rxjs';
import { RhAuthService } from '@ulabase/kit-ng';
import { environment } from '../../../environments/environment';

/** One row in the "what's already working" list. */
interface StarterFeature {
  name: string;
  description: string;
  /** Mirrors environment.features — a disabled feature is still listed, but
   *  marked off, so the page documents both the capability and your config. */
  enabled: boolean;
  /** Live page for the feature, if it has one. `'team'` resolves to the
   *  currently active team rather than the team list. */
  target?: 'team' | 'account';
}

@Component({
  selector: 'app-home',
  imports: [RouterLink, JsonPipe],
  templateUrl: './home.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './home.css',
})
export class Home {
  protected readonly auth = inject(RhAuthService);

  protected demoData = signal<unknown[] | null>(null);
  protected demoError = signal<string | null>(null);
  protected demoLoading = signal(false);

  fetchDemo(): void {
    this.demoLoading.set(true);
    this.demoError.set(null);
    this.demoData.set(null);

    this.auth
      .api('/demo')
      .pipe(
        switchMap((res) => res.json()),
        map((json) => (Array.isArray(json) ? json : [])),
        tap((data) => {
          this.demoData.set(data);
          this.demoLoading.set(false);
        }),
        catchError((err) => {
          this.demoError.set(err.message ?? `HTTP ${err.status ?? '?'}`);
          this.demoLoading.set(false);
          return of(null);
        }),
      )
      .subscribe();
  }

  private readonly features = environment.features;

  /** Driven by environment.features so the page tells the truth about *this*
   *  deployment rather than advertising everything the starter can do. */
  protected readonly capabilities: StarterFeature[] = [
    {
      name: 'Email sign-up',
      description: 'Registration with an email verification link.',
      enabled: this.features.emailRegistration,
    },
    {
      name: 'Social login',
      description: `OAuth sign-in via ${this.features.oauthProviders.join(', ') || 'your provider'}.`,
      enabled: this.features.oauthLogin,
    },
    {
      name: 'Password reset',
      description: 'Forgot-password email and a reset form.',
      enabled: this.features.passwordReset,
    },
    {
      name: 'Team invitations',
      description: 'Invite by email — new and existing users both handled.',
      enabled: this.features.teamInvitations,
      target: 'team',
    },
    {
      name: 'Team management',
      description: 'Members, roles, team switching and settings.',
      enabled: true,
      target: 'team',
    },
    {
      name: 'Account & profile',
      description: 'Update your name and change your password.',
      enabled: true,
      target: 'account',
    },
  ];

  /** Live page for a feature. Team links go straight to the active team —
   *  memberships are already loaded by authGuard's checkSession() before this
   *  page renders; the team list is the fallback for accounts without one. */
  protected routeFor(target: 'team' | 'account'): string[] {
    if (target === 'account') return ['/account'];
    const active = this.auth.teams().find((t) => t.active);
    return active ? ['/teams', active.id.$oid] : ['/teams'];
  }

  /** First name when we have one — the greeting confirms the session works. */
  protected firstName(): string {
    return this.auth.user()?.profile?.name?.trim() ?? '';
  }
}
