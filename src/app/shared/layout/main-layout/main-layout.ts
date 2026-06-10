import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { NAV_ITEMS, NavItem } from './nav-items';

@Component({
  selector: 'app-main-layout',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css'
})
export class MainLayout {
  private readonly auth = inject(AuthService);
  readonly user = this.auth.user;
  readonly navItems = computed(() => NAV_ITEMS.filter((item) => this.canShow(item)));

  logout(): void {
    this.auth.logout();
  }

  private canShow(item: NavItem): boolean {
    if (!item.roles?.length) {
      return true;
    }
    return this.auth.hasAnyRole(item.roles);
  }
}
