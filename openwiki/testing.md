---
type: Testing
title: Testing Guidance
description: Manual test checklist, automated test status, what to test when changing key areas, and Browser DevTools verification guidance for ulabase-starter-ng.
tags: [testing, qa, manual, checklist, devtools, vitest]
sources:
  - id: openwiki-source-73378d4ee3f791429188ddb5
    resource: repo://angular.json
  - id: openwiki-source-5b54a58d1b51cd490b0e7162
    resource: repo://package.json
  - id: openwiki-source-4dcb96c57cd6fc12d9eb28a5
    resource: repo://src/app/app.routes.server.ts
  - id: openwiki-source-407c70ba325b6f9e6aa4707e
    resource: repo://src/app/app.routes.ts
  - id: openwiki-source-46765014c454f37f94d95d13
    resource: repo://src/app/app.spec.ts
  - id: openwiki-source-9e59c2fa2727aea99ec881eb
    resource: repo://src/app/pages/account/account.spec.ts
  - id: openwiki-source-c848f08590912d99d95967d9
    resource: repo://src/app/pages/auth/forgot-password/forgot-password.ts
  - id: openwiki-source-6be6d52bb1ede5616ee2e308
    resource: repo://src/app/pages/auth/login/login.spec.ts
  - id: openwiki-source-136a04e418a9969c28b1c30f
    resource: repo://src/app/pages/auth/login/login.ts
  - id: openwiki-source-9619f15bc5f12e7384c12a51
    resource: repo://src/app/pages/auth/oauth-buttons/oauth-buttons.spec.ts
  - id: openwiki-source-1153b336967cba65b87d1df6
    resource: repo://src/app/pages/auth/oauth-buttons/oauth-buttons.ts
  - id: openwiki-source-de882d521845822887c56b3b
    resource: repo://src/app/pages/auth/reset-password/reset-password.ts
  - id: openwiki-source-cc2a121090704e17ef477a1b
    resource: repo://src/app/pages/auth/signup/signup.ts
  - id: openwiki-source-3815a7c2c47aef567cc71dbc
    resource: repo://src/app/pages/auth/verify/verify.ts
  - id: openwiki-source-4ee5b369bfab7a3e360fd7bd
    resource: repo://src/app/pages/invitations/accept/accept.spec.ts
  - id: openwiki-source-0c503ef6a22fe483e758a9db
    resource: repo://src/app/pages/invitations/accept/accept.ts
  - id: openwiki-source-e39dc4acde9bdf438bfa59ab
    resource: repo://src/app/pages/shell/shell.spec.ts
  - id: openwiki-source-a0abfed3f48fb645e980c9ea
    resource: repo://src/app/pages/teams/detail/team-detail.ts
  - id: openwiki-source-eaae96b81373abab97667f4f
    resource: repo://src/environments/environment.ts
  - id: openwiki-source-d9b845a7425932c3767a237e
    resource: repo://src/server.ts
  - id: openwiki-source-ff8f527e585bb7a131d1ff75
    resource: repo://TEST-CASES.md
  - id: openwiki-source-cfec35e61a853579c60d6d5d
    resource: repo://tsconfig.spec.json
generated: { by: "openwiki/0.7.2", at: "2026-10-19T08:21:09.342Z" }
verified:
  - by: openwiki/0.7.2
    at: 2026-10-19T08:21:09.342Z
---

# Testing Guidance

## Current test status

**No automated E2E suite exists.** All flows are verified by hand using the checklist in [`TEST-CASES.md`](../TEST-CASES.md).

**Unit tests:** minimal — all spec files only verify component creation. No behavioral tests exist. The 10 spec files are:

| Spec file | Component |
|---|---|
| `src/app/app.spec.ts` | `App` |
| `src/app/pages/auth/login/login.spec.ts` | `Login` |
| `src/app/pages/auth/signup/signup.spec.ts` | `Signup` |
| `src/app/pages/auth/verify/verify.spec.ts` | `Verify` |
| `src/app/pages/auth/forgot-password/forgot-password.spec.ts` | `ForgotPassword` |
| `src/app/pages/auth/reset-password/reset-password.spec.ts` | `ResetPassword` |
| `src/app/pages/auth/oauth-buttons/oauth-buttons.spec.ts` | `OauthButtons` |
| `src/app/pages/invitations/accept/accept.spec.ts` | `Accept` |
| `src/app/pages/account/account.spec.ts` | `Account` |
| `src/app/pages/shell/shell.spec.ts` | `Shell` |

Most specs follow the same pattern: configure `TestBed` with `provideRouter([])` and a mock `RH_AUTH_CONFIG`, then assert `expect(component).toBeTruthy()`. The `OauthButtons` spec omits both the router and `RH_AUTH_CONFIG` (the component has no router dependency) and instead sets its `providers` input via `setInput()`. No form submission, navigation, guard, or HTTP behavior is tested.

**Test runner:** Vitest via `@angular/build:unit-test` builder (configured in `angular.json`). Run with:

```bash
ng test
```

The `tsconfig.spec.json` includes `vitest/globals` types, so Vitest matchers and lifecycle hooks are available without explicit imports.

