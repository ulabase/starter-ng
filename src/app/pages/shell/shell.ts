import {
  Component,
  inject,
  signal,
  ElementRef,
  HostListener,
  viewChild,
  ChangeDetectionStrategy,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { RhAuthService } from '@ulabase/kit-ng';
import { justSignedUp as justSignedUpFlag } from '../../just-signed-up';
import { ThemeService } from '../../theme.service';

@Component({
  selector: 'app-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './shell.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './shell.css',
})
export class Shell {
  private readonly router = inject(Router);
  private readonly el = inject(ElementRef);
  protected readonly auth = inject(RhAuthService);
  protected readonly theme = inject(ThemeService);

  /** Set for *any* fresh signup — email verification or OAuth — so the banner
   *  copy must not claim an email was verified. */
  protected readonly justSignedUp = signal(justSignedUpFlag());
  protected readonly menuOpen = signal(false);

  /** True while the router is resolving a route — drives the top progress bar.
   *  Lazy-loaded routes fetch a chunk, so without this the app looks frozen. */
  protected readonly navigating = signal(false);

  private readonly avatarBtn = viewChild<ElementRef<HTMLButtonElement>>('avatarBtn');
  private readonly firstMenuItem = viewChild<ElementRef<HTMLElement>>('firstMenuItem');

  constructor() {
    justSignedUpFlag.set(false);

    this.router.events.pipe(takeUntilDestroyed()).subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.navigating.set(true);
      } else if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        this.navigating.set(false);
      }
    });
  }

  protected initials(): string {
    const user = this.auth.user();
    if (!user) return '?';
    const first = user.profile?.name?.charAt(0) ?? '';
    const last = user.profile?.surname?.charAt(0) ?? '';
    const fallback = user._id?.charAt(0) ?? '?';
    return (first + last || fallback).toUpperCase();
  }

  protected displayName(): string {
    const user = this.auth.user();
    if (!user) return '';
    const fn = user.profile?.name;
    const ln = user.profile?.surname;
    if (fn || ln) return [fn, ln].filter(Boolean).join(' ');
    return user._id;
  }

  /** The account's email — Ulabase uses it as the user id. */
  protected email(): string {
    return this.auth.user()?._id ?? '';
  }

  protected activeTeamName(): string {
    const teams = this.auth.teams();
    const active = teams.find((t) => t.active);
    return active?.name ?? '';
  }

  protected toggleMenu(): void {
    this.menuOpen.update((v) => !v);
    if (this.menuOpen()) {
      // Move focus to first menu item on next tick
      setTimeout(() => this.firstMenuItem()?.nativeElement?.focus(), 0);
    }
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
    // Return focus to the avatar button
    this.avatarBtn()?.nativeElement?.focus();
  }

  protected onMenuKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.closeMenu();
    }
  }

  dismissWelcome(): void {
    this.justSignedUp.set(false);
  }

  logout(): void {
    this.closeMenu();
    // back to the public first page
    this.auth.logout().subscribe(() => this.router.navigateByUrl('/'));
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.menuOpen()) return;
    const target = event.target as Node;
    if (!this.el.nativeElement.contains(target)) {
      this.closeMenu();
    }
  }
}
