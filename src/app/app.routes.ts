import { Routes } from '@angular/router';
import { PointToCoordsComponent } from './point-to-coords/point-to-coords.component';
import { CoordsToPointsComponent } from './coords-to-points/coords-to-points.component';
import { ShpToBboxComponent } from './shp-to-bbox/shp-to-bbox.component';
import { BboxToCoordsComponent } from './bbox-to-coords/bbox-to-coords.component';

export const routes: Routes = [
  { path: 'point-to-coords', component: PointToCoordsComponent },
  { path: 'coords-to-points', component: CoordsToPointsComponent },
  { path: 'shp-to-bbox', component: ShpToBboxComponent },
  { path: 'bbox-to-coords', component: BboxToCoordsComponent },
  { path: '', redirectTo: '/point-to-coords', pathMatch: 'full' }
];
