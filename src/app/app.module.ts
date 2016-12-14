import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { MaterialModule } from '@angular/material';
import { RouterModule, Routes } from '@angular/router';

import { AppComponent } from './app.component';
import { PointToCoordsComponent } from './point-to-coords/point-to-coords.component';
import { CoordsToPointsComponent } from './coords-to-points/coords-to-points.component';
import { ShpToBboxComponent } from './shp-to-bbox/shp-to-bbox.component';
import { BboxToCoordsComponent } from './bbox-to-coords/bbox-to-coords.component';

import { ProjectionsService } from './shared/projections.service';
import { GeocoderService } from './shared/geocoder.service';
// import { routing } from './app.routing';
import 'hammerjs';

import { RoundCoords } from './pipes/round_coords.pipe';
import {OrderBy} from './pipes/order_by.pipe';

const appRoutes: Routes = [
  { path: '', redirectTo: '/point-to-coords', pathMatch: 'full' },
  { path: 'point-to-coords', component: PointToCoordsComponent },
  { path: 'coords-to-points', component: CoordsToPointsComponent },
  { path: 'shp-to-bbox', component: ShpToBboxComponent },
  { path: 'bbox-to-coords', component: BboxToCoordsComponent }

];

@NgModule({
  declarations: [
    AppComponent,
    AppComponent,
    PointToCoordsComponent,
    CoordsToPointsComponent,
    ShpToBboxComponent,
    BboxToCoordsComponent,

    RoundCoords,
    OrderBy,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
     RouterModule.forRoot(appRoutes),
    MaterialModule.forRoot()
  ],
  providers: [
    ProjectionsService,
    GeocoderService
    ],
  bootstrap: [AppComponent]
})
export class AppModule { }
