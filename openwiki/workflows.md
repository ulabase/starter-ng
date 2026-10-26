---
type: Workflow
title: Key User Workflows
description: Step-by-step flows for signup, login, OAuth, email verification, password reset, team invitations, team management, account management, and the consents gate acceptance flow.
tags: [workflows, auth, teams, invitations, consents]
sources:
  - id: openwiki-source-1b6b17b8afa47babcf26380f
    resource: repo://src/app/app.config.ts
  - id: openwiki-source-d3086358408fd7acf5360013
    resource: repo://src/app/app.html
  - id: openwiki-source-407c70ba325b6f9e6aa4707e
    resource: repo://src/app/app.routes.ts
  - id: openwiki-source-533e7761316e2fac327194b8
    resource: repo://src/app/app.ts
  - id: openwiki-source-4ccad2ecb9cb8ac59e327578
    resource: repo://src/app/consents-gate.html
  - id: openwiki-source-76b992238575041d25a8d7ba
    resource: repo://src/app/consents-gate.ts
  - id: openwiki-source-3629f9e95f35cf558c779f38
    resource: repo://src/app/consents.ts
  - id: openwiki-source-04a212cd84ffc1653fb72e76
    resource: repo://src/app/just-signed-up.ts
  - id: openwiki-source-70c667e2c44ccbc805a4be66
    resource: repo://src/app/oauth-url.ts
  - id: openwiki-source-18e26fe2b93aaf5a2892ec49
    resource: repo://src/app/pages/account/account.ts
  - id: openwiki-source-c848f08590912d99d95967d9
    resource: repo://src/app/pages/auth/forgot-password/forgot-password.ts
  - id: openwiki-source-136a04e418a9969c28b1c30f
    resource: repo://src/app/pages/auth/login/login.ts
  - id: openwiki-source-1153b336967cba65b87d1df6
    resource: repo://src/app/pages/auth/oauth-buttons/oauth-buttons.ts
  - id: openwiki-source-de882d521845822887c56b3b
    resource: repo://src/app/pages/auth/reset-password/reset-password.ts
  - id: openwiki-source-cc2a121090704e17ef477a1b
    resource: repo://src/app/pages/auth/signup/signup.ts
  - id: openwiki-source-3815a7c2c47aef567cc71dbc
    resource: repo://src/app/pages/auth/verify/verify.ts
  - id: openwiki-source-0c503ef6a22fe483e758a9db
    resource: repo://src/app/pages/invitations/accept/accept.ts
  - id: openwiki-source-0980df84d522a6755217a044
    resource: repo://src/app/pages/shell/shell.html
  - id: openwiki-source-9fd5be7b4a86f1a62c53cab3
    resource: repo://src/app/pages/shell/shell.ts
  - id: openwiki-source-18c6764cc67ac87370b274d4
    resource: repo://src/app/pages/teams/detail/team-detail.html
  - id: openwiki-source-a0abfed3f48fb645e980c9ea
    resource: repo://src/app/pages/teams/detail/team-detail.ts
  - id: openwiki-source-b3a716361f88bb3ea09515bc
    resource: repo://src/app/pages/teams/new/new-team.ts
  - id: openwiki-source-15a66680fea3945936cdfe8f
    resource: repo://src/app/pages/teams/teams.ts
generated: { by: "openwiki/0.7.2", at: "2026-10-19T08:21:09.342Z" }
---

# Key User Workflows

## Signup & email verification

```mermaid
sequenceDiagram
    participant User as User
    participant Signup as Signup Component
    participant Auth as RhAuthService
    participant Backend as Ulabase Backend
    participant Verify as Verify Component
    participant App as App Component

    User->>Signup: Fill form name email password
    Signup->>Auth: register teamName firstName lastName email password
    Auth->>Backend: POST auth register
    Backend-->>Auth: 202 Accepted
    Auth-->>Signup: Registration successful
    Signup-->>User: Show Check your email confirmation

    Note over User: User clicks verification link in email

    User->>Verify: auth verify email token
    Verify->>Auth: verify email token
    Auth->>Backend: POST auth verify
    Backend-->>Auth: Redirect URL with access_token
    Verify->>User: Browser redirects to app with access_token

    User->>App: Page load with URL hash
    App->>App: consumeFragmentToken
    App->>Auth: setToken access_token
    App->>App: Read flow signup set justSignedUp signal
    App->>App: Clear URL via history replaceState

    App->>App: authGuard runs checkSession
    App->>Auth: Load user and teams
    Auth-->>App: User authenticated
    App-->>User: Show welcome banner in Shell
```

**Entry:** `/auth/signup` (gated by `emailRegistration` or `oauthLogin` flag)

