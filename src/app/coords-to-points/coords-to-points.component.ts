import { Component, OnInit, OnDestroy } from '@angular/core';
import { ProjectionsService } from '../shared/projections.service';


@Component({
  selector: 'app-coords-to-points',
  templateUrl: './coords-to-points.component.html',
  styleUrls: ['./coords-to-points.component.scss']
})
export class CoordsToPointsComponent implements OnInit, OnDestroy {

  inputCoords = { lat: null, lng: null };
  lngIsValid = false;
  latIsValid = false;
  selectedProjection = { code: null };
  data: any = [];
  orderby;


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
        this.selectedProjection = { code: null };
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
          document.getElementById(data.code).scrollIntoView();
        }
      }
    });

  }


  submitNewCoords(latlng) {
    if (latlng[0] && latlng[1]) {
      this.projectionsService.getProjectionsToWGS84(latlng[0], latlng[1]);
    }
  }

  scrollToSelectedProjection = function (code) {
    if (document.getElementById(code)) {
      document.getElementById(code).scrollIntoView();
    }
  };

  orderBy = function (field) {
    this.orderby = (this.orderby === field) ? '-' + field : field;
  };

  onPastLng = function (e) {
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

      const wkt_corrds = /(-?[0-9]+\.?[0-9]*\s-?[0-9]+\.?[0-9]*)/.exec(data); // 1ere coordonnées
      e.preventDefault();
      this.inputCoords.lng = wkt_corrds[0].split(' ')[0].trim();
      this.inputCoords.lat = wkt_corrds[0].split(' ')[1].trim();
    }
  };

  reverseLngLat = function (lng, lat, isValid) {
    this.inputCoords.lng = lat.value;
    this.inputCoords.lat = lng.value;
    if (isValid[0] && isValid[1]) {
      this.submitNewCoords([this.inputCoords.lng, this.inputCoords.lat]);
    }
  };

  onClickProjection = function (_projection_selected) {
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
