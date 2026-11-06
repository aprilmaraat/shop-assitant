import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: '/welcome' },
  { path: 'welcome', loadChildren: () => import('./pages/welcome/welcome.routes').then(m => m.WELCOME_ROUTES) },
  { path: 'inventory', loadChildren: () => import('./pages/inventory/inventory.routes').then(m => m.INVENTORY_ROUTES) },
  {
    path: 'categories',
    loadComponent: () => import('./pages/inventory-metadata/inventory-metadata').then(m => m.InventoryMetadataComponent),
    data: { metadataType: 'categories' }
  },
  {
    path: 'weights',
    loadComponent: () => import('./pages/inventory-metadata/inventory-metadata').then(m => m.InventoryMetadataComponent),
    data: { metadataType: 'weights' }
  }
];
