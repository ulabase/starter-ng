# Porting guide — rebuilding this starter in React, Vue, or anything else

**Audience:** an agent (or developer) tasked with producing a port of this starter that is
at **feature, behaviour and visual parity** with the Angular original.

**How to use this document.** Read this file first for architecture and the cross-cutting
mechanisms — those are where ports silently diverge. Then work screen by screen from
`TEMPLATE_API.md`, which specifies every component's state, handlers, forms and error
copy in framework-neutral terms. Finish with the parity checklist at the end.

---

## 1. What is portable, and what is not

This is the single most important section. Most of the starter does **not** need to be
rewritten.

| Layer | Portable? | What to do |
|---|---|---|
| `@ulabase/kit` — auth, teams, invitations, profile, password | ✅ **100%** | Depend on it directly. It is plain TypeScript with a Promise-based API and no framework coupling. **Do not reimplement any auth logic, HTTP call, or token handling.** |
| `src/styles.css` — tokens + default skin | ✅ **100%** | **Copy it verbatim.** It is plain CSS with no framework coupling, so copying it byte-for-byte is what guarantees visual parity. |
| Templates (`*.html`) | ◑ structure yes, syntax no | Port the markup, keeping the **same semantic class hooks**. Control flow (`@if`/`@for`) becomes JSX/`v-if`. |
| Page-specific CSS (`pages/**/*.css`) | ✅ content, ◑ scoping | Copy the rules; swap Angular's emulated encapsulation for CSS Modules (React) or `<style scoped>` (Vue). Keep class names identical. |
| `@ulabase/kit-ng` — reactive wrapper, guards, interceptor | ❌ | Angular-specific. Rebuild the equivalent for your framework — see §2. |
| Routing, guards, titles, SSR config | ❌ | Framework-specific. Reproduce the *contract* in §3–§4. |
| Component classes (`*.ts`) | ❌ syntax, ✅ behaviour | Rebuild using `TEMPLATE_API.md` as the specification. |

**Rule of thumb:** if a file talks to the network or computes a token, you should be
calling `@ulabase/kit` instead of writing it. If a file describes what a screen
looks like, copy it. Only the glue between them is genuinely new work.

---

## 2. The reactive auth layer you must rebuild

`kit-ng` is a thin reactive wrapper over `kit`. Your port needs an equivalent — a store, a
composable, a context provider, whatever is idiomatic. It must expose:

**Reactive state** (all derived from one place, shared app-wide)

| Name | Type | Notes |
|---|---|---|
| `user` | `UserInfo \| null` | `user._id` **is the email** — Ulabase uses email as the user id. Profile name/surname live at `user.profile.name` / `.surname`. |
| `teams` | `TeamMembership[]` | Each has `id.$oid`, `name`, `description`, `role`, `active`. |
| `isAuthenticated` | `boolean` | Derived from `user`. |
| `hasMultipleTeams` | `boolean` | Derived from `teams.length > 1`. |

**Methods** — thin wrappers over `kit`, each updating the state above:

`checkSession`, `register`, `verify`, `login`, `logout`, `forgotPassword`, `resetPassword`,
`updateProfile`, `changePassword`, `invite`, `getInvitation`, `activate`, `acceptInvite`,
`resendInvite`, `listInvitations`, `loadTeams`, `switchTeam`, `listTeamMembers`,
`removeMember`, `updateMemberRole`, `createTeam`, `updateTeam`, `deleteTeam`, `clearSession`.

**Two behaviours that are easy to miss:**

1. `checkSession()` **also loads teams.** It short-circuits to `null` with empty teams when
   there is no stored token (no HTTP call), otherwise fetches the user and then the teams.
   Screens rely on this: the home page reads the active team without ever calling
   `loadTeams()` itself, because the auth guard already ran `checkSession()`.
2. `login()` **also loads teams**, in the same round trip.

Get these wrong and team-dependent UI is intermittently empty.

**Also port:** an HTTP layer that attaches the bearer token and clears the session on
401/expiry, and `scheduleRefresh()` from the kit — the token has a 15-minute TTL and is
silently renewed at ~80%.

---

## 3. Routing and guard contract

Two guards:

- **`authGuard`** — runs `checkSession()`; if there is no user, redirect to `/auth/login`.
- **`publicGuard`** — the inverse: if there *is* a user, redirect into the app. Applied to
  every auth screen so a signed-in user cannot land on the login form.

The invitation page is served at `/auth/activate` and `/invitations/accept`: the service's
invitation email links a new user to the first, an existing one to the second. Both are
deliberately **unguarded** — the page must work for signed-out invitees,
signed-in users, and people who do not have an account yet.

