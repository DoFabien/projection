import { Component, OnInit, OnDestroy } from '@angular/core';
import { ProjectionsService } from '../shared/projections.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { OrderBy } from '../pipes/order_by.pipe';
import { MatIconModule } from '@angular/material/icon';
import { RoundCoords } from '../pipes/round_coords.pipe';
import { MatButtonModule } from '@angular/material/button';


@Component({
  selector: 'app-coords-to-points',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatFormFieldModule, MatInputModule,  MatCardModule, OrderBy,
        MatIconModule, RoundCoords, MatButtonModule
      ],
  templateUrl: './coords-to-points.component.html',
  styleUrls: ['./coords-to-points.component.scss']
})
export class CoordsToPointsComponent implements OnInit, OnDestroy {

  inputCoords: any = { lat: null, lng: null };
  lngIsValid = false;
  latIsValid = false;
  selectedProjection : {code : string | undefined, url?: any, region? : string, name?: string, lat?: number, lng?: number} = { code: undefined };
  data: any = [];
  orderby: any;


  subscriptionDataLoad;
  subscriptionNewData;
  subscriptionFilterChange;
  subscriptionProjectionCodeChange;


  constructor(public projectionsService: ProjectionsService) {

    /* SUBSCRIPTION */
    this.subscriptionDataLoad = this.projectionsService.eventProjsectionsLoaded.subscribe((data) => {
      this.data = data;
    });

    this.subscriptionNewData = this.projectionsService.eventProjsectionsToWGS84.subscribe((data) => {
      this.data = data.result;
    });

    // le filtre à changé
    this.subscriptionFilterChange = this.projectionsService.eventFilterTextChange.subscribe((data) => {
      this.data = this.projectionsService.getFilterProjection();
      // si la projection selectionné n'est plus dans les datas
      if (!this.projectionsService.projIsPresent(this.selectedProjection.code, data)) {
        this.selectedProjection = { code: undefined };
      }
      if (this.projectionsService.initCoords.coordsToPoints.lng && this.projectionsService.initCoords.coordsToPoints.lat) {
        this.projectionsService.getProjectionsToWGS84(this.projectionsService.initCoords.coordsToPoints.lng,
          this.projectionsService.initCoords.coordsToPoints.lat);
      }
    });


    this.subscriptionProjectionCodeChange = this.projectionsService.eventProjectionCodeSelect.subscribe((data) => {
      this.selectedProjection = this.projectionsService.getProjectionByCode(data.code, this.data);
      if (data.fromMap) {
        if (document.getElementById(data.code)) {
          document.getElementById(data.code)?.scrollIntoView();
        }
      }
    });

  }


  submitNewCoords(latlng: number[]) {
    let lng = Number(latlng[0])
    let lat = Number(latlng[1])
    
    if (latlng[0] && latlng[1] && 
        Number.isFinite(lng) && 
        Number.isFinite(lat)) {
      this.projectionsService.getProjectionsToWGS84(lng, lat);
    }
  }

  scrollToSelectedProjection = function (code: string) {
    if (document.getElementById(code)) {
      document.getElementById(code)?.scrollIntoView();
    }
  };

  orderBy =  (field : string) => {
    this.orderby = (this.orderby === field) ? '-' + field : field;
  };

  onPastLng =  (e: any) => {
    let data: string;
    if (e.clipboardData) {
      data = e.clipboardData.getData('text/plain').trim();
    } else if ((<any>window).clipboardData) { // IE...
      data = (<any>window).clipboardData.getData('Text');
    } else {
      return;
    }

    // Qgis like (12.345,6.7891)
    if (new RegExp('^-?[0-9]+\\.?[0-9]*\\s?,\\s?-?[0-9]+\\.?[0-9]*$', 'g').test(data)) {
      e.preventDefault();
      this.inputCoords.lng = data.split(',')[0].trim();
      this.inputCoords.lat = data.split(',')[1].trim();
    }
    // si on reconnait un WKT
    // tslint:disable-next-line:max-line-length
    if (new RegExp('(LineString|Point|Polygon|MULTIPOLYGON|MULTIPOINT|MULTILINESTRING)\\s*\\(+[0-9]+\\.?[0-9]*\\s[0-9]+\\.?[0-9]', 'i').test(data)) {

      const wkt_corrds :any = /(-?[0-9]+\.?[0-9]*\s-?[0-9]+\.?[0-9]*)/.exec(data); // 1ere coordonnées
      e.preventDefault();
      this.inputCoords.lng = wkt_corrds[0].split(' ')[0].trim();
      this.inputCoords.lat = wkt_corrds[0].split(' ')[1].trim();
    }
  };

  reverseLngLat =  (lng: any, lat :any, isValid: any) => {
    this.inputCoords.lng = lat.value;
    this.inputCoords.lat = lng.value;
    if (isValid[0] && isValid[1]) {
      this.submitNewCoords([this.inputCoords.lng, this.inputCoords.lat]);
    }
  };

  onClickProjection = (_projection_selected :any) => {
    if (this.inputCoords.lng && this.inputCoords.lat) {
      this.projectionsService.setProjectionCodeSelected({ code: _projection_selected.code, fromMap: false });
    }

  };

  ngOnInit() {
    this.inputCoords.lng = this.projectionsService.initCoords.coordsToPoints.lng;
    this.inputCoords.lat = this.projectionsService.initCoords.coordsToPoints.lat;

    if (this.projectionsService.initCoords.coordsToPoints.lat) {
      this.projectionsService.getProjectionsToWGS84(
        this.projectionsService.initCoords.coordsToPoints.lng, this.projectionsService.initCoords.coordsToPoints.lat);
    } else {
      this.data = this.projectionsService.getFilterProjection();
    }



  }


  ngOnDestroy() {
    this.subscriptionDataLoad.unsubscribe();
    this.subscriptionNewData.unsubscribe();
    this.subscriptionFilterChange.unsubscribe();
    this.subscriptionProjectionCodeChange.unsubscribe();
  }

}
