---
type: design-system-and-porting-reference
title: Theming and Porting
description: Design-token theming and the disposable skin in src/styles.css, the semantic class hooks and the shared Alert component, and the portable-vs-rebuild matrix for producing non-Angular ports at parity.
tags: [theming, design-tokens, css, skin, class-hooks, alert, porting, parity, cross-framework]
verified:
  - by: openwiki/0.9.0
    at: 2026-11-21T15:24:47.543Z
sources:
  - id: openwiki-source-4e7cd7f381c92e8c5d89f5c1
    resource: repo://NOTES.md
  - id: openwiki-source-0d11ea3a28bf7372369b0bc9
    resource: repo://PORTING.md
  - id: openwiki-source-95f8bad88820f1312dc7abd6
    resource: repo://src/app/pages/account/account.html
  - id: openwiki-source-ce62131b99c2642b4012b428
    resource: repo://src/app/pages/auth/login/login.html
  - id: openwiki-source-d4ff23b44acdcb90d6eef455
    resource: repo://src/app/pages/auth/signup/signup.html
  - id: openwiki-source-0980df84d522a6755217a044
    resource: repo://src/app/pages/shell/shell.html
  - id: openwiki-source-9fd5be7b4a86f1a62c53cab3
    resource: repo://src/app/pages/shell/shell.ts
  - id: openwiki-source-18c6764cc67ac87370b274d4
    resource: repo://src/app/pages/teams/detail/team-detail.html
  - id: openwiki-source-8a0090a686412a9b27bc6be6
    resource: repo://src/app/theme.service.ts
  - id: openwiki-source-52ae6f1ca6fb4d6c7c836dca
    resource: repo://src/app/ui/alert/alert.ts
  - id: openwiki-source-7335dab2b9628607110f6b96
    resource: repo://src/index.html
  - id: openwiki-source-146419bb9b2415894a6bd677
    resource: repo://src/styles.css
  - id: openwiki-source-771ac933b1dd0c426922576f
    resource: repo://TEMPLATE_API.md
generated: { by: "openwiki/0.9.0", at: "2026-11-21T15:24:47.543Z" }
---

# Theming and Porting

The starter's visual system is deliberately thin: one stylesheet of design tokens plus a
disposable skin, a small vocabulary of semantic class hooks in templates, and a single
shared feedback component. That thinness is what makes both re-theming and porting
mechanical rather than creative work. This page covers the token/skin layer, the class-hook
contract and `Alert`, and what to carry versus rebuild when porting to another framework.

For per-template state and handler bindings, see
[`TEMPLATE_API.md`](../../TEMPLATE_API.md). For setup and build operations see the
[Runbook](runbook.md); for bootstrap and SSR behaviour see
[Application Runtime and SSR](../architecture/app-runtime.md); for a file-level map see
[Source Map](../source-map.md).

## Design tokens and the disposable skin

[`src/styles.css`](../../src/styles.css) is the entire visual layer. It is plain CSS with no
framework coupling and is meant to be copied verbatim or replaced outright. The header
block labels it a **disposable default skin** — a cohesive, high-craft mockup, not a
finished product.

### Section structure

The stylesheet is organised into numbered sections so the skin can be deleted in one move:

| # | Section | Role |
|---|---|---|
| 1 | Design tokens (`:root`) | The single source of colour, type, space, shape, motion, elevation and focus. Colour tokens cover background, surfaces, borders, text, the amber primary accent, teal link/success, error colours and the faint drafting-grid overlay; typography tokens cover family, mono, size scale, leading and the label tracking used by the uppercase-chrome motif; spacing is a `--space-*` scale; shape covers radii and border width. |
| — | Dark mode (`:root.dark`) | Class-based override of the colour and elevation tokens only, sitting immediately after section 1. Because every colour flows through a token, dark mode needs no per-component work. |
| 2 | Base | Element-level defaults (`box-sizing`, body typography, form controls, inline code, the single focus ring). These reach every component, including page-specific ones, so the whole app inherits the design language. |
| 3 | Default skin | Semantic class-hook rules: cards, buttons, forms, feedback, small UI, placeholder/skeleton utilities. **Marked `DELETE ME`** — delete this section when adopting a UI framework. |
| 4 | Auth pages | Centred auth layout (`.auth-page`, `.auth-card`, `.auth-links`, `.divider`) for login, signup, forgot/reset password, verify and accept-invite. |
| 5 | Config page | The "connect your service" screen shown instead of the app when `environment.apiUrl` is missing or invalid. |
| 6 | Responsive | Breakpoints at `max-width: 560px`: side-by-side form fields, cards and auth cards stack; spacing tightens. |
| 7 | Reduced motion | `@media (prefers-reduced-motion: reduce)` neutralises animation and transition durations. |