Route table, titles and feature-flag gating: see the routing section at the end of
`TEMPLATE_API.md`. Page titles are `"<Route title> · Ulabase Starter"`.

---

## 4. Cross-cutting mechanisms — reproduce these exactly

These are the parts a port most often gets wrong, because they are invisible until a
specific flow breaks.

### 4.1 Fragment token capture

After email verification and after OAuth, the backend **302-redirects to your app** with
the token in the URL *fragment*:

```
https://your-app/#access_token=…&token_type=Bearer&expires_in=900
```

On app start (browser only), before routing settles, you must:

1. Parse `window.location.hash`; if `access_token` is present, store it and start the
   refresh schedule.
2. Read `?flow=signup` — a one-shot marker present **only** on the redirect that follows a
   fresh signup — and raise an in-memory "just signed up" flag.
3. Clear both the fragment and the `flow` param via `history.replaceState`, so neither
   lingers in browser history.

The "just signed up" flag must be **in-memory only, never persisted**, read once by the
shell to show the welcome banner and then reset. Persisting it makes the banner reappear on
later logins.

It fires for **any** fresh signup — email verification *and* OAuth — so the banner copy
must not claim an email was verified. (Getting this wrong was a real bug here.)

### 4.2 No routes when the backend is unconfigured

When `apiUrl` is missing or is not a valid Ulabase URL
(`isValidApiBaseUrl()` from the kit), the app registers an **empty route table** and
renders the "connect your service" screen instead of the router.

This is not cosmetic: it prevents the initial navigation from running `authGuard` →
`checkSession()` against a non-existent backend, which otherwise produces a confusing
network error on first run.

That screen should distinguish **"`apiUrl` is not set"** from **"`apiUrl` is set but is not
a `.ulabase.app` address"**, and must name the environment file the *dev server* actually
uses — pointing users at the production env file when they are running a dev server is a
trap this starter originally fell into.

### 4.3 Feature flags gate three things

Flags (`emailRegistration`, `passwordReset`, `oauthLogin`, `oauthProviders`,
`teamInvitations`) must be mirrored from the service's Sign-up Mgmt → Features settings,
and each flag must gate **all** of:

1. the client route,
2. the SSR/prerender route entry, if your framework has one — a mismatch fails the build,
3. every link and UI block that offers the feature.

A feature that is off server-side returns 403, so leaving the UI visible produces dead ends.

### 4.4 OAuth is a plain link

OAuth is **not** a fetch. Render a normal anchor to:

```
${apiUrl}/auth/oauth/authorize/${provider}?noauthchallenge
```

and let the browser navigate. The flow returns via §4.1.

### 4.5 Bearer delivery — no double round trip

`activate`, `reset-password` and `switch-team` are called with `?delivery=body` and return
the new `access_token` **in the same response**. A correct port never issues a follow-up
`POST /token` after these. Watch the network tab when verifying.

### 4.6 Theme

A light/dark toggle that adds/removes `.dark` on the document element and persists the
choice in `localStorage['rh-theme']`. Every colour is a token, so dark mode is purely a
token override — no per-component work.

**Guard any `localStorage`/`document` access behind a client-side check** if your port
prerenders or server-renders. In the Angular original this service is only reachable from a
client-rendered route, which hides the problem; a port that renders it on the server will
crash.

---

## 5. Design system contract

Copy `src/styles.css` verbatim, then honour these rules — they are what make the result
look intentional rather than merely styled:

- **Tokens are the only source of colour, type, spacing and shape.** No hardcoded colours
  anywhere outside the `:root` blocks. This is what makes dark mode and re-theming free.
- **The skin is disposable and clearly labelled.** It must remain deletable in one move
  without breaking template structure.
- **Templates carry only the shared class hooks** (`.card`, `.btn-primary`, `.form-field`,
  …). Page-specific layout classes live in the page's own stylesheet. The full hook list is
  in the README swap map.
- **The "blueprint" design language:** flat crisp surfaces; squared radii; a faint dot-grid
  page background; one accent (amber) for primary actions, teal for links and success;
  **UI chrome in small uppercase monospace — form labels, back links, secondary buttons,
  nav links, the wordmark — but never user data.** Team names and emails stay in normal
  type. This distinction is the core of the aesthetic; applying the monospace treatment to
  user data breaks it.
- **Accessibility is part of parity**, not a later pass: one consistent focus ring, a
  skip-to-content link, `role="menu"`/`menuitem` with Escape-to-close and focus return on
  the user menu, `role="alertdialog"` on destructive confirmations, `aria-describedby` +
  `aria-invalid` on invalid fields, `role="status"` for success and `role="alert"` for
  errors.
