import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: '/welcome' },
  { path: 'welcome', loadChildren: () => import('./pages/welcome/welcome.routes').then(m => m.WELCOME_ROUTES) },
  { path: 'inventory', loadChildren: () => import('./pages/inventory/inventory.routes').then(m => m.INVENTORY_ROUTES) },
  {
    path: 'categories',
    loadComponent: () => import('./pages/catalog/catalog').then(m => m.CatalogComponent),
    data: { catalogType: 'categories' }
  },
  {
    path: 'weights',
    loadComponent: () => import('./pages/catalog/catalog').then(m => m.CatalogComponent),
    data: { catalogType: 'weights' }
  }
];