## Manual testing checklist

The full checklist is in [`TEST-CASES.md`](../TEST-CASES.md). Key sections:

| Section | What to verify |
|---|---|
| Signup & email verification | Registration flow, verification link, token in fragment, duplicate email error |
| Login / logout | Credentials, wrong password, session persistence, token refresh |
| Forgot / reset password | Email enumeration prevention, auto-login after reset |
| Team invitations — new user | Invite link, set password, activate, auto-login |
| Team invitations — existing user | Logged out → login → accept; logged in → accept directly |
| Team switcher | Visibility (only when >1 team), immediate context update |
| OAuth | Provider consent, auto account creation, invite acceptance via OAuth |
| Session / guards | Auth guard redirect, public guard redirect, expired token handling, SSR/CSR transition |

## What to test when changing what

### Auth pages (`pages/auth/*`)
- All signup, login, verification, and password reset flows
- OAuth button rendering and URL construction
- Form validation (required fields, email format, password length)
- Error message display for each HTTP status code
- Network tab: verify no extra `POST /token` after activate/reset-password (bearer mode returns token directly)

### Invitation flow (`pages/invitations/*`)
- Three-way branching: new user, existing logged-out, existing logged-in
- Missing/invalid/expired token handling
- OAuth from invitation page

### Team management (`pages/teams/*`)
- Members list loading and empty states
- Role change and remove (owner only)
- Invite form and pending invitations
- Resend cooldown timer (5 minutes)
- Team settings save
- Team delete (only when no other members — 409 otherwise)
- Post-delete: if remaining teams exist with none active, auto-switches to first remaining team and navigates to `/teams`

### Account (`pages/account/*`)
- Profile load and save
- Password change (with and without current password for OAuth users)
- OAuth user hint display

### Shell (`pages/shell/*`)
- Navigation links and active state
- User menu (avatar, dropdown, keyboard nav, Escape to close)
- Welcome banner (appears after signup, not on subsequent logins)
- Theme toggle (dark/light, persisted)
- Progress bar during lazy route loading

### Home page demo fetch (`pages/home/*`)
- Demo button appears and is clickable when authenticated
- Clicking "Fetch /demo" sends a request to `/demo` with bearer token
- Loading state shows "Loading..." while request is in progress
- Success: displays JSON data in a code block
- Error: displays error message (e.g., 404 if `/demo` collection doesn't exist)
- Network tab: verify the request includes `Authorization: Bearer ...` header

### Routing and guards
- Auth guard: unauthenticated → redirect to login
- Public guard: authenticated → redirect into app
- Feature flag gating: disabled flag removes route and UI link
- Per-route titles in browser tab

### SSR
- Auth pages prerender correctly (view source shows HTML)
- Authenticated routes are client-rendered only
- No SSR errors from browser APIs (localStorage, document)

## Browser DevTools checks

Use the **Network tab** to verify bearer mode behavior:

- After email verification: redirect carries `#access_token=...` in fragment, no extra `POST /token`
- After password reset: `PATCH /auth/reset-password?delivery=body` returns token directly
- After team switch: `POST /auth/switch-team?delivery=body` returns new token directly
- Token refresh: `GET /token?renew` at ~80% of TTL (~12 minutes)
- No redundant `POST /token` calls after any flow that returns a token directly

## Automated test gaps

Priority areas for future E2E tests:

1. **Auth flows** — signup → verification → login → logout cycle
2. **Invitation flows** — all three branches (new user, logged out, logged in)
3. **Team management** — invite → accept → role change → remove
4. **Token lifecycle** — refresh, expiry, session restoration
5. **Feature flag gating** — verify routes/UI appear/disappear correctly
6. **SSR/CSR boundary** — prerendered pages render, authenticated pages don't break during hydration

## Change navigation for testing

### When modifying auth flows
- **Run:** `ng test` for unit tests
- **Check:** Manual flows from TEST-CASES.md, especially signup → verification → login cycle
- **Validation:** Use browser DevTools Network tab to verify no extra `POST /token` calls
- **Important files:** `src/app/pages/auth/**/*.ts`, `src/app/app.ts`

### When modifying team management
- **Run:** `ng test` for unit tests
- **Check:** Manual flows from TEST-CASES.md, especially invitation acceptance and team switching
- **Validation:** Verify team switcher appears only when user has >1 team
- **Important files:** `src/app/pages/teams/**/*.ts`, `src/app/pages/invitations/**/*.ts`

### When modifying SSR/CSR behavior
- **Run:** `ng build && node dist/ulabase-starter-ng/server/server.mjs`
- **Check:** View source on auth pages shows HTML (prerendered), authenticated routes are client-rendered only
- **Validation:** No SSR errors from browser APIs (localStorage, document)
- **Important files:** `src/app/app.routes.server.ts`, `src/server.ts`

### When modifying feature flags
- **Run:** `ng test` for unit tests
- **Check:** Manual flows from TEST-CASES.md, especially feature flag gating
- **Validation:** Disabled flag removes both route and UI link
- **Important files:** `src/environments/environment.ts`, `src/environments/environment.dev.ts`, `src/app/app.routes.ts`
