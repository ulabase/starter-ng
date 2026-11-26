import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { oauthUrl } from '../../../oauth-url';

type Provider = 'google' | 'github' | (string & {});

@Component({
  selector: 'app-oauth-buttons',
  imports: [],
  templateUrl: './oauth-buttons.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './oauth-buttons.css',
})
export class OauthButtons {
  readonly providers = input.required<readonly Provider[]>();
  protected readonly oauthUrl = oauthUrl;

  protected label(provider: Provider): string {
    return provider === 'github' ? 'GitHub' : provider.charAt(0).toUpperCase() + provider.slice(1);
  }
}
