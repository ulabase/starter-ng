# Template API reference

**What this is.** For every component in the starter, the surface its **template** binds
to: state signals, handler methods, inputs, and reactive-form controls. It exists so a
template can be rewritten — by hand or by an agent — without reading the `.ts`.

**Companion documents.**

| Document | Answers |
|---|---|
| `README.md` — swap map | *How do I restyle?* Which class hook maps to which framework component. |
| **This file** | *What do I bind to?* The signals, methods and form controls each template uses. |
| `PORTING.md` | *How do I rebuild this in React/Vue?* Framework-neutral behaviour spec. |

**Conventions used below**

- Members are listed with the names the template uses. Angular `signal`s are **called** in
  templates (`loading()`), so every signal below is read as a function.
- "Writable from template" marks signals the templates mutate directly, e.g.
  `(close)="error.set(null)"` on an `<app-alert>`.
- Only template-facing members are documented. Private collaborators (`fb`, `router`,
  `route`) and private helpers (`messageFor`, `loadMembers`) are omitted.
- Error copy is listed where the component maps HTTP status codes to user-facing text,
  because that mapping is part of the behaviour a port must reproduce.

> **Keeping this in sync.** Regenerate the affected entry whenever a component's
> template-facing surface changes (a new signal, a renamed handler, a changed form
> control). A stale entry is worse than no entry, because it is trusted.

---

## Shared

### `Alert` — `app-alert`
`src/app/ui/alert/alert.ts` · presentational, no stylesheet of its own.

The one feedback primitive. Renders the `.success-msg` / `.form-error` skin hooks with the
right ARIA role, and self-dismisses.

| Input | Type | Default | Meaning |
|---|---|---|---|
| `type` | `'success' \| 'error'` | **required** | Picks the class hook (`.success-msg` / `.form-error`) and the ARIA role (`status` / `alert`). |
| `dismissible` | `boolean` | `true` | Shows the ✕ button. |
| `autoDismiss` | `number` (ms) | `4000` | Emits `close` after this delay. `0` disables it. |

| Output | Payload | When |
|---|---|---|
| `close` | `void` | Dismiss clicked, or `autoDismiss` elapsed. The **parent** owns the state, so it must reset its own signal in the handler. |

Content is projected: `<app-alert type="error" (close)="error.set(null)">{{ error() }}</app-alert>`.

### `ThemeService`
`src/app/theme.service.ts` · injectable, `providedIn: 'root'`. Injected by `Shell`.

| Member | Type | Meaning |
|---|---|---|
| `dark()` | `Signal<boolean>` | Current theme. |
| `toggle()` | `void` | Flips the theme, toggles `.dark` on `<html>`, persists to `localStorage['rh-theme']`. |

> Touches `localStorage` and `document` in its constructor with no platform guard. Safe
> today because only `Shell` injects it and the shell route is client-rendered — but
> injecting it into a **prerendered** auth page would break the SSR build.

---

## Root & frame

### `App` — `app-root`
`src/app/app.ts` · `src/app/app.html`

Chooses between the whole app and the "connect your service" screen.

| Member | Type | Meaning |
|---|---|---|
| `apiConfigured` | `boolean` | `isValidApiBaseUrl(environment.apiUrl)`. When false the router outlet is not rendered at all. |
| `apiUrl` | `string` | The configured value, shown on the config screen so "unset" is distinguishable from "set but invalid". |

On construction (browser only) it consumes `#access_token=…` from the URL fragment and the
one-shot `?flow=signup` marker, then clears both from the URL.

### `Shell` — `app-shell`
`src/app/pages/shell/shell.ts` · authenticated frame: header, nav, user menu, banner, outlet.

| State | Type | Meaning |
|---|---|---|
| `justSignedUp()` | `Signal<boolean>` | Seeded once from the global `justSignedUp` flag; drives the welcome banner. True after **any** fresh signup (email verification *or* OAuth) — copy must not claim email verification. |
| `menuOpen()` | `Signal<boolean>` | Avatar dropdown visibility. |
| `navigating()` | `Signal<boolean>` | True between `NavigationStart` and `NavigationEnd`/`Cancel`/`Error`; drives the top progress bar. |
| `auth` | `RhAuthService` | Used directly for `auth.user()`, `auth.teams()`. |
| `theme` | `ThemeService` | `theme.dark()`, `theme.toggle()` for the light/dark button. |

