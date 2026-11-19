# Testing checklist

No automated E2E suite yet — these flows are verified by hand, typically after bumping
`@ulabase/kit`/`@ulabase/kit-ng` or touching anything under `pages/auth/` or
`pages/invitations/`. Use the browser's Network tab where noted — bearer mode should never make an
extra `POST /token` call after `activate`/`reset-password`/`switch-team`; the token comes back
directly in that same request's response.

## Signup & email verification

- [ ] Sign up with a new email/password → confirmation message shown, user not logged in yet
- [ ] Verification email arrives
- [ ] Clicking the verification link logs the user in automatically and lands in the app (welcome banner shown)
- [ ] Network tab: the verify redirect carries `#access_token=...` in the fragment, no extra `/token` call
- [ ] Signing up with an already-registered email shows "account already exists"
- [ ] A weak password is rejected

## Login / logout

- [ ] Login with correct credentials → redirected into the app
- [ ] Login with wrong password → "Invalid email or password"
- [ ] Logout clears the session and redirects to `/auth/login`
- [ ] Reloading the page after login keeps the session
- [ ] Staying idle past ~12 minutes (80% of the 15-minute token TTL) silently renews the session — check Network tab for `GET /token?renew`

## Forgot / reset password

- [ ] "Forgot password" shows the same confirmation for both existing and non-existing emails
- [ ] Reset link → setting a new password logs the user in automatically
- [ ] Network tab: `PATCH /auth/reset-password?delivery=body` returns `access_token` directly — no follow-up `POST /token`
- [ ] Old password stops working after reset; new password works

## Team invitations — new user (`/auth/activate`, invitee has no account yet)

- [ ] Inviting a new email sends an invitation
- [ ] Invite link from the email (`/auth/activate?email=...&token=...`) shows the "set password" form with the correct org name/role — same page as the existing-user flow below, served at both paths
- [ ] Setting the password activates the account and logs the user straight in
- [ ] Network tab: `PATCH /auth/activate?delivery=body` returns `access_token` directly — no follow-up `POST /token`
- [ ] An invalid/expired invite link shows the correct error

## Team invitations — existing user (`/invitations/accept`, invitee already has an account)

- [ ] Inviting an already-registered email sends an invite
- [ ] Accepting while logged out prompts login first, then accepts
- [ ] Accepting while already logged in works directly
- [ ] The new team shows up afterwards in the team switcher

## Team switcher

- [ ] Only visible for users with more than one team
- [ ] Switching teams updates the active team context immediately, no manual refresh needed
- [ ] Network tab: `POST /auth/switch-team?delivery=body` returns the new token directly and the session reflects the new team without a page reload

## OAuth (Google / GitHub)

- [ ] "Sign in with Google/GitHub" completes the provider consent flow and logs the user in
- [ ] A new user via OAuth gets an account + team created automatically
- [ ] OAuth from the invite-activation page accepts the invitation directly (no separate password step)
- [ ] OAuth from the existing-user accept-invite page accepts the invitation directly

## Session / guards

- [ ] Visiting the authenticated shell while logged out redirects to `/auth/login`
- [ ] Visiting `/auth/login` while already logged in redirects into the shell
- [ ] An expired/invalid token clears the session on the next API call instead of hanging or failing silently
- [ ] A hard refresh mid-session preserves the login (SSR renders public routes, CSR takes over the authenticated shell)
