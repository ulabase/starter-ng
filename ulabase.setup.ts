/**
 * What this starter needs from its Ulabase service.
 *
 *   npm i -D @ulabase/cli
 *   ulabase login
 *   ulabase setup --srv <srvId> --dry-run    # what is missing
 *   ulabase setup --srv <srvId>              # make it so
 *
 * Every step is a `check` and an `apply`: run it against a service already
 * configured and it writes nothing and reports each step satisfied. `--dry-run`
 * runs the checks only, which is the honest answer to "what is this service
 * missing".
 *
 * ## Why the feature flags are read, not written
 *
 * `environment.dev.ts` used to carry this instruction:
 *
 * > Match these to the "Features" toggles of your Ulabase service. A
 * > feature that's off on the server returns 403 to unauthenticated users.
 *
 * Two lists that must agree, kept in step by hand, in different repositories.
 * Nothing checked that they did, and the symptom of drift is a `403` on a
 * button the app went to the trouble of rendering.
 *
 * So this file **imports the same environment the app imports** and derives the
 * server's configuration from it. The flags are stated once. Turning
 * `passwordReset` off in the app and re-running the setup turns it off on the
 * service too, because there is no second place to forget.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { defineSetup, step, fromEnv, isRedacted } from '@ulabase/cli';
import { isApiError } from '@ulabase/cli';
import type { AdminClient, FeatureConfig } from '@ulabase/cli';
import { environment } from './src/environments/environment.dev.ts';

/** Where the app is served from, no trailing slash. */
const APP_URL = (process.env.APP_URL ?? 'http://localhost:4200').replace(/\/$/, '');

/** Shown in verification, reset and invitation emails. */
const APP_NAME = process.env.APP_NAME ?? 'Ulabase Starter';

const f = environment.features;

/** A stored secret reads back as bullets; one never set reads back blank. */
const configured = (value: unknown) =>
  isRedacted(value) || (typeof value === 'string' && value.length > 0);

const section = (config: FeatureConfig, key: string): FeatureConfig =>
  (config[key] as FeatureConfig | undefined) ?? {};

/**
 * The server's toggles, derived from the app's.
 *
 * `emailRegistration` covers two server flags, because from the app's side
 * signing up and confirming the address are one flow: offering the form and
 * then not verifying is not a mode anyone wants.
 */
const features = {
  registration: f.emailRegistration,
  verification: f.emailRegistration,
  'password-reset': f.passwordReset,
  invitations: f.teamInvitations,
  oauth: f.oauthLogin,
};

/**
 * Install a feature, treating "already installed" as the success it is.
 *
 * The step's desired state is that the feature is there. `409 Plugin already
 * installed` says it is, so failing on it reports a problem that does not
 * exist — which is exactly what a forced run does, since the apply then runs
 * against a service where the check would have said yes.
 */
const install = async (admin: AdminClient, srvId: string, featureId: string) => {
  try {
    await admin.installFeature(srvId, featureId);
  } catch (err) {
    if (!isApiError(err) || err.status !== 409) throw err;
  }
};

/**
 * The environment file the app reads its service URL from, next to this setup file whatever the
 * working directory. Read fresh each time: the `environment` import above is the value at start.
 */
const ENV_FILE = new URL('./src/environments/environment.dev.ts', import.meta.url);
const API_URL_LINE = /^(\s*apiUrl:\s*)'[^']*'/m;

/** The `apiUrl` the environment file holds now, or null when it has no such line. */
function apiUrlInFile(): string | null {
  const m = readFileSync(ENV_FILE, 'utf8').match(/^\s*apiUrl:\s*'([^']*)'/m);
  return m ? m[1] : null;
}

/** Exported so a setup that extends this one can keep it last. */
export const appPointsAtService = step('the app points at this service', {
  // Last, on purpose: the app is pointed at the service only once everything above it is in
  // place, so a setup that stopped halfway leaves the "connect your service" screen, not a
  // sign-up page that fails. Only the apiUrl line is rewritten; comments and flags stay.
  check: async ({ admin, srvId }) => apiUrlInFile() === (await admin.serviceToken(srvId)).url,
  apply: async ({ admin, srvId }) => {
    const { url } = await admin.serviceToken(srvId);
    const text = readFileSync(ENV_FILE, 'utf8');
    if (!API_URL_LINE.test(text)) {
      throw new Error(`src/environments/environment.dev.ts has no apiUrl: '...' line to write ${url} into`);
    }
    writeFileSync(ENV_FILE, text.replace(API_URL_LINE, `$1'${url}'`));
  },
});

