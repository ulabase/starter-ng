---
type: Domain Concepts
title: Domain Concepts
description: Ulabase auth model, teams, invitations, tokens, feature flags, the consents gate domain model, and the SSR/CSR boundary.
tags: [domain, auth, teams, tokens, feature-flags, consents]
sources:
  - id: openwiki-source-1b6b17b8afa47babcf26380f
    resource: repo://src/app/app.config.ts
  - id: openwiki-source-407c70ba325b6f9e6aa4707e
    resource: repo://src/app/app.routes.ts
  - id: openwiki-source-533e7761316e2fac327194b8
    resource: repo://src/app/app.ts
  - id: openwiki-source-76b992238575041d25a8d7ba
    resource: repo://src/app/consents-gate.ts
  - id: openwiki-source-3629f9e95f35cf558c779f38
    resource: repo://src/app/consents.ts
  - id: openwiki-source-04a212cd84ffc1653fb72e76
    resource: repo://src/app/just-signed-up.ts
  - id: openwiki-source-0c503ef6a22fe483e758a9db
    resource: repo://src/app/pages/invitations/accept/accept.ts
  - id: openwiki-source-9fd5be7b4a86f1a62c53cab3
    resource: repo://src/app/pages/shell/shell.ts
  - id: openwiki-source-a0abfed3f48fb645e980c9ea
    resource: repo://src/app/pages/teams/detail/team-detail.ts
  - id: openwiki-source-8a0090a686412a9b27bc6be6
    resource: repo://src/app/theme.service.ts
  - id: openwiki-source-8d236ec39d0e441a38b5d676
    resource: repo://src/environments/environment.dev.ts
  - id: openwiki-source-eaae96b81373abab97667f4f
    resource: repo://src/environments/environment.ts
  - id: openwiki-source-146419bb9b2415894a6bd677
    resource: repo://src/styles.css
  - id: openwiki-source-c1d5327fe44e08cda82fcf83
    resource: repo://ulabase.setup.consents.ts
generated: { by: "openwiki/0.7.2", at: "2026-10-19T08:21:09.342Z" }
---

# Domain Concepts

## Ulabase auth model