| Method | Returns | Behaviour |
|---|---|---|
| `initials()` | `string` | Profile initials, falling back to the first char of the email, else `?`. Uppercased. |
| `displayName()` | `string` | `"name surname"`, falling back to the email (`user._id`). |
| `email()` | `string` | `auth.user()?._id` — Ulabase uses email as the user id. |
| `activeTeamName()` | `string` | Name of the team with `active: true`, else `''`. |
| `toggleMenu()` | `void` | Opens/closes; on open, moves focus to `#firstMenuItem`. |
| `closeMenu()` | `void` | Closes and returns focus to `#avatarBtn`. |
| `onMenuKeydown(event)` | `void` | `Escape` closes the menu. |
| `dismissWelcome()` | `void` | Hides the banner. |
| `logout()` | `void` | `auth.logout()` then navigates to `/auth/login`. |

Template refs: `#avatarBtn`, `#firstMenuItem` (focus management). A `document:click`
host listener closes the menu on outside clicks.

### `ConsentsGate` — `app-consents-gate`
`src/app/consents-gate.ts` · blocking overlay shown while the API answers `451`. Mounted in
`app.html` at the **root**, outside the router outlet — a blocked user has no session, so
`authGuard` fails and nothing inside the outlet renders.

| State | Type | Meaning |
|---|---|---|
| `blocked()` | `Signal<boolean>` | The `consentsBlocked` module signal; drives the whole template. |
| `busy()` | `Signal<boolean>` | True while the acceptance is in flight; disables the accept button. |
| `error()` | `Signal<string \| null>` | Message shown in `.field-error` when the acceptance fails. |
| `auth` | `RhAuthService` | Used for `acceptConsents()` and `logout()`. |

| Method | Returns | Behaviour |
|---|---|---|
| `accept()` | `void` | `auth.acceptConsents()` — PATCH, token renewal, user reload — then reloads at `/`. The user id comes from the token, since `/users/me` is what is blocked. On error sets `error()` and leaves the overlay up. |
| `signOut()` | `void` | Lowers `consentsBlocked` (it outlives the session), logs out, then goes to `/auth/login`. |

No close button and no backdrop click: the only ways out are accepting or signing out. The
versions being accepted are never named here — the server's `mergeRequest` stamps them.

---

## Auth pages

### `Login` — `app-login`
`src/app/pages/auth/login/login.ts`

| Member | Type | Meaning |
|---|---|---|
| `form` | `FormGroup` | `email` (required, email), `password` (required). |
| `loading()` | `Signal<boolean>` | Request in flight. |
| `showPassword()` | `Signal<boolean>` | Password reveal toggle. |
| `error()` | `Signal<string \| null>` | Seeded from `?error=` on the URL (`invalid_token` → "This link is invalid or has expired."), then set on failure. |
| `features` | `environment.features` | Gates the OAuth block and the signup/forgot links. |
| `submit()` | `void` | Validates, calls `auth.login()`, navigates to `/` on success. |

Errors: `401` → "Invalid email or password."; otherwise the server message or "Something went wrong. Please try again."

### `Signup` — `app-signup`
`src/app/pages/auth/signup/signup.ts`

| Member | Type | Meaning |
|---|---|---|
| `form` | `FormGroup` | `firstName` (required), `lastName` (required), `email` (required, email), `password` (required, min 8). |
| `loading()` | `Signal<boolean>` | Request in flight. |
| `showPassword()` | `Signal<boolean>` | Password reveal toggle. |
| `error()` | `Signal<string \| null>` | Failure message. |
| `submitted()` | `Signal<boolean>` | On success the form is replaced by a "check your email" panel. |
| `features` | `environment.features` | Gates the OAuth block and the email form. |
| `submit()` | `void` | Validates, then `auth.register()`. |

**Derived value a port must reproduce:** the API requires a `teamName`, but the form does
not ask for one. It is generated as `` `${firstName}'s Team` ``, or
`` `${email.split('@')[0]}'s Team` `` when there is no first name.