Sections 3–5 carry the default skin; sections 1–2 and the dark-mode override are the
token/base layer worth keeping unless the adopted framework brings its own.

### Retheming is token-first

Two documented routes, in order of effort:

1. **Tweak the skin.** Change the tokens in section 1 (colours, type scale, spacing,
   radii) — every component reads them, so this re-themes the whole app including dark
   mode in one edit. Optionally adjust section-3 skin classes for different shapes, and
   replace the shell layout and home content with your own.
2. **Replace the skin.** Adopt Material / Spartan / PrimeNG / Tailwind / your own: delete
   sections 3–5 of `styles.css` (they are marked), keep section 1 if you want the tokens or
   drop it too, then reskin the templates using the class-hook swap map in
   [`NOTES.md`](../../NOTES.md) ("Making it yours"). Because templates
   reference only the stable class-hook vocabulary below, this is a mechanical
   find-and-replace.

The design language is a "blueprint" aesthetic: flat crisp surfaces carried by borders and
typography rather than shadows; squared radii and a faint dot grid; UI chrome (form labels,
back links, secondary actions) in small uppercase monospace — never applied to user data;
one amber accent for primary actions and teal for links and success.

### Dark mode and `ThemeService`

[`src/app/theme.service.ts`](../../src/app/theme.service.ts) owns the light/dark toggle.
It exposes a `dark` signal, and `toggle()` adds or removes the `.dark` class on
`document.documentElement` while persisting the choice in `localStorage['rh-theme']`
(`'dark'` or `'light'`). The toggle button lives in the authenticated shell
([`src/app/pages/shell/shell.html`](../../src/app/pages/shell/shell.html)).

Two invariants matter for ports and for anyone touching auth pages:

- **Guard browser-only APIs.** `localStorage` and `document` do not exist on the server.
  The service checks `isPlatformBrowser(PLATFORM_ID)` before touching either. The
  Angular original only injects it from a client-rendered shell, which hides the problem;
  a port that renders it during SSR/prerender will crash without the same guard. See
  "SSR build breaks with ThemeService" in the [Runbook](runbook.md).
- **Avoid a flash of the wrong theme.** [`src/index.html`](../../src/index.html) runs a
  tiny inline script before Angular bootstraps that reads the same `rh-theme` key and adds
  `.dark` early. The key must stay in sync with `STORAGE_KEY` in `theme.service.ts`, and
  the read is wrapped in `try`/`catch` because `localStorage` throws when storage is
  blocked.

## Semantic class hooks and the Alert component

Templates carry only a small, stable vocabulary of semantic class hooks — `.card`,
`.btn-primary`, `.form-field`, `.form-error`, `.success-msg`, `.muted`, `.badge` and so on.
Shared visual primitives live in `styles.css` section 3; page-specific layout
(`.team-row`, `.member-row`, `.feature-grid`, …) stays in the page's own stylesheet and is
**not** part of the contract. Per-template bindings (signals, handlers, form controls) are
specified in [`TEMPLATE_API.md`](../../TEMPLATE_API.md).

The full hook list and framework mappings (Tailwind / Material examples) are documented as
a swap map in [`NOTES.md`](../../NOTES.md) ("Making it yours"); the
contract is that class names stay identical across ports so the three ports remain
reviewable side by side.

### Alert — one feedback primitive

[`src/app/ui/alert/alert.ts`](../../src/app/ui/alert/alert.ts) is the single shared
feedback component. It is presentational and carries **no stylesheet of its own** — only
the `.success-msg` / `.form-error` class hooks plus the correct ARIA role.

| Member | Type | Default | Behaviour |
|---|---|---|---|
| `type` | `'success' \| 'error'` | required | Picks the class hook (`.success-msg` / `.form-error`) and the ARIA role (`status` / `alert`). |
| `dismissible` | `boolean` | `true` | Renders the manual dismiss button (`aria-label="Dismiss"`). |
| `autoDismiss` | `number` (ms) | `4000` | Emits `close` after this delay; `0` disables auto-dismiss. |
| `close` | `void` output | — | Fired on dismiss click or auto-dismiss elapsed. |

Content is projected; the **parent owns the state** and must reset its own signal in the
`(close)` handler, e.g. `(close)="error.set(null)"`. All success and error messaging across
login, signup, reset-password, invitation accept, team detail, team creation and the
account page routes through this one component — swap it and every message follows.

Alert's styling is intentionally minimal host-level layout (flex row, dismiss button
spacing). Anything beyond the two class hooks belongs in the skin, not in the component.

## Portable-vs-rebuild matrix

