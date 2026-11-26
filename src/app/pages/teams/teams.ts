import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { RhAuthService } from '@ulabase/kit-ng';
import type { TeamMembership } from '@ulabase/kit-ng';

@Component({
  selector: 'app-teams',
  imports: [RouterLink],
  templateUrl: './teams.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './teams.css',
})
export class Teams implements OnInit {
  private readonly router = inject(Router);
  protected readonly auth = inject(RhAuthService);
  protected readonly loading = signal(true);
  protected readonly switchingTo = signal<string | null>(null);

  ngOnInit(): void {
    this.auth.loadTeams().subscribe({
      next: () => this.loading.set(false),
      error: () => this.loading.set(false),
    });
  }

  openTeam(team: TeamMembership): void {
    if (team.active) {
      this.router.navigate(['/teams', team.id.$oid]);
      return;
    }
    this.switchingTo.set(team.id.$oid);
    this.auth.switchTeam(team.id).subscribe({
      next: () => {
        this.switchingTo.set(null);
        this.router.navigate(['/teams', team.id.$oid]);
      },
      error: () => this.switchingTo.set(null),
    });
  }
}
