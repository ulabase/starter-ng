---
type: "Reference"
title: "Source Map"
description: "File-by-file guide organized by domain, covering root configuration, environments, app bootstrap, app root, shared UI, auth pages, invitation flow, team management, account, shell, home placeholder, consents gate, setup scripts, static assets, and specs/docs."
tags: ["source-map", "reference", "angular", "ulabase", "consents"]
sources:
  - id: openwiki-source-76b992238575041d25a8d7ba
    resource: repo://src/app/consents-gate.ts
  - id: openwiki-source-3629f9e95f35cf558c779f38
    resource: repo://src/app/consents.ts
  - id: openwiki-source-0c503ef6a22fe483e758a9db
    resource: repo://src/app/pages/invitations/accept/accept.ts
  - id: openwiki-source-c1d5327fe44e08cda82fcf83
    resource: repo://ulabase.setup.consents.ts
  - id: openwiki-source-34f568b222540eb11aa44859
    resource: repo://ulabase.setup.ts
generated: { by: "openwiki/0.7.2", at: "2026-10-19T08:21:09.342Z" }
verified:
  - by: openwiki/0.7.2
    at: 2026-10-19T08:21:09.342Z
---


# Source Map

## Root configuration

| File | Purpose |
|---|---|
| [`package.json`](../package.json) | Dependencies, scripts (`ng serve`, `ng build`, `ng test`) |
| [`angular.json`](../angular.json) | Angular CLI config — build options, SSR entry, budgets |
| [`tsconfig.json`](../tsconfig.json) | TypeScript strict mode, Angular compiler options |
| [`tsconfig.app.json`](../tsconfig.app.json) | App-specific TS config |
| [`tsconfig.spec.json`](../tsconfig.spec.json) | Test-specific TS config |
| [`.editorconfig`](../.editorconfig) | 2-space indent, single quotes for TS, no trailing whitespace trim for MD |
| [`.prettierrc`](../.prettierrc) | Prettier formatting config |
| [`.gitignore`](../.gitignore) | Standard Angular ignores + `.vscode` |
| [`LICENSE`](../LICENSE) | MIT License — Copyright (c) 2026 SoftInstigate Srl SB |

## Environments

| File | Purpose |
|---|---|
| [`src/environments/environment.ts`](../src/environments/environment.ts) | Production config — `apiUrl` (empty by default) and `features` flags |
| [`src/environments/environment.dev.ts`](../src/environments/environment.dev.ts) | Development config — used by `ng serve`. Edit this for local dev. |

