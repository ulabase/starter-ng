---
type: Quickstart
title: Ulabase Starter — Angular Quickstart
description: Concise entrypoint that routes readers through the wiki by task (explore, build a feature, port, restyle, test) and carries the quick setup, key dependencies, and task-routing table.
tags: [quickstart, angular, ulabase, starter]
verified:
  - by: openwiki/0.9.0
    at: 2026-11-21T15:24:47.543Z
sources:
  - id: openwiki-source-5093b074f16e0b77479219b2
    resource: repo://package-lock.json
  - id: openwiki-source-5b54a58d1b51cd490b0e7162
    resource: repo://package.json
  - id: openwiki-source-0d11ea3a28bf7372369b0bc9
    resource: repo://PORTING.md
  - id: openwiki-source-23775c3de52f3ab95a13cb8b
    resource: repo://README.md
  - id: openwiki-source-d0cca70daf23ae76d9eafbb8
    resource: repo://specs/done/account-team-management.md
  - id: openwiki-source-1bb4f997bf7534ca73d1beae
    resource: repo://specs/done/ux-improvements.md
  - id: openwiki-source-1b6b17b8afa47babcf26380f
    resource: repo://src/app/app.config.ts
  - id: openwiki-source-d3086358408fd7acf5360013
    resource: repo://src/app/app.html
  - id: openwiki-source-407c70ba325b6f9e6aa4707e
    resource: repo://src/app/app.routes.ts
  - id: openwiki-source-533e7761316e2fac327194b8
    resource: repo://src/app/app.ts
  - id: openwiki-source-76b992238575041d25a8d7ba
    resource: repo://src/app/consents-gate.ts
  - id: openwiki-source-18e26fe2b93aaf5a2892ec49
    resource: repo://src/app/pages/account/account.ts
  - id: openwiki-source-136a04e418a9969c28b1c30f
    resource: repo://src/app/pages/auth/login/login.ts
  - id: openwiki-source-cc2a121090704e17ef477a1b
    resource: repo://src/app/pages/auth/signup/signup.ts
  - id: openwiki-source-03114a222c1d480c1768dc28
    resource: repo://src/app/pages/auth/verify/verify.html
  - id: openwiki-source-be9f7de43e6b35b73dbb2aae
    resource: repo://src/app/pages/home/home.ts
  - id: openwiki-source-0c503ef6a22fe483e758a9db
    resource: repo://src/app/pages/invitations/accept/accept.ts
  - id: openwiki-source-b3a716361f88bb3ea09515bc
    resource: repo://src/app/pages/teams/new/new-team.ts
  - id: openwiki-source-15a66680fea3945936cdfe8f
    resource: repo://src/app/pages/teams/teams.ts
  - id: openwiki-source-8d236ec39d0e441a38b5d676
    resource: repo://src/environments/environment.dev.ts
  - id: openwiki-source-146419bb9b2415894a6bd677
    resource: repo://src/styles.css
  - id: openwiki-source-771ac933b1dd0c426922576f
    resource: repo://TEMPLATE_API.md
  - id: openwiki-source-ff8f527e585bb7a131d1ff75
    resource: repo://TEST-CASES.md
  - id: openwiki-source-c1d5327fe44e08cda82fcf83
    resource: repo://ulabase.setup.consents.ts
  - id: openwiki-source-34f568b222540eb11aa44859
    resource: repo://ulabase.setup.ts
generated: { by: "openwiki/0.9.0", at: "2026-11-21T15:24:47.543Z" }
---

# Ulabase Starter — Angular

