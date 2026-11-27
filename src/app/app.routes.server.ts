import { RenderMode, ServerRoute } from '@angular/ssr';
import { environment } from '../environments/environment';

// Must mirror the conditional routes in app.routes.ts — every entry here
// has to match an actual client route, or SSR route extraction fails.
const { emailRegistration, passwordReset, oauthLogin, teamInvitations } = environment.features;

const signupRoutes: ServerRoute[] = emailRegistration || oauthLogin
  ? [{ path: 'auth/signup', renderMode: RenderMode.Prerender }]
  : [];

const verifyRoutes: ServerRoute[] = emailRegistration
  ? [
      {
        // Calls verify() via API, then shows result — cannot be prerendered.
        
        path: 'auth/verify',
        renderMode: RenderMode.Client,
      },
    ]
  : [];

const passwordResetRoutes: ServerRoute[] = passwordReset
  ? [
      { path: 'auth/forgot-password', renderMode: RenderMode.Prerender },
      { path: 'auth/reset-password', renderMode: RenderMode.Prerender },
    ]
  : [];

const invitationRoutes: ServerRoute[] = teamInvitations
  ? // Both paths of the invitation page (see app.routes.ts). It reads the
    // invitation (live API call) and the current session on init — cannot be
    // prerendered or server-rendered on request.
    ['auth/activate', 'invitations/accept'].map(path => ({
      path,
      renderMode: RenderMode.Client as const,
    }))
  : [];

export const serverRoutes: ServerRoute[] = [
  {
    path: 'auth/login',
    renderMode: RenderMode.Prerender,
  },
  ...signupRoutes,
  ...verifyRoutes,
  ...passwordResetRoutes,
  ...invitationRoutes,
  {
    // The public first page: rendered on the server at each request, so it arrives as HTML. The
    // pages of the signed-in shell fall under '**' below: they use the token in the browser.
    path: '',
    renderMode: RenderMode.Server,
  },
  {
    path: '**',
    renderMode: RenderMode.Client,
  },
];
