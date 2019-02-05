import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HttpModule } from '@angular/http';
import { AppComponent } from './app.component';

import { PointToCoordsComponent } from './point-to-coords/point-to-coords.component';
import { CoordsToPointsComponent } from './coords-to-points/coords-to-points.component';
import { ShpToBboxComponent } from './shp-to-bbox/shp-to-bbox.component';
import { BboxToCoordsComponent } from './bbox-to-coords/bbox-to-coords.component';

import { ProjectionsService } from './shared/projections.service';
import { GeocoderService } from './shared/geocoder.service';

import {MatButtonModule, MatCheckboxModule, MatIconModule,
        MatInputModule,
        MatFormFieldModule} from '@angular/material';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {MatCardModule} from '@angular/material/card';
import {MatSelectModule} from '@angular/material/select';
import {MatTooltipModule} from '@angular/material/tooltip';

import { RoundCoords } from './pipes/round_coords.pipe';
import {OrderBy} from './pipes/order_by.pipe';
import {FilterPipe} from './pipes/filter.pipe';


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
    PointToCoordsComponent,
    CoordsToPointsComponent,
    ShpToBboxComponent,
    BboxToCoordsComponent,

    RoundCoords,
    OrderBy,
    FilterPipe
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpModule,
    MatButtonModule, MatCheckboxModule, MatIconModule, MatInputModule, MatFormFieldModule, FormsModule,
    MatSlideToggleModule, MatCardModule, MatSelectModule, MatTooltipModule,
    RouterModule.forRoot(appRoutes, { useHash: true })
  ],
  providers: [
              ProjectionsService,
              GeocoderService
            ],
  bootstrap: [AppComponent]
})
export class AppModule { }
