import { Component, inject, signal } from '@angular/core';
import { RhAuthService } from '@ulabase/kit-ng';
import { consentsBlocked } from './consents';

/**
 * Covers the app with an acceptance form while the API is answering `451`.
 *
 * It sits at the root, outside the router outlet, and that placement is the
 * point: a blocked user has no session — `/users/me` is refused too — so
 * `authGuard` fails and the navigation is cancelled. Nothing inside the outlet
 * ever renders, which is exactly why the gate cannot live there.
 *
 * The overlay is user experience, not enforcement: remove it with the dev
 * tools and every request still comes back `451`. The rule lives on the server.
 */
@Component({
  selector: 'app-consents-gate',
  templateUrl: './consents-gate.html',
  styleUrl: './consents-gate.css',
})
export class ConsentsGate {
  protected readonly auth = inject(RhAuthService);
  protected readonly blocked = consentsBlocked;
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  // Two boxes because there are two documents. They gate the button and
  // nothing else: the request that follows carries no versions, and the server
  // stamps both in one go — see the permission's mergeRequest.
  protected readonly acceptedTos = signal(false);
  protected readonly acceptedPp = signal(false);

  protected accept(): void {
    this.busy.set(true);
    this.error.set(null);
    // The versions and the timestamp are stamped by the permission's
    // mergeRequest — this call states nothing about what is accepted. The user
    // id comes from the token, since the user document is exactly what we
    // cannot read yet.
    this.auth.acceptConsents().subscribe({
      next: () => {
        // A full reload rather than a router navigation: the guard already
        // cancelled the one that brought us here, and re-entering with a new
        // token and a readable user document is simpler to reason about than
        // replaying a failed navigation. It happens once, per user, ever.
        // from the login page into the app; anywhere else back to the same page, signed in, so a
        // flow under way (an invitation being accepted) is not lost on the way
        if (window.location.pathname.startsWith('/auth')) window.location.assign('/');
        else window.location.reload();
      },
      error: () => {
        this.error.set('We could not record your acceptance. Please try again.');
        this.busy.set(false);
      },
    });
  }

  protected signOut(): void {
    // Clear the flag too, or the next user to sign in on this tab meets the
    // overlay before making a single request.
    consentsBlocked.set(false);
    this.auth.logout().subscribe(() => window.location.assign('/auth/login'));
  }
}