Errors: `409` → "An account with this email already exists."

### `Verify` — `app-verify`
`src/app/pages/auth/verify/verify.ts` · no form; acts on construction.

| Member | Type | Meaning |
|---|---|---|
| `email`, `token` | `string` | From query params. |
| `error` | `string \| null` | From `?error=` — the backend redirects here on failure. |
| `missingParams` | `boolean` | Either param absent. |

When params are present, there is no error, and we are in the browser, it calls
`auth.verify()` and assigns the returned URL to `window.location.href`. The backend then
redirects back with `#access_token=…`. Three template states: missing params → invalid
link; error → verification failed; otherwise → "verifying…".

### `ForgotPassword` — `app-forgot-password`
`src/app/pages/auth/forgot-password/forgot-password.ts`

| Member | Type | Meaning |
|---|---|---|
| `form` | `FormGroup` | `email` (required, email). |
| `loading()` | `Signal<boolean>` | Request in flight. |
| `submitted()` | `Signal<boolean>` | Swaps the form for the confirmation panel. |
| `submit()` | `void` | Calls `auth.forgotPassword()`. |

**Deliberate:** success *and* error both set `submitted`, so the same confirmation shows
either way. The API always returns 202 to avoid leaking which emails are registered — a
port must not add error handling here.

### `ResetPassword` — `app-reset-password`
`src/app/pages/auth/reset-password/reset-password.ts`

| Member | Type | Meaning |
|---|---|---|
| `form` | `FormGroup` | `password` (required, min 8). |
| `missingParams` | `boolean` | `email`/`token` query params absent → "invalid link" panel. |
| `loading()`, `showPassword()` | `Signal<boolean>` | In-flight / reveal toggle. |
| `error()` | `Signal<string \| null>` | Failure message. |
| `submit()` | `void` | `auth.resetPassword()`, then navigates to `/` — the user is logged in directly. |

Errors: `401` → "This reset link is invalid or has expired."

### `OauthButtons` — `app-oauth-buttons`
`src/app/pages/auth/oauth-buttons/oauth-buttons.ts` · presentational.

| Input | Type | Meaning |
|---|---|---|
| `providers` | `readonly Provider[]` | **required.** Usually `environment.features.oauthProviders`. |

| Member | Meaning |
|---|---|
| `oauthUrl(provider)` | `${apiUrl}/auth/oauth/authorize/${provider}?noauthchallenge` — rendered as a plain `<a href>`, not a fetch. |
| `label(provider)` | `'github'` → `GitHub`, otherwise capitalised. |

Inline SVG icons for `google` and `github` live in the template.

---

## Invitations

### `Accept` — `app-accept`
`src/app/pages/invitations/accept/accept.ts` · one page on two paths (`auth/activate`, `invitations/accept`), three flows.

| Member | Type | Meaning |
|---|---|---|
| `email` | `string` | From query params; shown to the user. |
| `missingParams` | `boolean` | `email`/`token` absent → "invalid invitation link". |
| `loading()` | `Signal<boolean>` | Fetching the invitation. |
| `invitation()` | `Signal<Invitation \| null>` | Loaded invitation; `invitation().isNewUser` selects the flow, `invitation().teamName` is shown in the heading. |
| `error()` | `Signal<string \| null>` | Failure message. |
| `done()` | `Signal<boolean>` | Accepted; shows "You're in" then redirects after 1200 ms. |
| `newUserForm` | `FormGroup` | `password` (required, min 8) — the "set a password" flow. |
| `loginForm` | `FormGroup` | `password` (required) — the "log in and join" flow. |
| `showNewUserPassword()`, `showLoginPassword()` | `Signal<boolean>` | Reveal toggles. |
| `auth` | `RhAuthService` | Template reads `auth.isAuthenticated()`. |

| Method | Behaviour |
|---|---|
| `submitNewUser()` | `auth.activate()` → navigates to `/` (logged straight in). |
| `submitLoginAndAccept()` | `auth.login()` → then `acceptForLoggedInUser()`. |
| `acceptForLoggedInUser()` | `auth.acceptInvite()` → sets `done`, redirects after 1200 ms. |