export default defineSetup('Angular starter', [
  step('accounts feature installed', {
    check: ({ admin, srvId }) => admin.isFeatureInstalled(srvId, 'accounts'),
    apply: ({ admin, srvId }) => install(admin, srvId, 'accounts'),
  }),

  // The app's name goes on the sign-in page and in every email the service sends: the Branding
  // of the service, a feature always on, configured like every other. Color and logo stay as
  // the console set them: the whole configuration is replaced, so they are read first.
  step('branding carries the app name', {
    async check({ admin, srvId }) {
      const current = await admin.getFeatureConfig(srvId, 'branding');
      return current['name'] === APP_NAME;
    },
    async apply({ admin, srvId }) {
      const current = await admin.getFeatureConfig(srvId, 'branding');
      await admin.updateFeatureConfig(srvId, 'branding', { ...current, name: APP_NAME });
    },
  }),

  step('accounts configured to match the app', {
    async check({ admin, srvId }) {
      const config = await admin.getFeatureConfig(srvId, 'accounts');
      const current = section(config, 'features');
      return (
        config['frontend-url'] === APP_URL &&
        config['frontend-app-url'] === APP_URL &&
        Object.entries(features).every(([k, v]) => current[k] === v)
      );
    },
    async apply({ admin, srvId }) {
      const current = await admin.getFeatureConfig(srvId, 'accounts');
      // Read-modify-write with the redaction placeholders passed straight back:
      // the server replaces the whole document and restores the stored value
      // for any field still holding one. Diffing or stripping "empty-looking"
      // fields here would write bullets over a real secret.
      await admin.updateFeatureConfig(srvId, 'accounts', {
        ...current,
        // Where the links in verification, reset and invitation emails point.
        // Wrong, and every one of those emails is a dead end — which is the
        // kind of failure nobody sees until a real user hits it.
        'frontend-url': APP_URL,
        // where a verified or signed-in user lands, the token in the URL fragment: the app itself.
        // Left unset, accounts sends them to its default, http://localhost:4200/app
        'frontend-app-url': APP_URL,
        features: { ...section(current, 'features'), ...features },
      });
    },
  }),

  // Only when the app says it offers Google — a server with the feature on and
  // no credentials answers the OAuth redirect with an error, which is worse
  // than not offering the button.
  ...(f.oauthLogin && (f.oauthProviders as readonly string[]).includes('google')
    ? [
        step('google oauth credentials', {
          async check({ admin, srvId }) {
            const oauth = section(await admin.getFeatureConfig(srvId, 'accounts'), 'oauth');
            const google = (oauth['google'] as FeatureConfig | undefined) ?? {};
            return (
              google['enabled'] === true &&
              configured(google['client-id']) &&
              configured(google['client-secret'])
            );
          },
          async apply({ admin, srvId }) {
            const current = await admin.getFeatureConfig(srvId, 'accounts');
            const oauth = section(current, 'oauth');
            const google = (oauth['google'] as FeatureConfig | undefined) ?? {};
            await admin.updateFeatureConfig(srvId, 'accounts', {
              ...current,
              oauth: {
                ...oauth,
                google: {
                  ...google,
                  enabled: true,
                  // Named, not held: resolved at apply time and only when the
                  // value is not already stored, so a re-run against a
                  // configured service needs no secrets in the environment.
                  'client-id': configured(google['client-id'])
                    ? google['client-id']
                    : fromEnv('GOOGLE_CLIENT_ID'),
                  'client-secret': configured(google['client-secret'])
                    ? google['client-secret']
                    : fromEnv('GOOGLE_CLIENT_SECRET'),
                },
              },
            });
          },
        }),
      ]
    : []),

  step('the app origin may call the service', {
    // The browser calls the service directly, so the service decides which
    // origins it answers. Left unset this is permissive, which is fine on a
    // free service you are learning on and wrong everywhere else — and it is
    // exactly the step that gets skipped, because nothing fails until the day
    // it matters.
    check: async ({ admin, srvId }) => {
      if (!(await admin.isFeatureInstalled(srvId, 'origin-allowlist'))) return false;
      const config = await admin.getFeatureConfig(srvId, 'origin-allowlist');
      const origins = (config['allowed-origins'] as string[] | undefined) ?? [];
      return origins.includes(APP_URL);
    },
    apply: async ({ admin, srvId }) => {
      if (!(await admin.isFeatureInstalled(srvId, 'origin-allowlist'))) {
        await install(admin, srvId, 'origin-allowlist');
      }
      const config = await admin.getFeatureConfig(srvId, 'origin-allowlist');
      const origins = (config['allowed-origins'] as string[] | undefined) ?? [];
      // Added, never replaced: a service reached from more than one origin —
      // localhost and the deployed app — must keep both.
      await admin.updateFeatureConfig(srvId, 'origin-allowlist', {
        ...config,
        'allowed-origins': [...new Set([...origins, APP_URL])],
      });
    },
  }),
  appPointsAtService,
]);
