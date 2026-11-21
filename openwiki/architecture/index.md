# Files

- [Application Runtime and SSR](app-runtime.md) - How the ulabase-starter-ng app boots, how hybrid SSR render modes are declared, and how the Express 5 server, hydration, setup screen, and authenticated shell fit together.
- [Auth and Session Architecture](auth-session.md) - Token storage versus RhAuthService signal state, session restore through authGuard and checkSession, fragment-token capture, rhAuthInterceptor 401 handling, and authenticated calls via auth.api().
- [Routing, Guards, and Feature Flags](routing-and-guards.md) - The Angular route map and per-route titles, feature-flag conditional routes, authGuard and publicGuard behavior, the SSR mirror constraint between app.routes.ts and app.routes.server.ts, and the dual-path unguarded invitation route.