**Branching a port must reproduce**, in order: `missingParams` → `loading()` → `done()` →
`invitation()` present, and within that: `isNewUser` → set-password form;
else `auth.isAuthenticated()` → one-click join; else → log-in-and-join form.

Errors: `404` → "This invitation is invalid or has expired."; `401` → "Invalid password."

---

## Application pages

### `Home` — `app-home`
`src/app/pages/home/home.ts` · **placeholder showcase, meant to be replaced.**

| Member | Type | Meaning |
|---|---|---|
| `capabilities` | `StarterFeature[]` | Static list built from `environment.features`. Each item: `name`, `description`, `enabled`, optional `target`. Disabled features are still listed, marked off. |
| `firstName()` | `string` | Greeting; `''` when the profile has no name. |
| `routeFor(target)` | `string[]` | `'account'` → `['/account']`; `'team'` → `['/teams', <active team id>]`, falling back to `['/teams']` when there is no active team. |
| `auth` | `RhAuthService` | Used by `routeFor` to find the active team. |

### `Teams` — `app-teams`
`src/app/pages/teams/teams.ts`

| Member | Type | Meaning |
|---|---|---|
| `auth` | `RhAuthService` | Template iterates `auth.teams()`. |
| `loading()` | `Signal<boolean>` | True until `loadTeams()` settles (either outcome). |
| `switchTeam(team)` | `void` | No-op if already active; otherwise `auth.switchTeam(team.id)`. |

Template states: loading → empty (`auth.teams().length === 0`) → list. Rows link to
`['/teams', team.id.$oid]`.

### `NewTeam` — `app-new-team`
`src/app/pages/teams/new/new-team.ts`

| Member | Type | Meaning |
|---|---|---|
| `form` | `FormGroup` | `teamName` (required). |
| `saving()` | `Signal<boolean>` | Request in flight. |
| `error()` | `Signal<string \| null>` | Failure message. *Writable from template* (alert dismiss). |
| `created()` | `Signal<TeamMembership \| null>` | On success the form is replaced by a confirmation. *Writable from template.* |
| `createTeam()` | `void` | `auth.createTeam(teamName)`. |

Stays on the page after success rather than navigating, because `createTeam()` does not
yet update `auth.teams()` server-side — the confirmation is the only feedback.

### `TeamDetail` — `app-team-detail`
`src/app/pages/teams/detail/team-detail.ts` · the largest surface: members, invitations, settings, deletion.

**Team**

| Member | Type | Meaning |
|---|---|---|
| `team()` | `Signal<TeamMembership \| undefined>` | Matched from `auth.teams()` by the `:id` route param. |
| `isOwner()` | `() => boolean` | `team()?.role === 'owner'` — gates the invite, settings and danger-zone sections. |
| `features` | `environment.features` | Feature gating. |
| `auth` | `RhAuthService` | Template reads `auth.user()?._id` to avoid offering self-removal. |

**Members**

| Member | Type | Meaning |
|---|---|---|
| `members()` | `Signal<TeamMember[]>` | Loaded on init. |
| `membersLoading()` | `Signal<boolean>` | Loading state. |
| `memberActionPending()` | `Signal<string \| null>` | Email of the member whose row has an action in flight; disables that row's controls. |
| `removingMemberEmail()` | `Signal<string \| null>` | Email whose inline "Remove?" confirmation is showing. |
| `removeMember(member)` | `void` | Removes, then drops the row locally. |
| `confirmRemove(email)` / `cancelRemove()` | `void` | Open/close the inline confirmation. |
| `changeRole(member, role)` | `void` | No-op if unchanged; updates the row locally on success. |

**Invitations**

| Member | Type | Meaning |
|---|---|---|
| `invitations()` | `Signal<PendingInvitation[]>` | Pending invites; each has `email`, `role`, `expired`, `createdAt`. |
| `invitationsLoading()` | `Signal<boolean>` | Loading state. |
| `resendingEmail()` | `Signal<string \| null>` | Resend in flight for this email. |
| `resendSuccessEmail()` | `Signal<string \| null>` | Shows the success alert. *Writable from template.* |
| `resendInvite(invite)` | `void` | Resends and starts the cooldown. |
| `canResend(email)` | `boolean` | False during the **5-minute** cooldown after a resend. |
| `resendCooldownLeft(email)` | `string` | Remaining time as `"3m"`, or `''`. |