The starter is a frontend for [Ulabase](https://ulabase.com), a hosted backend service. The auth model:

- **Users** are identified by email (`user._id` is the email address)
- **Profile** data lives at `user.profile.name` / `user.profile.surname`
- **Teams** are multi-tenant containers. Each user belongs to one or more teams.
- **Roles** per team: `owner` or `member`. Owners can invite, remove, and manage team settings.
- **Active team** — the JWT contains a `team` claim (`{ _id, role }`). `switchTeam()` reissues the JWT with a different active team.

```mermaid
stateDiagram-v2
    [*] --> Unauthenticated
    Unauthenticated --> Authenticated: login/signup
    Authenticated --> Authenticated: switchTeam
    Authenticated --> Unauthenticated: logout or 401/expiry
    Authenticated --> ConsentsBlocked: API returns 451
    ConsentsBlocked --> Authenticated: accept consents and reload
    ConsentsBlocked --> Unauthenticated: sign out
```

*Auth model state machine: the user transitions between unauthenticated, authenticated, and consents-blocked states.*

## Authentication flow

Ulabase uses **bearer token authentication**:

1. Token is obtained via `POST /token` (login) or returned directly by activate/reset-password/switch-team endpoints (`?delivery=body`)
2. Token has a **15-minute TTL**
3. `scheduleRefresh()` silently renews at ~80% (~12 minutes) via `GET /token?renew`
4. The HTTP interceptor from `@ulabase/kit-ng` attaches the token to all API calls
5. On 401/expiry, the interceptor clears the session — next `checkSession()` returns null

**Bearer mode:** the starter uses bearer tokens (not cookies). This means:
- Token lives in localStorage (via kit)
- SSR cannot access the token — authenticated routes must be client-rendered
- Token is passed in the `Authorization: Bearer ...` header

**Authenticated API calls:** use `auth.api(endpoint)` for custom API calls to your Ulabase service. This method automatically attaches the bearer token and handles authentication errors. See [Integrations](integrations.md#ulabasekit-ng) for details and examples.

## Teams

A team has:
- `id.$oid` — MongoDB ObjectId
- `name` — human-readable name
- `description` — optional
- `role` — the current user's role (`owner` | `member`)
- `active` — whether this is the user's currently active team

**Team creation:** when a user signs up, a team is auto-created with `"{firstName}'s Team"` as the name. Additional teams can be created via `POST /auth/teams`.

**Team deletion:** only possible when no other members remain. Backend enforces with an atomic `findOneAndDelete` + `$expr` size guard — returns 409 if other members exist. After deletion, if other teams remain but none is active, the app switches to the first remaining team.

## Invitations

The invitation flow has three paths through a single page (`/invitations/accept`):

| Scenario | `isNewUser` | Auth state | Action |
|---|---|---|---|
| New user | `true` | Not logged in | Set password → `activate` |
| Existing user, logged out | `false` | Not logged in | Login → `acceptInvite` |
| Existing user, logged in | `false` | Logged in | `acceptInvite` directly |

Invitations carry `email` + `token` as query params. The token is validated by `getInvitation()`.

**Session restoration:** When `getToken()` is truthy, the Accept component calls `checkSession()` to restore the session. This ensures a user returning from the consents gate sees "Join team" instead of a login form.

**404 handling:** If `getInvitation()` returns 404 and the user is signed in (`getToken()` is truthy), the component redirects to `/`. This handles the case where a user returns to an already-accepted invitation after a consents gate reload.

**Resend cooldown:** 5 minutes. Implemented with a reactive `now` signal ticking every 30s to keep the countdown accurate in zoneless Angular.

## Feature flags

Defined in `src/environments/environment*.ts`:

```typescript
features: {
  emailRegistration: boolean,  // Registration & Verification
  passwordReset: boolean,      // Password Reset
  oauthLogin: boolean,         // OAuth Social Login
  oauthProviders: string[],    // e.g. ['google', 'github']
  teamInvitations: boolean,    // Team Invitations
}
```

**How they work:**
1. Routes are conditionally included in `app.routes.ts` based on flags
2. UI elements (links, buttons) check flags to decide visibility
3. A flag that's off removes both the route AND the UI that links to it
4. Flags must match your Ulabase service's **Sign-up Mgmt → Features** toggles — a mismatch causes 403 errors

**Default configs:**
- `environment.ts` (production): all on except `oauthLogin`
- `environment.dev.ts` (development): all on except `oauthLogin` (off until you create its OAuth client)

## Consents gate

The consents gate is a server-enforced acceptance requirement for Terms of Service (TOS) and Privacy Policy (PP). It blocks all authenticated API requests from users who have not accepted the current document versions.

### How it works

```mermaid
sequenceDiagram
    participant App as Angular App
    participant Kit as @ulabase/kit-ng
    participant Svc as Ulabase Service

    Note over App: App bootstraps, calls provideRhAuth
    Kit->>Svc: GET /users/me (session restore)
    Svc-->>Kit: 451 Unavailable For Legal Reasons
    Kit->>App: consentsOnError(451)
    App->>App: consentsBlocked = true
    Note over App: ConsentsGate overlay covers the app
    App->>Svc: PATCH /users/{userId} (accept consents)
    Svc-->>App: 200 OK
    App->>App: window.location.assign("/")
    Note over App: Full reload, session restore now succeeds
```

1. A **Guards rule** on the Ulabase service returns HTTP `451` (Unavailable For Legal Reasons) to any authenticated request from a user whose `latestConsents` does not match the current TOS and PP versions.
2. The first request the app makes on load — `GET /users/me` to restore the session — is blocked, so the user never gets a session.
3. The client-side `consentsOnError` callback (passed to `provideRhAuth` as `config.onError`) catches the `451` and sets the `consentsBlocked` signal to `true`.
4. The `ConsentsGate` component sits **outside** the router outlet in `app.html`. When `consentsBlocked` is `true`, it covers the entire app with an acceptance form.
5. The user checks two boxes (TOS and PP) and clicks Accept. The client calls `auth.acceptConsents()` — the request carries no versions; the server's permission stamps both.
6. On success, the app does a full page reload (`window.location.assign('/')`). The next session restoration succeeds because the user's `latestConsents` now matches.

### Why the gate lives outside the router

A blocked user has no session — `authGuard` fails and cancels navigation. Nothing inside the `<router-outlet>` ever renders. The gate must be placed at the root component level, outside the outlet, to be visible.

### Server-side setup

The consents gate requires four server-side documents, configured by `ulabase setup --srv <srvId> --file ulabase.setup.consents.ts`:

1. **User schema** (`userConsentsSchema`) — validates the `users` collection, adding `latestConsents` (object with `tos`, `pp`, `acceptedAt`) and `consents` (array history) fields.
2. **Collection validation** — attaches the schema to `/users`.
3. **Permission** (`userCanPatchOwnConsents`) — allows `PATCH /users/{userId}` only for the `consents` field. Its `mergeRequest` stamps the current versions and timestamp, and pushes to the `consents` history array.
4. **Guards rule** (`consentsGate`) — blocks authenticated users whose `latestConsents` does not match current versions. Excludes `/auth/*`, `/token/*`, and the acceptance PATCH itself.

The setup also configures JWT claims (see below) and ensures the Guards feature is installed.

### Version management

TOS and PP versions are defined as constants (`TOS_VERSION`, `PP_VERSION`) in `ulabase.setup.consents.ts`. All four server documents derive from these two values. To publish new terms:

1. Bump the version constants
2. Re-run `ulabase setup`
3. Every user meets the acceptance form on their next request; previous acceptances remain in the `consents` history

### JWT claims

The setup adds `latestConsents/tos` and `latestConsents/pp` to the JWT's `account-properties-claims`. The Guards rule reads these from the token, not the database, so the gate works without a database round-trip per request.

### Client-side architecture

- `consents.ts` — a plain module (not a service) exporting `consentsBlocked` signal and `consentsOnError` function. Plain module because `onError` is passed to `provideRhAuth` during injector construction, before DI is available.
- `consents-gate.ts` — the overlay component. Two checkbox signals (`acceptedTos`, `acceptedPp`) gate the Accept button. On accept, calls `auth.acceptConsents()` then performs a pathname-aware reload: if on `/auth/*`, navigates to `/`; otherwise reloads the current page. This preserves any in-progress flow (e.g., invitation acceptance). On sign-out, clears the blocked flag before redirecting.
- The gate is opt-in at the server level: if no Guards rule exists, no request is ever answered `451`, and the acceptance dialog never appears. No client-side flag is needed.

## SSR / CSR boundary

The render boundary is the authentication state:

| Zone | Render mode | Why |
|---|---|---|
| Auth pages (login, signup, verify, forgot/reset password) | Prerender or Client | Static forms can be prerendered; verify/invitations need live API |
| Authenticated shell + inner pages | Client only | Token is in-memory signal, not available during SSR |

This means:
- Auth pages have fast initial paint (prerendered HTML)
- The authenticated shell renders only after CSR hydration
- There's a brief flash between SSR and CSR for auth pages (the prerendered HTML is replaced by client-rendered HTML)

## Welcome banner

The `justSignedUp` signal (in `src/app/just-signed-up.ts`) is:
- Set to `true` by `consumeFragmentToken()` when `?flow=signup` is in the URL
- Read once by `Shell` to show the welcome banner
- Reset to `false` by `Shell`'s constructor
- Never persisted — can't reappear on later logins

**Critical:** the banner copy says "your account is ready" — it must NOT claim "email verified" because OAuth signups also trigger it (no email verification happened).

## Design token system

`src/styles.css` section 1 defines CSS custom properties:
- **Colour:** `--color-bg`, `--color-surface`, `--color-surface-sunken`, `--color-border`, `--color-border-strong`, `--color-text`, `--color-text-muted`, `--color-primary` (Ulabase amber), `--color-primary-hover`, `--color-on-primary`, `--color-link` (teal), `--color-success`, `--color-error`, `--color-error-bg`, `--color-on-error`, `--color-grid`
- **Typography:** `--font-family` (system-ui), `--font-mono` (for chrome labels), scale from `--text-xs` to `--text-2xl`, `--leading-tight`, `--leading-normal`, `--tracking-label`
- **Space:** `--space-1` through `--space-8`
- **Shape:** `--radius-sm`, `--radius`, `--radius-lg`, `--radius-pill`, `--border-width`
- **Motion & elevation:** `--transition`, `--shadow-popup`
- **Focus:** `--focus-ring-width`, `--focus-ring-offset`

Dark mode overrides these tokens under `:root.dark`. The `ThemeService` toggles the `.dark` class on `<html>` and persists to `localStorage['rh-theme']`.

## Change navigation for domain concepts

### For auth model changes
- **Start with:** `@ulabase/kit-ng` for core auth logic
- **Check:** `src/app/pages/auth/` for UI implementations
- **Test with:** Manual flows from TEST-CASES.md
- **Validation:** Auth flows work correctly, no 403 errors

### For team model changes
- **Start with:** `@ulabase/kit-ng` for team functions
- **Check:** `src/app/pages/teams/` for team management UI
- **Test with:** Manual flows from TEST-CASES.md
- **Validation:** Team switching works, team list updates correctly

### For feature flag changes
- **Start with:** `src/environments/environment.ts` and `src/environments/environment.dev.ts`
- **Check:** `src/app/app.routes.ts` for route gating
- **Test with:** `ng serve` and verify routes/UI appear/disappear
- **Validation:** Flags match your Ulabase service's **Sign-up Mgmt → Features** toggles

### For token lifecycle changes
- **Start with:** `@ulabase/kit-ng` for token management
- **Check:** `src/app/app.ts` for fragment token handling
- **Test with:** Manual flows from TEST-CASES.md
- **Validation:** Token refresh works at ~80% of 15-minute TTL

### For consents gate changes
- **Start with:** `ulabase.setup.consents.ts` for server-side configuration
- **Check:** `src/app/consents.ts` and `src/app/consents-gate.ts` for client-side logic
- **Test with:** `ulabase setup --srv <srvId> --dry-run` to verify server state
- **Validation:** Bump versions → re-run setup → user sees acceptance form → accepts → reload succeeds
