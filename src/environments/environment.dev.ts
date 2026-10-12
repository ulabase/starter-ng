export const environment = {
  // Your free Ulabase service, e.g. 'https://<srvid>.ulabase.app'.
  // `npx ulabase setup --srv <srvid>` writes it here for you. Empty in the
  // starter's own repository: empty shows the "configure your service" screen.
  apiUrl: '',

  // Match these to the "Features" toggles of your Ulabase service
  // (Your Service → Sign-up Mgmt → Features). A feature that's off on the
  // server returns 403 to unauthenticated users — set the matching flag
  // here to false so the app doesn't offer UI for it.
  features: {
    emailRegistration: true, // Registration & Verification
    passwordReset: true, // Password Reset
    oauthLogin: false, // Google sign-in: off until you create its OAuth client (README, "Google sign-in")
    oauthProviders: ['google'] as const, // must match what's configured server-side
    teamInvitations: true, // Team Invitations
  },
};
