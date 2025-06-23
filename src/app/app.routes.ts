import { Routes } from '@angular/router';

export const routes: Routes = [
  { 
    path: 'point-to-coords', 
    loadComponent: () => import('./components/point-to-coords/point-to-coords.component').then(c => c.PointToCoordsComponent)
  },
  { 
    path: 'coords-to-points', 
    loadComponent: () => import('./components/coords-to-points/coords-to-points.component').then(c => c.CoordsToPointsComponent)
  },
  { 
    path: 'bbox-to-coords', 
    loadComponent: () => import('./components/bbox-to-coords/bbox-to-coords.component').then(c => c.BboxToCoordsComponent)
  },
  { 
    path: 'shp-to-map', 
    loadComponent: () => import('./components/shp-to-map/shp-to-map.component').then(c => c.ShpToMapComponent)
  },
  { path: '', redirectTo: '/point-to-coords', pathMatch: 'full' }
];