1. User fills first name, last name, email, password (min 8 chars)
2. Component calls `auth.register({ teamName, firstName, lastName, email, password })`
3. Team name is auto-generated as `"{firstName}'s Team"` (or `"{emailPrefix}'s Team"` when first name is empty) — no UI field
4. On success: shows "Check your email" confirmation. User is **not** logged in yet.
5. User clicks verification link → backend redirects to `/auth/verify?email=...&token=...`
6. [`Verify`](../src/app/pages/auth/verify/verify.ts) component calls `auth.verify(email, token)` which returns a redirect URL
7. Browser navigates to the redirect URL with `#access_token=...` in the fragment
8. [`App`](../src/app/app.ts) consumes the fragment token via `consumeFragmentToken()`, also reads `?flow=signup` to set `justSignedUp` signal
9. `authGuard` runs `checkSession()`, user is authenticated, welcome banner appears in Shell

**Key detail:** the `?flow=signup` marker is a one-shot signal. It's set only on the redirect after a fresh signup (email verification or OAuth), consumed once by `App`, and never persisted. The welcome banner copy must not claim "email verified" because OAuth signups also trigger it.

**Change navigation:** When modifying signup flow, edit `src/app/pages/auth/signup/signup.ts` for the registration form and `src/app/pages/auth/verify/verify.ts` for email verification. Test with `ng test` and manual flows from TEST-CASES.md. Verify the welcome banner appears only for fresh signups.

## Login / logout

**Entry:** `/auth/login` (always available)

1. User enters email + password
2. Component calls `auth.login(email, password)` — this also loads teams in the same round trip
3. On success: `router.navigateByUrl('/')` → redirected to home
4. On 401: shows "Invalid email or password."
5. The login page also surfaces backend link failures: it reads `?error=...` query params (e.g. an expired verification link the backend handled directly) and shows "This link is invalid or has expired." up front
6. Logout: `auth.logout()` → redirects to `/auth/login`

**Session persistence:** after login, the token is stored in localStorage. A hard refresh preserves the session because `checkSession()` reads the stored token and fetches the user.

## OAuth (Google / GitHub)

```mermaid
sequenceDiagram
    participant User as User
    participant OAuth as OAuth Buttons
    participant Provider as Google GitHub
    participant Backend as Ulabase Backend
    participant App as App Component

    User->>OAuth: Click Continue with Google GitHub
    OAuth->>User: Navigate to apiUrl auth oauth authorize provider noauthchallenge

    User->>Provider: OAuth consent flow
    Provider->>Backend: Redirect with auth code
    Backend->>Backend: Exchange code for user info
    Backend->>User: Redirect to app with access_token

    User->>App: Page load with URL hash
    App->>App: consumeFragmentToken
    App->>App: setToken access_token
    App->>App: Clear URL via history replaceState

    Note over App: New user gets account and team created automatically
```

**Entry:** OAuth buttons on login/signup pages (gated by `oauthLogin` flag)

1. User clicks "Continue with Google/GitHub"
2. Browser navigates to `{apiUrl}/auth/oauth/authorize/{provider}?noauthchallenge`
3. Provider consent flow happens on the provider's site
4. Backend redirects back to the app with `#access_token=...` in the fragment
5. Same fragment token capture as email verification
6. A new user via OAuth gets an account + team created automatically

**`noauthchallenge` query param:** appended to the OAuth URL to skip the auth challenge step — the backend handles the full flow.

**Change navigation:** When modifying OAuth flow, edit `src/app/pages/auth/oauth-buttons/oauth-buttons.ts` for button rendering and `src/app/oauth-url.ts` for URL construction. Test with `ng test` and manual flows from TEST-CASES.md. Verify OAuth buttons appear only when `oauthLogin` flag is enabled.

## Forgot / reset password

**Entry:** `/auth/forgot-password` (gated by `passwordReset` flag)

1. User enters email
2. Component calls `auth.forgotPassword(email)`
3. API always returns 202 regardless of whether the email exists (prevents email enumeration)
4. Shows same confirmation either way: "If an account exists for that address, we sent a link" — even errors land on the same confirmation
5. User clicks reset link → arrives at `/auth/reset-password?email=...&token=...`
6. User enters new password (min 8 chars)
7. Component calls `auth.resetPassword({ email, token, password })`
8. `PATCH /auth/reset-password?delivery=body` returns `access_token` directly in the response body — no follow-up `POST /token` (this is bearer-mode delivery; same pattern used by `activate` and `switch-team`)
9. User is logged in automatically, redirected to home

## Team invitations — new user