The porting contract (see [`PORTING.md`](../../PORTING.md) for the full parity checklist)
turns on one rule of thumb: **if a file talks to the network or computes a token, call
`@ulabase/kit`; if a file describes what a screen looks like, copy it.** Only the glue
between them is new work.

| Layer | Portable? | What to do |
|---|---|---|
| `@ulabase/kit` — auth, teams, invitations, profile, password | **100 %** | Depend on it directly. Plain TypeScript with a Promise-based API and no framework coupling. Do not reimplement auth logic, HTTP calls or token handling. |
| `src/styles.css` — tokens + default skin | **100 %** | Copy verbatim. It is plain CSS; byte-for-byte copying is what guarantees visual parity. |
| Templates (`*.html`) | structure yes, syntax no | Port the markup keeping the **same semantic class hooks**. Angular control flow (`@if`/`@for`) becomes JSX / `v-if` / `v-for`. |
| Page-specific CSS (`src/app/pages/**/*.css`) | content yes, scoping swap | Copy the rules; swap Angular's emulated encapsulation for CSS Modules (React) or `<style scoped>` (Vue). Keep class names identical. |
| `@ulabase/kit-ng` — reactive wrapper, guards, interceptor | **no** | Angular-specific. Rebuild the equivalent (store, composable, context provider) exposing the reactive state and thin method wrappers documented in `PORTING.md` §2. |
| Routing, guards, titles, SSR config | **no** | Framework-specific. Reproduce the *contract* (auth/public guard semantics, per-route titles, SSR route table mirroring, feature-flag gating). |
| Component classes (`*.ts`) | syntax no, behaviour yes | Rebuild using [`TEMPLATE_API.md`](../../TEMPLATE_API.md) as the specification. |

Also port the HTTP layer that attaches the bearer token and clears the session on
401/expiry, and `scheduleRefresh()` from the kit (15-minute token TTL, silently renewed at
~80 %).

### Cross-cutting behaviours a port most often gets wrong

These are invisible until a specific flow breaks; `PORTING.md` §4–6 is the authoritative
list. In summary:

- **Fragment token capture** — after email verification and OAuth, parse
  `window.location.hash` for `access_token`, consume the one-shot `?flow=signup` marker in
  memory only, then clear both via `history.replaceState`.
- **Empty route table when `apiUrl` is unconfigured** — register no routes and render the
  "connect your service" screen, distinguishing unset from invalid and naming the dev
  server's environment file.
- **Feature flags gate three things** — client route, SSR/prerender route entry, and every
  link/UI block offering the feature.
- **OAuth is a plain anchor**, not a fetch, to `${apiUrl}/auth/oauth/authorize/${provider}?noauthchallenge`.
- **Bearer delivery via `?delivery=body`** on `activate`, `reset-password` and
  `switch-team` — no follow-up `POST /token`.
- **Theme** — `.dark` on the document element, persisted in `localStorage['rh-theme']`,
  browser access guarded.
- **UX patterns** — one feedback component (Alert), success messages clear on edit, every
  list has loading/empty/populated states, destructive actions confirm inline, in-flight
  actions disable their own row/button, navigation progress bar on lazy routes, 5-minute
  invitation-resend cooldown, users cannot remove themselves from a team.

### Framework mapping quick reference

| Angular | React | Vue |
|---|---|---|
| `signal()` / `computed()` | `useState` / `useSyncExternalStore`, or a store | `ref()` / `computed()` |
| Service + `inject()` | Context provider or store module | `provide`/`inject`, or Pinia |
| `canActivate` guard | Route loader, or wrapper redirect component | `beforeEnter` / `beforeEach` |
| Reactive forms + `Validators` | React Hook Form + Zod, or controlled state | `vee-validate`, or plain refs |
| `@if` / `@for` | `{cond && …}` / `.map()` | `v-if` / `v-for` |
| Component `styleUrl` (emulated encapsulation) | CSS Modules | `<style scoped>` |
| `TitleStrategy` | Router meta + effect | Router meta + `afterEach` |

Keep the same file layout (`pages/auth/`, `pages/teams/`, `ui/alert/`, …) and component
names so one document serves every port and the ports are reviewable side by side.

## See also

- [Runbook](runbook.md) — build, serve, SSR deployment and troubleshooting
- [Application Runtime and SSR](../architecture/app-runtime.md) — bootstrap chain and render modes
- [Source Map](../source-map.md) — file-by-file navigation
- [`PORTING.md`](../../PORTING.md) — framework-neutral behaviour spec and parity checklist
- [`TEMPLATE_API.md`](../../TEMPLATE_API.md) — per-template bindings
- [`NOTES.md`](../../NOTES.md) — class-hook swap map ("Making it yours") and deeper notes