Both export `{ apiUrl, features }`. The `features` object controls which auth/team capabilities are enabled. See [Domain Concepts](domain-concepts.md#feature-flags).

## App bootstrap

| File | Purpose |
|---|---|
| [`src/main.ts`](../src/main.ts) | Client bootstrap — calls `bootstrapApplication(App, appConfig)` |
| [`src/main.server.ts`](../src/main.server.ts) | Server bootstrap — merges `appConfig` with server rendering config |
| [`src/server.ts`](../src/server.ts) | Express 5 SSR server — static files + Angular SSR handler. Listens on `PORT` or 4000 |
| [`src/index.html`](../src/index.html) | HTML shell |

## App root

| File | Purpose |
|---|---|
| [`src/app/app.ts`](../src/app/app.ts) | Root component — checks `apiUrl` validity, consumes fragment tokens on browser load |
| [`src/app/app.html`](../src/app/app.html) | Either `<router-outlet>` or "Connect your service" setup screen |
| [`src/app/app.config.ts`](../src/app/app.config.ts) | `provideRhAuth()`, router, hydration, title strategy |
| [`src/app/app.config.server.ts`](../src/app/app.config.server.ts) | Merges client config with `provideServerRendering()` |
| [`src/app/app.routes.ts`](../src/app/app.routes.ts) | Route map with lazy-loaded components, feature-flag gating, `AppTitleStrategy` |
| [`src/app/app.routes.server.ts`](../src/app/app.routes.server.ts) | SSR render modes per route (Prerender vs Client) |
| [`src/app/app.spec.ts`](../src/app/app.spec.ts) | Unit test — verifies `App` creates correctly with mocked auth config |
| [`src/app/just-signed-up.ts`](../src/app/just-signed-up.ts) | Global signal — `true` for one page load after fresh signup (email or OAuth) |
| [`src/app/oauth-url.ts`](../src/app/oauth-url.ts) | Builds redirect URL for `GET /auth/oauth/authorize/{provider}` |

## Shared UI

| File | Purpose |
|---|---|
| [`src/app/theme.service.ts`](../src/app/theme.service.ts) | Dark/light mode toggle, persisted to `localStorage['rh-theme']`. Only injected by Shell (client-rendered). |
| [`src/app/ui/alert/alert.ts`](../src/app/ui/alert/alert.ts) | The one shared feedback component. Renders `.success-msg`/`.form-error` hooks with correct ARIA roles. Auto-dismisses after 4s by default. |
| [`src/styles.css`](../src/styles.css) | Global stylesheet: design tokens (section 1), dark mode overrides (section 2), disposable default skin (sections 3–5). **Meant to be thrown away.** |

## Auth pages

| Directory | Component | Key behavior |
|---|---|---|
| [`src/app/pages/auth/login/`](../src/app/pages/auth/login/) | `Login` | Email/password form. Calls `auth.login()`. Shows OAuth buttons if `oauthLogin` flag is on. |
| [`src/app/pages/auth/signup/`](../src/app/pages/auth/signup/) | `Signup` | Registration form with first/last name. Calls `auth.register()` with auto-generated team name. |
| [`src/app/pages/auth/verify/`](../src/app/pages/auth/verify/) | `Verify` | Email verification — calls `auth.verify()` which returns a redirect URL with `#access_token=...`. Client-rendered only. |
| [`src/app/pages/auth/forgot-password/`](../src/app/pages/auth/forgot-password/) | `ForgotPassword` | Email form. API always returns 202 regardless of whether email exists. |
| [`src/app/pages/auth/reset-password/`](../src/app/pages/auth/reset-password/) | `ResetPassword` | New password form. Reads `email` and `token` from query params. Calls `auth.resetPassword()`. |
| [`src/app/pages/auth/oauth-buttons/`](../src/app/pages/auth/oauth-buttons/) | `OauthButtons` | Shared component — renders provider buttons that link to `oauthUrl(provider)`. |

## Invitation flow

| File | Purpose |
|---|---|
| [`src/app/pages/invitations/accept/accept.ts`](../src/app/pages/invitations/accept/accept.ts) | Three-way branching: new user (set password → `activate`), logged-in user (accept directly), existing user (login then accept). Reads `email`+`token` from query params. Constructor calls `checkSession()` when a token is present (so users returning from the consents gate see "Join team", not a login form) and redirects to `/` on 404 when the user already has a session. |
| [`src/app/pages/invitations/accept/accept.html`](../src/app/pages/invitations/accept/accept.html) | Template with `isNewUser`, `isAuthenticated`, and login branches. |
| [`src/app/pages/invitations/accept/accept.spec.ts`](../src/app/pages/invitations/accept/accept.spec.ts) | Unit test — verifies `Accept` creates correctly with mocked auth config |

## Team management

| File | Purpose |
|---|---|
| [`src/app/pages/teams/teams.ts`](../src/app/pages/teams/teams.ts) | Team list — loads teams, shows active/switch buttons. |
| [`src/app/pages/teams/new/new-team.ts`](../src/app/pages/teams/new/new-team.ts) | Create team form. Calls `auth.createTeam()`. |
| [`src/app/pages/teams/detail/team-detail.ts`](../src/app/pages/teams/detail/team-detail.ts) | Team detail — members list, invitations, invite form, team settings, danger zone (delete). Owner-only sections gated by `isOwner()`. Reactive cooldown timer for invite resend. |

## Account

| File | Purpose |
|---|---|
| [`src/app/pages/account/account.ts`](../src/app/pages/account/account.ts) | Profile edit (first/last name) + change password. `currentPassword` is optional for OAuth users. |
| [`src/app/pages/account/account.spec.ts`](../src/app/pages/account/account.spec.ts) | Unit test — verifies `Account` creates correctly with mocked auth config |

## Shell

| File | Purpose |
|---|---|
| [`src/app/pages/shell/shell.ts`](../src/app/pages/shell/shell.ts) | Authenticated frame — header, nav, user menu, welcome banner, router outlet. Subscribes to router events for progress bar. |
| [`src/app/pages/shell/shell.html`](../src/app/pages/shell/shell.html) | Layout with skip link, header (logo, nav, theme toggle, avatar menu), welcome banner, main content area. |
| [`src/app/pages/shell/shell.spec.ts`](../src/app/pages/shell/shell.spec.ts) | Unit test — verifies `Shell` creates correctly with mocked auth config |

## Home (placeholder)

| File | Purpose |
|---|---|
| [`src/app/pages/home/home.ts`](../src/app/pages/home/home.ts) | **Placeholder showcase** — displays feature list driven by `environment.features`, plus a "Fetch your data" demo section showing how to use `auth.api()` for authenticated API calls. Replace with your app's landing content. |

## Consents gate

| File | Purpose |
|---|---|
| [`src/app/consents.ts`](../src/app/consents.ts) | Global signal `consentsBlocked` — raised on any `451` response from the service. Passed to `provideRhAuth` as `config.onError` during bootstrap. |
| [`src/app/consents-gate.ts`](../src/app/consents-gate.ts) | Overlay component — covers the app with an acceptance form while the API answers `451`. Sits outside the router outlet so it renders even when `authGuard` blocks navigation. Calls `auth.acceptConsents()` then does a pathname-aware reload: redirects to `/` when on an auth page, otherwise reloads the current URL so in-progress flows are preserved. |
| [`src/app/consents-gate.html`](../src/app/consents-gate.html) | Template with two checkboxes (ToS + Privacy Policy) gating the accept button. |

## Setup scripts

| File | Purpose |
|---|---|
| [`ulabase.setup.ts`](../ulabase.setup.ts) | Declarative setup for the accounts plugin — installs the plugin, configures feature flags (derived from `environment.dev.ts`), sets Google OAuth credentials if enabled, and adds the app origin to the CORS allowlist. Run with `ulabase setup --srv <srvId>`. |
| [`ulabase.setup.consents.ts`](../ulabase.setup.consents.ts) | Extends `ulabase.setup.ts` with the consents gate — imports the accounts steps, then adds a user schema with `latestConsents`/`consents` fields, a permission allowing users to PATCH their own consents, JWT claims for the two version strings, and a Guards rule that blocks users who haven't accepted the current ToS/Privacy Policy with HTTP 451. Run with `ulabase setup --srv <srvId> --file ulabase.setup.consents.ts`. |

The two setup files share one definition of the accounts steps (`ulabase.setup.ts` exports them via `defineSetup`; `ulabase.setup.consents.ts` spreads them with `...accounts.steps`). The consents file centralizes `TOS_VERSION` and `PP_VERSION` so bumping them and re-running the setup is the only action needed to publish new terms — the server stamps the versions and the client never knows what they are.

## Static assets

| File | Purpose |
|---|---|
| [`public/favicon.png`](../public/favicon.png) | App favicon |
| [`public/terms.html`](../public/terms.html) | Terms of Service page — placeholder content. Served as static HTML; linked from the consents gate. |
| [`public/privacy.html`](../public/privacy.html) | Privacy Policy page — placeholder content. Served as static HTML; linked from the consents gate. |

## Specs and documentation

| File | Purpose |
|---|---|
| [`specs/done/account-team-management.md`](../specs/done/account-team-management.md) | Spec for account/team management feature — API coverage audit, information architecture |
| [`specs/done/ux-improvements.md`](../specs/done/ux-improvements.md) | UX improvement plan — 17 findings, all resolved. Covers accessibility, feedback, design language |
| [`TEST-CASES.md`](../TEST-CASES.md) | Manual testing checklist for all auth/team flows |
| [`PORTING.md`](../PORTING.md) | Framework-neutral behaviour spec for React/Vue ports |
| [`TEMPLATE_API.md`](../TEMPLATE_API.md) | Component surface documentation — what each template binds to |
| [`README.md`](../README.md) | Project overview, quickstart instructions, troubleshooting |
| [`NOTES.md`](../NOTES.md) | Detailed implementation notes — route map, class hooks, consents gate internals |