```mermaid
sequenceDiagram
    participant User as User
    participant Accept as Accept Component
    participant Auth as RhAuthService
    participant Backend as Ulabase Backend

    User->>Accept: Open invitation link with email and token
    Accept->>Auth: getInvitation email token
    Auth->>Backend: GET invitation
    Backend-->>Auth: Invitation with isNewUser true
    Auth-->>Accept: Show set password form

    User->>Accept: Enter new password
    Accept->>Auth: activate email token password
    Auth->>Backend: PATCH auth activate delivery body
    Backend-->>Auth: access_token in response body
    Auth-->>Accept: User logged in
    Accept->>User: Redirect to home as team member
```

**Entry:** `/invitations/accept?email=...&token=...` (gated by `teamInvitations` flag)

1. [`Accept`](../src/app/pages/invitations/accept/accept.ts) component has no route guard, so the constructor calls `auth.checkSession()` when `getToken()` is truthy — this handles users returning from the consents gate who already have a token but no loaded session
2. Component calls `auth.getInvitation(email, token)` on init
3. If `invitation.isNewUser === true`: shows "Set password" form
4. User sets password → calls `auth.activate({ email, token, password })`
5. `PATCH /auth/activate?delivery=body` returns `access_token` directly
6. User is logged in and team member, redirected to home
7. **Error handling:** if `getInvitation` returns 404 and the user has a token, redirects to `/` (handles the case where a signed-in user revisits an already-accepted invitation link after consents gate reload)

## Team invitations — existing user

1. Same invitation link, but `isNewUser === false`
2. **If already logged in:** shows "Join {teamName}" with a single button → calls `auth.acceptInvite(token)`
3. **If not logged in:** shows login form → `auth.login()` then `auth.acceptInvite(token)`
4. New team appears in the team list at `/teams`

## Team switching

1. User sees team list at `/teams`
2. Active team has a "current" badge; clicking a non-active team row switches to it and navigates to the detail page
3. `auth.switchTeam(team.id)` → `POST /auth/switch-team?delivery=body` returns new token
4. Session updates immediately with the new active team — no page reload
5. While switching, a "Switching…" indicator replaces the team row actions

**Note:** the Shell header has no team switcher — team switching lives entirely on the `/teams` page. The header's avatar menu shows the active team name only (read from `auth.teams().find(t => t.active)`).

## Team management

**Entry:** `/teams/:id` (owner-only sections gated by `isOwner()`)

### Members
- Owner sees full member list with role dropdowns and remove buttons
- Role change: `auth.updateMemberRole(email, role)` — the local list is updated only after the server confirms
- Remove: confirmation step ("Remove? Yes/No") → `auth.removeMember(email)` — owners can't remove themselves (their own row shows no actions)

### Invitations
- Owner sees invite form (email + role) and pending invitations list
- Invite: `auth.invite(email, role)` — 409 shows "already a member"
- Resend: `auth.resendInvite(email)` — 5-minute cooldown with reactive countdown timer
- Cooldown uses a ticking `now` signal updated every 30s so the countdown label stays accurate in zoneless Angular

### Team settings
- Name and description form → `auth.updateTeam({ name, description })`
- Danger zone: delete team → confirmation dialog (`role="alertdialog"`) → `auth.deleteTeam()`
- Delete only works when no other members remain (backend enforces with 409)
- After successful deletion, the component reloads the team list. If remaining teams exist but none is active, it auto-switches to the first remaining team before navigating to `/teams`

