import { Routes } from '@angular/router';
import { PointToCoordsComponent } from './components/point-to-coords/point-to-coords.component';
import { CoordsToPointsComponent } from './components/coords-to-points/coords-to-points.component';
import { BboxToCoordsComponent } from './components/bbox-to-coords/bbox-to-coords.component';

export const routes: Routes = [
  { path: 'point-to-coords', component: PointToCoordsComponent },
  { path: 'coords-to-points', component: CoordsToPointsComponent },
  { path: 'bbox-to-coords', component: BboxToCoordsComponent },
  { path: '', redirectTo: '/point-to-coords', pathMatch: 'full' }
];
