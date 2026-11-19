import { Routes, TitleStrategy } from '@angular/router';
import { authGuard, publicGuard } from '@ulabase/kit-ng';
import { Title } from '@angular/platform-browser';
import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';

const APP_TITLE_SUFFIX = 'Ulabase Starter';

@Injectable({ providedIn: 'root' })
export class AppTitleStrategy extends TitleStrategy {
  constructor(private readonly title: Title) {
    super();
  }

  override updateTitle(snapshot: import('@angular/router').RouterStateSnapshot): void {
    const title = this.buildTitle(snapshot);
    this.title.setTitle(title ? `${title} · ${APP_TITLE_SUFFIX}` : APP_TITLE_SUFFIX);
  }
}

const { emailRegistration, passwordReset, oauthLogin, teamInvitations } = environment.features;

export const routes: Routes = [
  {
    path: 'auth/login',
    title: 'Log in',
    canActivate: [publicGuard],
    loadComponent: () => import('./pages/auth/login/login').then(m => m.Login),
  },
  ...(emailRegistration || oauthLogin
    ? [
        {
          path: 'auth/signup',
          title: 'Create an account',
          canActivate: [publicGuard],
          loadComponent: () => import('./pages/auth/signup/signup').then(m => m.Signup),
        },
      ]
    : []),
  ...(emailRegistration
    ? [
        {
          path: 'auth/verify',
          title: 'Verifying your email',
          canActivate: [publicGuard],
          loadComponent: () => import('./pages/auth/verify/verify').then(m => m.Verify),
        },
      ]
    : []),
  ...(passwordReset
    ? [
        {
          path: 'auth/forgot-password',
          title: 'Forgot password',
          canActivate: [publicGuard],
          loadComponent: () =>
            import('./pages/auth/forgot-password/forgot-password').then(m => m.ForgotPassword),
        },
        {
          path: 'auth/reset-password',
          title: 'Set a new password',
          canActivate: [publicGuard],
          loadComponent: () =>
            import('./pages/auth/reset-password/reset-password').then(m => m.ResetPassword),
        },
      ]
    : []),
  ...(teamInvitations
    ? [
        // One page, two paths: the service's invitation email links a new user
        // to /auth/activate and an existing one to /invitations/accept. No guard
        // on either: the invitee may be signed out or have no account yet.
        ...['auth/activate', 'invitations/accept'].map(path => ({
          path,
          title: 'Accept invitation',
          loadComponent: () =>
            import('./pages/invitations/accept/accept').then(m => m.Accept),
        })),
      ]
    : []),
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/shell/shell').then(m => m.Shell),
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      {
        path: 'home',
        title: 'Home',
        loadComponent: () => import('./pages/home/home').then(m => m.Home),
      },
      {
        path: 'teams',
        title: 'Teams',
        loadComponent: () => import('./pages/teams/teams').then(m => m.Teams),
      },
      {
        path: 'teams/new',
        title: 'New team',
        loadComponent: () => import('./pages/teams/new/new-team').then(m => m.NewTeam),
      },
      {
        path: 'teams/:id',
        title: 'Team',
        loadComponent: () => import('./pages/teams/detail/team-detail').then(m => m.TeamDetail),
      },
      {
        path: 'account',
        title: 'Account',
        loadComponent: () => import('./pages/account/account').then(m => m.Account),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