### Creating a team
- **Entry:** `/teams/new` (linked from the team list's "+ New team" button)
- Form takes a team name → `auth.createTeam(teamName)` → navigates back to `/teams`

## Account management

**Entry:** `/account`

### Profile
- Loads current profile via `auth.checkSession()` on init
- Form fields: first name, last name (email is read-only)
- `auth.updateProfile({ firstName, lastName })` → writes to `profile.name`/`profile.surname`

### Change password
- `currentPassword` is intentionally **not required** at the form level — OAuth users may never have set one
- Backend verifies current password only when the account actually has one
- `auth.changePassword(currentPassword, newPassword)`
- Hint shown for OAuth users: "Leave blank if you've never set a password"

## Consents gate

```mermaid
sequenceDiagram
    participant App as App Component
    participant Auth as RhAuthService
    participant Backend as Ulabase Backend
    participant Gate as ConsentsGate
    participant User as User

    App->>Auth: checkSession on app load
    Auth->>Backend: GET users me
    Backend-->>Auth: 451 Unavailable for Legal Reasons
    Auth->>Auth: consentsOnError sets consentsBlocked true
    Auth-->>App: Session restore failed

    Note over Gate: Gate sits outside router outlet so it renders even when authGuard cancels navigation

    Gate->>User: Show overlay with ToS and Privacy Policy checkboxes
    User->>Gate: Check both boxes and click I accept
    Gate->>Auth: acceptConsents
    Auth->>Backend: POST consents accept
    Backend-->>Auth: 200 OK
    alt On auth page
        Gate->>User: window.location.assign('/')
    else On other page
        Gate->>User: window.location.reload()
    end
    User->>App: Fresh load with readable user document
    App->>Auth: checkSession succeeds
    App-->>User: Normal app renders
```

**Trigger:** A server-side Guards rule blocks every request from a user who has not accepted the current Terms of Service and Privacy Policy, responding with HTTP 451. Because `/users/me` is one of those requests, session restoration is the first thing that trips the gate.

**Entry:** automatic on session restore — no route or manual action required.

1. `provideRhAuth` is configured with `onError: consentsOnError` in `app.config.ts`
2. When any API call returns 451, `consentsOnError` sets the `consentsBlocked` signal to `true`
3. [`ConsentsGate`](../src/app/consents-gate.ts) component sits in `app.html` **outside** the `<router-outlet>` — this placement is critical because `authGuard` cancels navigation when session restore fails, so nothing inside the outlet renders
4. The overlay shows two checkboxes (Terms of Service, Privacy Policy) and an "I accept" button disabled until both are checked
5. On accept: calls `auth.acceptConsents()` — the request carries no versions; the server's permission `mergeRequest` stamps both document versions and the timestamp
6. On success: pathname-aware navigation — if on an auth page (`/auth`), `window.location.assign('/')` navigates to home; otherwise `window.location.reload()` reloads the current page, preserving in-progress flows (like invitation acceptance) rather than losing them
7. On the fresh load the user document is readable, `authGuard` passes, and the normal app renders
8. Alternative: "Sign out" button clears `consentsBlocked`, calls `auth.logout()`, and redirects to `/auth/login`

**Key invariant:** the overlay is user experience, not enforcement. Removing it with dev tools changes nothing — every request still returns 451. The rule lives on the server. Bumping document versions in the Guards rule requires no client change or redeploy.

**Change navigation:** When modifying the consents gate, edit `src/app/consents-gate.ts` for logic, `src/app/consents-gate.html` for the overlay template, and `src/app/consents.ts` for the signal and error handler. The `consentsOnError` function is registered in `src/app/app.config.ts` via `provideRhAuth`.

## Home page demo fetch

**Entry:** `/home` (authenticated)

The home page includes a "Fetch your data" section that demonstrates how to use `auth.api()` for authenticated API calls:

1. User clicks "Fetch /demo" button
2. Component calls `auth.api('/demo')` — an authenticated `fetch` wrapper that attaches the bearer token
3. Response is parsed as JSON and displayed in a code block
4. Errors are caught and displayed with appropriate messaging

**Key implementation details:**
- Uses `auth.api()` instead of `HttpClient` — simpler syntax, automatic token attachment
- Handles loading state with `demoLoading` signal
- Catches and displays errors with `demoError` signal
- Shows parsed JSON data with `demoData` signal

**To use this pattern in your own components:**
```typescript
import { RhAuthService } from '@ulabase/kit-ng';

private readonly auth = inject(RhAuthService);

fetchData() {
  this.auth.api('/your-endpoint').pipe(
    switchMap(res => res.json()),
  ).subscribe(data => this.items.set(data));
}
```

**Change navigation:** When modifying the home page demo, edit `src/app/pages/home/home.ts` for the fetch logic and `src/app/pages/home/home.html` for the template. Test with `ng serve` and verify the demo button works when connected to a Ulabase service with a `/demo` collection.

## Change navigation for workflows

### Auth flow changes
- **Start with:** `src/app/pages/auth/` for component implementations
- **Check:** `src/app/pages/auth/oauth-buttons/` for OAuth button rendering
- **Test with:** Manual flows from TEST-CASES.md
- **Important files:** `login.ts`, `signup.ts`, `verify.ts`, `forgot-password.ts`, `reset-password.ts`

### Team management changes
- **Start with:** `src/app/pages/teams/` for team list and detail components
- **Check:** `src/app/pages/invitations/accept/` for invitation acceptance flow
- **Test with:** Manual flows from TEST-CASES.md
- **Important files:** `teams.ts`, `team-detail.ts`, `accept.ts`, `new-team.ts`

### Account management changes
- **Start with:** `src/app/pages/account/account.ts` for profile and password changes
- **Check:** `src/app/app.ts` for fragment token handling (affects account creation)
- **Test with:** Manual flows from TEST-CASES.md
- **Validation:** Verify OAuth users can change password without current password

### Consents gate changes
- **Start with:** `src/app/consents-gate.ts` for overlay logic and `src/app/consents.ts` for the signal and error handler
- **Check:** `src/app/app.config.ts` where `consentsOnError` is registered with `provideRhAuth`
- **Test with:** Manual flows — trigger a 451 from the backend and verify the overlay appears, accept works, and sign-out clears the flag
