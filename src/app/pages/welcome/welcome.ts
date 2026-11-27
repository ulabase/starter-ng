/* ─────────────────────────────────────────────────────────────────────────
   The public first page: what this app is, the Ulabase service it runs on,
   how to connect a coding agent to the Ulabase docs, and how to make the app
   yours. Rendered on the server (app.routes.server.ts), so it arrives as HTML.
   Signed-in users never see it: in the browser, "/" sends them to the app.
   Replace it with your own first page.
   ───────────────────────────────────────────────────────────────────────── */

import { ChangeDetectionStrategy, Component, PLATFORM_ID, afterNextRender, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { getToken } from '@ulabase/kit-ng';
import { environment } from '../../../environments/environment';

const DOCS_MCP = 'https://d0c5a1.ulabase.app/mcp';

/** How each agent adds the docs MCP server. */
const AGENTS = [
  { id: 'claude', name: 'Claude Code', where: 'In the folder of the app:', code: `claude mcp add --transport http ulabase-docs ${DOCS_MCP}` },
  { id: 'cursor', name: 'Cursor', where: 'In .cursor/mcp.json:', code: `{\n  "mcpServers": {\n    "ulabase-docs": { "url": "${DOCS_MCP}" }\n  }\n}` },
  { id: 'vscode', name: 'VS Code', where: 'In .vscode/mcp.json:', code: `{\n  "servers": {\n    "ulabase-docs": { "type": "http", "url": "${DOCS_MCP}" }\n  }\n}` },
  { id: 'other', name: 'Other agents', where: 'An MCP server over HTTP, at the address:', code: DOCS_MCP },
];

type Status = 'checking' | 'answering' | 'not answering';

@Component({
  selector: 'app-welcome',
  imports: [RouterLink],
  templateUrl: './welcome.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './welcome.css',
})
export class Welcome {
  protected readonly agents = AGENTS;
  protected readonly agent = signal(AGENTS[0].id);
  protected readonly shown = computed(() => AGENTS.find(a => a.id === this.agent()) ?? AGENTS[0]);
  protected readonly status = signal<Status>('checking');
  protected readonly apiUrl = environment.apiUrl;
  protected readonly canSignUp = environment.features.emailRegistration || environment.features.oauthLogin;

  /** The service id is the first label of its address: https://c0ffee.ulabase.app. */
  protected readonly serviceId = (() => {
    try {
      return new URL(environment.apiUrl).hostname.split('.')[0];
    } catch {
      return '';
    }
  })();

  constructor() {
    // a signed-in user goes on to the app; the server has no session, so it always renders the page
    if (isPlatformBrowser(inject(PLATFORM_ID)) && getToken()) {
      void inject(Router).navigateByUrl('/home', { replaceUrl: true });
    }

    // the service answers /ping to anyone: a plain way to show the connection is live. In the
    // browser only, so the server-rendered page never waits on it.
    afterNextRender(() => {
      fetch(`${environment.apiUrl}/ping`).then(
        res => this.status.set(res.ok ? 'answering' : 'not answering'),
        () => this.status.set('not answering'),
      );
    });
  }

  protected statusLabel(): string {
    const s = this.status();
    return s === 'checking' ? 'Checking…' : s === 'answering' ? 'Answering' : 'Not answering';
  }
}