**Invite form**

`inviteForm`: `email` (required, email), `role` (`'owner' \| 'member'`, required, default
`'member'`). With `inviteSending()`, `inviteError()` (*writable*), `inviteSent()`
(*writable*; auto-cleared on edit) and `sendInvite()`.
Errors: `409` → "This person is already a member of your team."

**Team settings**

`teamForm`: `name` (required), `description` (optional, rendered as a `<textarea>`). With
`teamSaving()`, `teamSaved()` (*writable*; auto-cleared on edit), `teamError()`
(*writable*) and `saveTeam()`.

**Danger zone**

| Member | Type | Meaning |
|---|---|---|
| `deleteConfirming()` | `Signal<boolean>` | Inline `role="alertdialog"` confirmation. |
| `deleting()` | `Signal<boolean>` | Request in flight. |
| `deleteError()` | `Signal<string \| null>` | Failure message. *Writable from template.* |
| `confirmDelete()` / `cancelDelete()` | `void` | Open/close the confirmation. |
| `deleteTeam()` | `void` | Deletes, then re-runs `auth.checkSession()` to refresh memberships. |

### `Account` — `app-account`
`src/app/pages/account/account.ts`

**Profile**

| Member | Type | Meaning |
|---|---|---|
| `profileForm` | `FormGroup` | `firstName` (required), `lastName` (required). **Starts disabled** and is enabled once the session loads, so the fields cannot be edited against stale values. |
| `profileLoading()` | `Signal<boolean>` | True until `checkSession()` settles. |
| `profileSaving()` | `Signal<boolean>` | Request in flight. |
| `profileSaved()` | `Signal<boolean>` | Success alert. *Writable.* Auto-cleared on any edit. |
| `profileError()` | `Signal<string \| null>` | Failure message. *Writable.* |
| `saveProfile()` | `void` | Saves, then marks the form pristine. |

**Password**

| Member | Type | Meaning |
|---|---|---|
| `passwordForm` | `FormGroup` | `currentPassword` (required), `newPassword` (required, min 8). |
| `passwordSaving()`, `passwordSaved()`, `passwordError()` | as above | `passwordSaved` auto-clears on edit; both alert signals are *writable from template*. |
| `showCurrentPassword()`, `showNewPassword()` | `Signal<boolean>` | Reveal toggles. |
| `changePassword()` | `void` | On success resets both fields. |

The email is displayed read-only from `auth.user()?._id`.

**Pattern worth copying:** `valueChanges` is subscribed **before** `patchValue`, so the
initial data load itself clears the "saved" flag rather than leaving a stale success
message on screen.

---

## Routing surface

Defined in `src/app/app.routes.ts`. Public routes are top-level; everything else is a
child of the `Shell`.

| Path | Title | Guard | Feature flag |
|---|---|---|---|
| `auth/login` | Log in | `publicGuard` | always |
| `auth/signup` | Create an account | `publicGuard` | `emailRegistration \|\| oauthLogin` |
| `auth/verify` | Verifying your email | `publicGuard` | `emailRegistration` |
| `auth/forgot-password` | Forgot password | `publicGuard` | `passwordReset` |
| `auth/reset-password` | Set a new password | `publicGuard` | `passwordReset` |
| `auth/activate`, `invitations/accept` | Accept invitation | none | `teamInvitations` |
| `` (Shell) | — | `authGuard` | always |
| ` └ home` | Home | inherited | always |
| ` └ teams` | Teams | inherited | always |
| ` └ teams/new` | New team | inherited | always |
| ` └ teams/:id` | Team | inherited | always |
| ` └ account` | Account | inherited | always |
| `**` | — | — | redirects to `` |

`AppTitleStrategy` appends `· Ulabase Starter` to every title.

The invitation page (`auth/activate` for a new user, `invitations/accept` for an existing
one: the two links of the service's invitation email) is deliberately **unguarded** — it
must work for signed-out invitees,
signed-in users, and people without an account yet.

When `apiUrl` is invalid, `app.config.ts` provides an **empty route array**, so no guard
ever runs against a missing backend.
