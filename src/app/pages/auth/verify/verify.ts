import { Component, PLATFORM_ID, inject, ChangeDetectionStrategy } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { RhAuthService } from '@ulabase/kit-ng';

@Component({
  selector: 'app-verify',
  imports: [RouterLink],
  templateUrl: './verify.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './verify.css',
})
export class Verify {
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(RhAuthService);

  readonly email = this.route.snapshot.queryParamMap.get('email') ?? '';
  readonly token = this.route.snapshot.queryParamMap.get('token') ?? '';
  readonly error = this.route.snapshot.queryParamMap.get('error');

  readonly missingParams = !this.email || !this.token;

  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  constructor() {
    if (!this.missingParams && !this.error && this.isBrowser) {
      // Build the verify URL with fragment delivery (Bearer token mode).
      // The backend verifies the token, then 302-redirects the browser
      // back to the frontend with #access_token=... in the URL hash.
      this.auth.verify(this.email, this.token).subscribe((url) => {
        window.location.href = url;
      });
    }
  }
}