An Angular 21 starter application built on [`@ulabase/kit-ng`](https://github.com/ulabase/kit/tree/main/packages/kit-ng). It implements all Ulabase authentication and multi-tenancy flows out of the box — fork it, point it at your Ulabase service, and start building.

Works for multi-tenant SaaS (invitations, team switcher) and simpler apps (auth only).

## What's included

- **Signup, login, logout** — email/password and Google/GitHub OAuth
- **Email verification, password reset** — when a verification link expires, the login page shows *"This verification link has expired. Use \"Forgot password?\" below to get a new link: it also verifies your email."* (`ERROR_MESSAGES.token_expired` in [`login.ts`](../src/app/pages/auth/login/login.ts)); [`verify.html`](../src/app/pages/auth/verify/verify.html) shows the same guidance.
- **Team invitations** — one page (`/auth/activate` for a new user, `/invitations/accept` for an existing one) branching into new-user "set password", existing-user "log in and accept", or signed-in user "accept directly" (handles consents-gate reload)
- **Team switcher** — shown only when the user belongs to more than one team
- **Authenticated shell** with placeholder for your app content
- **SSR for public routes**, CSR for the authenticated shell
- **Account management** — profile editing and password change
- **Consents gate** — optional server-enforced Terms of Service and Privacy Policy acceptance (blocks all API requests until accepted)
- **"Connect your service" screen** — shown when `apiUrl` is empty or not a valid Ulabase service URL (e.g. `https://<srvId>.ulabase.app`), guiding setup
- **Dark/light mode** — persisted to localStorage
- **Demo fetch feature** — shows how to use `auth.api()` for authenticated API calls to your Ulabase service

## Quick setup

```bash
# 1. Clone and install
git clone https://github.com/ulabase/starter-ng.git
cd starter-ng
npm install

# 2. Point to your Ulabase service
# Edit src/environments/environment.dev.ts — set apiUrl to your service URL
# Then tell git to ignore local changes:
git update-index --assume-unchanged src/environments/environment.dev.ts

# 3. Set the service up (accounts install, branding name, accounts config, OAuth, origin allowlist)
npm install -g ulabase
ulabase login                              # paste a token from ulabase.com
ulabase setup --srv <srvId>                # <srvId> is the six-char id from your service URL

# 4. Start
ng serve
```

**Prerequisites:** Node.js 22.18 or later (it runs the TypeScript setup file), a Ulabase service ([create one at ulabase.com](https://ulabase.com)), and Angular CLI.

Each `ulabase setup` step is a check and an apply (idempotent; `--dry-run` reports what is missing without writing). The step order in [`ulabase.setup.ts`](../ulabase.setup.ts) is: accounts plugin install, branding name (`APP_NAME` env, default `Ulabase Starter`, read-modify-write preserving console color/logo), accounts config (`frontend-url`/`frontend-app-url` and feature toggles derived from `environment.dev.ts`), conditional Google OAuth credentials, origin-allowlist, and `appPointsAtService` last (writes `apiUrl` only once everything above is in place).

**Want the consents gate?** Use the alternate setup file to add Terms of Service and Privacy Policy acceptance:

```bash
ulabase setup --srv <srvId> --file ulabase.setup.consents.ts
```

Replace `public/terms.html` and `public/privacy.html` — they are placeholders.

The consents setup appends the JWT claims `latestConsents/tos` and `latestConsents/pp` to the `auth` feature's `account-properties-claims` config (added, not replaced); there is no separate `/auth-config` endpoint.

## How it works

The app detects whether `apiUrl` points to a valid Ulabase service URL (e.g. `https://<srvId>.ulabase.app`). If not, it shows a "Connect your service" screen instead of the full app. Once configured, the route guard system drives everything:

- **`authGuard`** protects authenticated routes — redirects to `/auth/login` if no session
- **`publicGuard`** protects auth pages — redirects into the app if already signed in
- **`/auth/activate`** and **`/invitations/accept`** (the same invitation page) are deliberately unguarded — the page works for signed-out invitees, signed-in users, and new accounts

Feature flags in `src/environments/environment*.ts` must match your service's **Sign-up Mgmt → Features** toggles. A flag that's off removes both the route and the UI that links to it. The `ulabase setup` tooling reads these flags and configures the service to match, eliminating the two-lists-that-must-agree problem.

## Where to start

1. **Just exploring?** Read this page, then [Application Runtime](architecture/app-runtime.md) for the big picture and [Routing and Guards](architecture/routing-and-guards.md) for the route map.
2. **Building a feature?** Check [Auth Workflows](workflows/auth-flows.md) or [Teams and Invitations](workflows/teams-and-invitations.md) for existing flows, then [Source Map](source-map.md) for where to look.
3. **Porting to React/Vue?** Read [`PORTING.md`](../PORTING.md) first — it covers what's portable and what you must rebuild. [Theming and Porting](operations/theming-and-porting.md) summarizes the matrix.
4. **Restyling?** The CSS comment block at the top of [`styles.css`](../src/styles.css) maps every semantic class hook (`.card`, `.btn-primary`, `.form-field`, …) to what it represents. [`TEMPLATE_API.md`](../TEMPLATE_API.md) documents what each template binds to. See [Theming and Porting](operations/theming-and-porting.md).
5. **Operating or deploying?** See the [Operations Runbook](operations/runbook.md).
6. **Running tests?** See [Testing Guidance](testing/guidance.md) for the manual checklist and automated test status.

## Documentation map

| Page | What it covers |
|---|---|
| [Application Runtime](architecture/app-runtime.md) | Dependency layers, bootstrap chain, SSR render modes, Express server, authenticated shell |
| [Auth and Session](architecture/auth-session.md) | Token storage vs signal state, RhAuthService surface, interceptor 401 handling, `auth.api()` |
| [Routing and Guards](architecture/routing-and-guards.md) | Route map, feature-flag routes, `authGuard`/`publicGuard`, SSR mirror, titles |
| [Consents Gate](concepts/consents-gate.md) | Server-enforced ToS/Privacy acceptance: schema, permission, JWT claims, 451 rule, version bump |
| [Domain Model](concepts/domain-model.md) | Users, teams, roles, invitations, feature flags, `justSignedUp` signal |
| [External Dependencies](integrations/external-dependencies.md) | `@ulabase/kit`, `kit-ng`, Ulabase service, OAuth providers, `@ulabase/cli`, OpenWiki CI |
| [Operations Runbook](operations/runbook.md) | Build, serve, SSR deploy, environment config, troubleshooting |
| [Theming and Porting](operations/theming-and-porting.md) | Design tokens, semantic class hooks, Alert component, portable-vs-rebuild matrix |
| [Source Map](source-map.md) | File-by-file guide organized by domain, declared vs lock-resolved dependency versions |
| [Testing Guidance](testing/guidance.md) | Automated test reality, manual checklist, what to verify per change area |
| [Auth Workflows](workflows/auth-flows.md) | Signup, email verification, login/logout, OAuth, password reset, dead-link recovery |
| [Service Setup](workflows/service-setup.md) | `ulabase setup` step pipeline, feature-flag derivation, secrets, idempotent re-runs |
| [Teams and Invitations](workflows/teams-and-invitations.md) | Invitation acceptance, team switching, member management, account profile/password |

## Existing documentation

| File | Purpose |
|---|---|
| [`README.md`](../README.md) | Setup, structure, "Making it yours" theming guide |
| [`TEMPLATE_API.md`](../TEMPLATE_API.md) | What each template binds to: signals, methods, inputs, form controls |
| [`PORTING.md`](../PORTING.md) | Framework-neutral behaviour spec for React/Vue ports |
| [`TEST-CASES.md`](../TEST-CASES.md) | Manual testing checklist for all auth/team flows |
| [`specs/done/`](../specs/done/) | Completed specs: UX improvements, account/team management |

## Key dependencies

| Package | Role |
|---|---|
| `@ulabase/kit-ng` ^0.15.0 | Angular adapter — reactive wrapper (`RhAuthService`), guards, HTTP interceptor. Provides the core auth logic via its dependency `@ulabase/kit`. |
| `ulabase` CLI (`@ulabase/cli`) ^0.15.0 | Dev CLI — `ulabase setup` configures your service from `environment.dev.ts` flags |
| `@angular/core` ^21.2 | Angular framework |
| `@angular/ssr` ^21.2 | Server-side rendering |
| `express` ^5.1 | SSR server |

`package.json` declares `@ulabase/kit-ng` and `@ulabase/cli` at `^0.15.0`; `package-lock.json` resolves `@ulabase/kit-ng`, `@ulabase/kit`, and `@ulabase/cli` to `0.15.0`. Treat the lockfile as the source of truth for the installed kit.

## Task routing table

Use this table to find the right starting point for common changes:

| Change area / User intent | Relevant wiki page | Source entry points | Important symbols / types | Focused tests | Minimal validation command |
|---|---|---|---|---|---|
| **Auth flows** (signup, login, OAuth, verification, password reset) | [Auth Workflows](workflows/auth-flows.md) | `src/app/pages/auth/*` | `Login`, `Signup`, `Verify`, `ForgotPassword`, `ResetPassword`, `OauthButtons` | `login.spec.ts`, `signup.spec.ts`, `verify.spec.ts`, `forgot-password.spec.ts`, `reset-password.spec.ts` | `ng test` |
| **Team management** (invitations, switching, members, settings) | [Teams and Invitations](workflows/teams-and-invitations.md) | `src/app/pages/teams/*`, `src/app/pages/invitations/accept/` | `Teams`, `TeamDetail`, `NewTeam`, `Accept` | `accept.spec.ts`, `shell.spec.ts` | `ng test` |
| **Account management** (profile, password change) | [Teams and Invitations](workflows/teams-and-invitations.md) | `src/app/pages/account/account.ts` | `Account` | `account.spec.ts` | `ng test` |
| **Routing and guards** | [Routing and Guards](architecture/routing-and-guards.md) | `src/app/app.routes.ts` | `authGuard`, `publicGuard`, `AppTitleStrategy` | `app.spec.ts` | `ng test` |
| **SSR/CSR split** | [Application Runtime](architecture/app-runtime.md) | `src/app/app.routes.server.ts`, `src/server.ts` | `Prerender`, `Client` render modes | Manual SSR test | `ng build && node dist/ulabase-starter-ng/server/server.mjs` |
| **Feature flags** | [Domain Model](concepts/domain-model.md) | `src/environments/environment*.ts` | `environment.features` | Manual flag toggle test | `ng serve` and verify routes/UI |
| **Environment configuration** | [Operations Runbook](operations/runbook.md) | `src/environments/environment.ts`, `src/environments/environment.dev.ts` | `apiUrl`, `features` | Manual config test | `ng serve` and check "Connect your service" screen |
| **Consents gate** (ToS/Privacy Policy acceptance) | [Consents Gate](concepts/consents-gate.md) | `src/app/consents.ts`, `src/app/consents-gate.ts`, `ulabase.setup.consents.ts` | `consentsBlocked`, `ConsentsGate`, `consentsOnError` | Manual 451 test | `ulabase setup --srv <srvId> --file ulabase.setup.consents.ts` then test blocked user |
| **CSS theming** | [Theming and Porting](operations/theming-and-porting.md) | `src/styles.css` | CSS custom properties, `.dark` class | Visual inspection | `ng serve` and toggle theme |
| **Component styling** | [Theming and Porting](operations/theming-and-porting.md) | `src/app/pages/**/*.css` | Page-specific CSS classes | Visual inspection | `ng serve` |
| **Build and deployment** | [Operations Runbook](operations/runbook.md) | `package.json`, `angular.json` | Build scripts, SSR server | Build success | `ng build` |
| **Dependencies** | [External Dependencies](integrations/external-dependencies.md) | `package.json` | `@ulabase/kit`, `@ulabase/kit-ng` | Dependency audit | `npm audit` |
| **Testing** | [Testing Guidance](testing/guidance.md) | `src/app/**/*.spec.ts`, `TEST-CASES.md` | Vitest configuration, test cases | Test execution | `ng test` |
| **New API endpoints** | [Auth and Session](architecture/auth-session.md) | `@ulabase/kit`, `@ulabase/kit-ng` | `RhAuthService`, `auth.api()`, kit functions | Manual API test | `ng serve` and test API calls |
| **Service setup** (ulabase CLI) | [Service Setup](workflows/service-setup.md) | `ulabase.setup.ts`, `ulabase.setup.consents.ts` | `defineSetup`, `step`, feature flag derivation, `appPointsAtService` | `ulabase setup --dry-run` | `ulabase setup --srv <srvId> --dry-run` |
| **Porting to other frameworks** | [Theming and Porting](operations/theming-and-porting.md) | `PORTING.md`, `TEMPLATE_API.md` | Portable layers, reactive auth layer | Manual parity test | Compare with Angular original |

## Backlog

- **Automated E2E tests** — Currently manual only (TEST-CASES.md). No Cypress/Playwright suite exists.
- **Team list refresh after create** — `auth.createTeam()` doesn't update `auth.teams()` yet (restheart#643).
