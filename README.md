# Ulabase Starter — Angular

[![CLA assistant](https://cla-assistant.io/readme/badge/ulabase/starter-ng)](https://cla-assistant.io/ulabase/starter-ng)

An Angular app with sign-up, login, Google and GitHub sign-in, email verification, password reset,
teams and invitations — working, not sketched. Clone it, point it at a free service, and you have
the boring half of an application already done.

It is an Angular app plus a [Ulabase](https://ulabase.com) service. There is no
server of yours to write, deploy or pay for.

![Ulabase Starter Home Page](./starter-home-page.png)

## Get it running

**You need:** [Node.js](https://nodejs.org) 22.18 or later (it runs the TypeScript setup file) and a free Ulabase service.
Signing up is free.

### 1. Clone it

```bash
git clone https://github.com/ulabase/starter-ng.git
cd starter-ng
npm install
```

### 2. Create a service

Create a **free service** at [ulabase.com](https://ulabase.com). Its id is the six characters at the
start of its URL: you give it to the setup below.

### 3. Set the service up

The app needs things of its service: the accounts feature installed, sign-up and password reset
switched on, your origin allowed to call it. `ulabase` puts them there from a file in this repo, so
there is no console checklist to follow.

```bash
npm install -g ulabase
ulabase login                              # paste a token from ulabase.com
ulabase setup --srv <srvId>
```

The last step writes the service URL into `src/environments/environment.dev.ts` (`apiUrl`), the file `ng serve` uses.
Set `src/environments/environment.ts` too when you build for production, and commit both
when you publish your app.

`<srvId>` is the six-character id of your service — the first label of its URL. Every step is a
check and an apply, so running it twice writes nothing. `--dry-run` tells you what a service is
missing without touching it.

**Want users to accept Terms and a Privacy Policy first?** Use the other setup file instead:

```bash
ulabase setup --srv <srvId> --file ulabase.setup.consents.ts
```

Same setup with four more documents, and the app then blocks anyone who has not accepted the
current versions until they do. The rule lives on the server, so it holds for a mobile client and
for `curl` too — not just for this app. Skip the file and nobody is ever asked: the acceptance
screen is waiting for a refusal that never comes.

Either way, replace `public/terms.html` and `public/privacy.html` — they are placeholders.

**Google sign-in, when you want it.** The app starts with email and password, so it runs
without any Google setup. To add the Google button:

1. In the Google Cloud console, create an OAuth client of type *Web application* with this
   redirect URI: `https://<srvId>.ulabase.app/auth/oauth/callback/google`.
2. In `src/environments/environment.dev.ts`, set `oauthLogin: true` (`oauthProviders` already lists `google`).
3. Run the setup again with the client's credentials. They go to the service, never into the app:

```bash
GOOGLE_CLIENT_ID=… GOOGLE_CLIENT_SECRET=… ulabase setup --srv <srvId>
```

### 4. Start it

```bash
ng serve
```

Sign up, check your inbox, and you are in.

## Making it yours

The look is a scaffold, meant to be thrown away — `src/styles.css` holds the design tokens and a
disposable skin, and the home page is a placeholder for your own content. Change the tokens and
the whole app re-themes, dark mode included.

For the route map, the class hooks to restyle, how to call your own collections with the session
attached, and how the consents gate works inside, see [NOTES.md](./NOTES.md).

## Something not working?

**Everything fails, and the console says the origin is not allowed.** The service only answers
pages it has been told about. Re-run `ulabase setup` after changing where the app is served from, or
add the origin under *Service → Origin Allowlist*.

**A page is missing and its link is gone.** The feature flags in `environment.dev.ts` must match
the service's *Sign-up Mgmt → Features* toggles. `ulabase setup` reads the flags from that same file
and sets the service to match, so re-running it is usually the fix.

**`401` on a request you wrote yourself.** A plain `fetch` carries no session. Use `auth.api()`,
which attaches it — see [NOTES.md](./NOTES.md#reading-your-own-data).

**`ulabase` runs something about OpenShift.** A different, retired tool of the same name is first in
your `PATH`. `type -a ulabase` shows both.

## More

- [Ulabase documentation](https://ulabase.com/docs/)
- [`@ulabase/kit-ng`](https://ulabase.com/docs/kit) — the library this is built on
- [The `ulabase` CLI](https://ulabase.com/docs/cli)
