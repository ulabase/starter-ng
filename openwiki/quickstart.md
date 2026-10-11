---
type: Quickstart
title: Ulabase Starter — Angular
description: Concise entrypoint for the ulabase-starter-ng repository. Routes readers through the wiki hierarchy based on their task (exploring, building a feature, porting, restyling, testing). Includes quick setup, documentation map, task routing table, and key dependencies.
tags: [quickstart, angular, ulabase, starter]
verified:
  - by: openwiki/0.7.2
    at: 2026-10-11T09:33:30.268Z
sources:
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
generated: { by: "openwiki/0.7.2", at: "2026-10-11T09:33:30.268Z" }
---

# Ulabase Starter — Angular

An Angular 21 starter application built on [`@ulabase/kit-ng`](https://github.com/ulabase/kit/tree/main/packages/kit-ng). It implements all Ulabase authentication and multi-tenancy flows out of the box — fork it, point it at your Ulabase service, and start building.

Works for multi-tenant SaaS (invitations, team switcher) and simpler apps (auth only).

## What's included

- **Signup, login, logout** — email/password and Google/GitHub OAuth
- **Email verification, password reset**
- **Team invitations** — one page (`/invitations/accept`) branching into new-user "set password" or existing-user "log in and accept"
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
cd ulabase-starter-ng
npm install

# 2. Point to your Ulabase service
# Edit src/environments/environment.dev.ts — set apiUrl to your service URL
# Then tell git to ignore local changes:
git update-index --assume-unchanged src/environments/environment.dev.ts

# 3. Set the service up (installs accounts plugin, configures features & CORS)
npm install -g ulabase
ulabase login                              # paste a token from ulabase.com
ulabase setup --srv <srvId>                # <srvId> is the six-char id from your service URL

# 4. Start
ng serve
```

**Prerequisites:** Node.js 22.18 or later (it runs the TypeScript setup file), a Ulabase service ([create one at ulabase.com](https://ulabase.com)), and Angular CLI.

**Want the consents gate?** Use the alternate setup file to add Terms of Service and Privacy Policy acceptance:

```bash
ulabase setup --srv <srvId> --file ulabase.setup.consents.ts
```

Replace `public/terms.html` and `public/privacy.html` — they are placeholders.

## How it works

The app detects whether `apiUrl` points to a valid Ulabase service URL (e.g. `https://<srvId>.ulabase.app`). If not, it shows a "Connect your service" screen instead of the full app. Once configured, the route guard system drives everything:

- **`authGuard`** protects authenticated routes — redirects to `/auth/login` if no session
- **`publicGuard`** protects auth pages — redirects into the app if already signed in
- **`/invitations/accept`** is deliberately unguarded — works for signed-out invitees, signed-in users, and new accounts

Feature flags in `src/environments/environment*.ts` must match your service's **Sign-up Mgmt → Features** toggles. A flag that's off removes both the route and the UI that links to it. The `ulabase setup` tooling reads these flags and configures the service to match, eliminating the two-lists-that-must-agree problem.

## Where to start

1. **Just exploring?** Read this page, then [Architecture](architecture.md) for the big picture.
2. **Building a feature?** Check [Workflows](workflows.md) for existing flows, then [Source Map](source-map.md) for where to look.
3. **Porting to React/Vue?** Read [`PORTING.md`](../PORTING.md) first — it covers what's portable and what you must rebuild.
4. **Restyling?** The CSS comment block at the top of [`styles.css`](../src/styles.css) maps every semantic class hook (`.card`, `.btn-primary`, `.form-field`, …) to what it represents. [`TEMPLATE_API.md`](../TEMPLATE_API.md) documents what each template binds to.
5. **Running tests?** See [Testing](testing.md) for the manual checklist and automated test status.

## Documentation map

| Page | What it covers |
|---|---|
| [Architecture](architecture.md) | Angular SSR setup, dependency layers, routing, guards, auth flow, consents gate mechanism |
| [Source Map](source-map.md) | File-by-file guide organized by domain |
| [Workflows](workflows.md) | Key user flows: signup, login, OAuth, invitations, team management, consents acceptance |
| [Domain Concepts](domain-concepts.md) | Ulabase auth model, teams, tokens, feature flags, consents gate domain model |
| [Operations](operations.md) | Build, serve, SSR deploy, environment config, CSS theming, porting, ulabase setup tooling |
| [Testing](testing.md) | Manual test checklist, automated test status, what to test when changing what |
| [Integrations](integrations.md) | @ulabase/kit, kit-ng, Ulabase service, OAuth, ulabase CLI, CI |

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
| `@ulabase/kit-ng` | Angular adapter — reactive wrapper (`RhAuthService`), guards, HTTP interceptor. Provides the core auth logic via its dependency `@ulabase/kit`. |
| `ulabase` CLI | Dev CLI — `ulabase setup` configures your service from `environment.dev.ts` flags |
| `@angular/core` ^21.2 | Angular framework |
| `@angular/ssr` ^21.2 | Server-side rendering |
| `express` ^5.1 | SSR server |

## Task routing table

Use this table to find the right starting point for common changes:

| Change area / User intent | Relevant wiki page | Source entry points | Important symbols / types | Focused tests | Minimal validation command |
|---|---|---|---|---|---|
| **Auth flows** (signup, login, OAuth, verification, password reset) | [Workflows](workflows.md) | `src/app/pages/auth/*` | `Login`, `Signup`, `Verify`, `ForgotPassword`, `ResetPassword`, `OauthButtons` | `login.spec.ts`, `signup.spec.ts`, `verify.spec.ts`, `forgot-password.spec.ts`, `reset-password.spec.ts` | `ng test` |
| **Team management** (invitations, switching, members, settings) | [Workflows](workflows.md) | `src/app/pages/teams/*`, `src/app/pages/invitations/accept/` | `Teams`, `TeamDetail`, `NewTeam`, `Accept` | `accept.spec.ts`, `shell.spec.ts` | `ng test` |
| **Account management** (profile, password change) | [Workflows](workflows.md) | `src/app/pages/account/account.ts` | `Account` | `account.spec.ts` | `ng test` |
| **Routing and guards** | [Architecture](architecture.md) | `src/app/app.routes.ts` | `authGuard`, `publicGuard`, `AppTitleStrategy` | `app.spec.ts` | `ng test` |
| **SSR/CSR split** | [Architecture](architecture.md) | `src/app/app.routes.server.ts`, `src/server.ts` | `Prerender`, `Client` render modes | Manual SSR test | `ng build && node dist/ulabase-starter-ng/server/server.mjs` |
| **Feature flags** | [Domain Concepts](domain-concepts.md) | `src/environments/environment*.ts` | `environment.features` | Manual flag toggle test | `ng serve` and verify routes/UI |
| **Environment configuration** | [Operations](operations.md) | `src/environments/environment.ts`, `src/environments/environment.dev.ts` | `apiUrl`, `features` | Manual config test | `ng serve` and check "Connect your service" screen |
| **Consents gate** (ToS/Privacy Policy acceptance) | [Domain Concepts](domain-concepts.md), [Operations](operations.md) | `src/app/consents.ts`, `src/app/consents-gate.ts`, `ulabase.setup.consents.ts` | `consentsBlocked`, `ConsentsGate`, `consentsOnError` | Manual 451 test | `ulabase setup --srv <srvId> --file ulabase.setup.consents.ts` then test blocked user |
| **CSS theming** | [Operations](operations.md) | `src/styles.css` | CSS custom properties, `.dark` class | Visual inspection | `ng serve` and toggle theme |
| **Component styling** | [Operations](operations.md) | `src/app/pages/**/*.css` | Page-specific CSS classes | Visual inspection | `ng serve` |
| **Build and deployment** | [Operations](operations.md) | `package.json`, `angular.json` | Build scripts, SSR server | Build success | `ng build` |
| **Dependencies** | [Integrations](integrations.md) | `package.json` | `@ulabase/kit`, `@ulabase/kit-ng` | Dependency audit | `npm audit` |
| **Testing** | [Testing](testing.md) | `src/app/**/*.spec.ts`, `TEST-CASES.md` | Vitest configuration, test cases | Test execution | `ng test` |
| **New API endpoints** | [Integrations](integrations.md) | `@ulabase/kit`, `@ulabase/kit-ng` | `RhAuthService`, `auth.api()`, kit functions | Manual API test | `ng serve` and test API calls |
| **Service setup** (ulabase CLI) | [Operations](operations.md) | `ulabase.setup.ts`, `ulabase.setup.consents.ts` | `defineSetup`, `step`, feature flag derivation | `ulabase setup --dry-run` | `ulabase setup --srv <srvId> --dry-run` |
| **Porting to other frameworks** | [Operations](operations.md) | `PORTING.md`, `TEMPLATE_API.md` | Portable layers, reactive auth layer | Manual parity test | Compare with Angular original |

## Backlog

- **Automated E2E tests** — Currently manual only (TEST-CASES.md). No Cypress/Playwright suite exists.
- **Team list refresh after create** — `auth.createTeam()` doesn't update `auth.teams()` yet (restheart#643).
