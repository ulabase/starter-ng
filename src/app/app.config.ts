import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, TitleStrategy } from '@angular/router';
import { provideRhAuth, isValidApiBaseUrl } from '@ulabase/kit-ng';

import { routes, AppTitleStrategy } from './app.routes';
import { consentsOnError } from './consents';
import {
  provideClientHydration,
  withEventReplay,
  withNoIncrementalHydration,
} from '@angular/platform-browser';
import { environment } from '../environments/environment';

// If apiUrl isn't set (or isn't a valid Ulabase URL), provide no
// routes at all — this prevents the router's initial navigation from
// running route guards (e.g. authGuard's checkSession()) against a
// non-existent or invalid backend. See app.html for the "configure your
// service" screen shown in this case.
const activeRoutes = isValidApiBaseUrl(environment.apiUrl) ? routes : [];

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(activeRoutes),
    provideClientHydration(withEventReplay(), withNoIncrementalHydration()),
    // onError sees every failure the kit hits, including the ones no caller is
    // waiting on — session restoration among them, which is what the consents
    // rule blocks.
    provideRhAuth({ apiBaseUrl: environment.apiUrl, onError: consentsOnError }),
    { provide: TitleStrategy, useClass: AppTitleStrategy },
  ],
};