- **Responsive:** everything must hold at ~375px. Side-by-side form fields, the shell
  header, and the member/team rows all stack at ≤560px.

---

## 6. Behaviour parity: UX patterns to preserve

Beyond per-screen state (in `TEMPLATE_API.md`), these app-wide patterns are deliberate:

- **One feedback component.** All success/error messaging goes through a single presentational
  alert with `type`, auto-dismiss (~4s), a manual dismiss, and correct ARIA. The parent owns
  the state and resets it in the close handler.
- **Success messages clear on edit.** Subscribe to form changes *before* seeding initial
  values, so loading data does not leave a stale "Saved!" on screen.
- **Every list has three states** — loading, empty, populated. A bare empty list reads as broken.
- **Destructive actions confirm inline**, never with `window.confirm()`.
- **In-flight actions disable their own row/button** and swap the label ("Save changes" →
  "Saving…"), rather than showing a global spinner.
- **A navigation progress bar** appears while a lazily-loaded route is fetched.
- **Resending an invitation has a 5-minute cooldown**, with the remaining time shown on the
  button.
- **Users cannot remove themselves** from a team — the row shows the role instead of actions.
- **Team creation stays on the page** after success instead of navigating, because the new
  team does not yet appear in the team list server-side.

---

## 7. Framework mapping

| Angular | React | Vue |
|---|---|---|
| `signal()` / `computed()` | `useState` / `useSyncExternalStore`, or a store (Zustand, Jotai) | `ref()` / `computed()` |
| Service + `inject()` | Context provider or store module | `provide`/`inject`, or Pinia |
| `RhAuthService` | `useAuth()` hook over a shared store | `useAuth()` composable / Pinia store |
| `canActivate` guard | Route loader, or a wrapper component that redirects | `beforeEnter` / `beforeEach` navigation guard |
| Reactive forms + `Validators` | React Hook Form + Zod, or controlled state | `vee-validate`, or plain refs |
| `@if` / `@for` | `{cond && …}` / `.map()` | `v-if` / `v-for` |
| Component `styleUrl` (emulated encapsulation) | CSS Modules | `<style scoped>` |
| `TitleStrategy` | Router meta + effect | Router meta + `afterEach` |
| SSR render modes | Framework SSR/SSG config | Framework SSR/SSG config |

Keep the same file layout (`pages/auth/`, `pages/teams/`, `ui/alert/`, …) and the same
component names. It makes the three ports reviewable side by side and lets one document
serve all of them.

---

## 8. Parity checklist

Structure and setup

- [ ] Depends on `@ulabase/kit`; no auth logic, HTTP call or token handling reimplemented.
- [ ] `src/styles.css` copied verbatim; no hardcoded colours introduced outside `:root`.
- [ ] Same file layout and component names; same semantic class hooks in templates.
- [ ] Feature flags gate client routes, SSR routes, *and* the UI that links to them.
- [ ] Unconfigured `apiUrl` → empty route table + "connect your service" screen that
      distinguishes unset from invalid and names the dev environment file.

Flows — walk each end to end

- [ ] Signup → verification email → link logs the user straight in, welcome banner shows.
- [ ] Signup generates the `teamName` (`"<First>'s Team"`, else `"<email-local-part>'s Team"`).
- [ ] Login, logout, session survives reload, silent token renewal at ~80% of the 15-min TTL.
- [ ] Forgot password shows the **same** confirmation for known and unknown emails.
- [ ] Reset password logs the user in directly; no follow-up `POST /token`.
- [ ] Invitation, new user → set-password form → activated and logged in.
- [ ] Invitation, existing user, signed out → log in and join.
- [ ] Invitation, existing user, signed in → one-click join.
- [ ] Invalid/expired invitation shows the right error.
- [ ] OAuth signup and OAuth invitation acceptance.
- [ ] Team switching updates context with no reload; members, roles, invites, settings, deletion.
- [ ] Profile update and password change.

Cross-cutting

- [ ] Fragment token captured and cleared from history; `?flow=signup` consumed once,
      in memory only; banner copy true for OAuth signups too.
- [ ] Guards: authenticated routes redirect out when signed out; auth routes redirect in
      when signed in; `/auth/activate` and `/invitations/accept` reachable in every state.
- [ ] Per-route titles with the shared suffix.
- [ ] Every list has loading / empty / populated states.
- [ ] Success messages auto-dismiss and clear on edit.
- [ ] Accessibility: focus ring, skip link, keyboard-navigable user menu, alertdialog
      confirmations, field ARIA, announced success and errors.
- [ ] Layout holds at ~375px; dark mode legible throughout.
