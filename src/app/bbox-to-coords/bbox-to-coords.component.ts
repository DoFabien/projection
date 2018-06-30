import { Component, OnInit, OnDestroy } from '@angular/core';
import { ProjectionsService } from '../shared/projections.service';

@Component({
  selector: 'app-bbox-to-coords',
  templateUrl: './bbox-to-coords.component.html',
  styleUrls: ['./bbox-to-coords.component.scss']
})
export class BboxToCoordsComponent implements OnInit, OnDestroy {

  data: any = [];
  reader = new FileReader();
  selectedProjection = { code: null };
  coordsFormatString = '';
  currentFormat = 'wkt';
  orderby;
  subscriptionDataLoad;
  subscriptionNewData;
  subscriptionProjectionCodeChange;
  subscriptionNewFilter;

  constructor(public projectionsService: ProjectionsService) {
    /* SUBSCRIPTION */
    this.subscriptionDataLoad = projectionsService.eventProjsectionsLoaded.subscribe((data) => {
      this.data = data;
    });

    this.subscriptionProjectionCodeChange = projectionsService.eventProjectionCodeSelect.subscribe((data) => {
      this.selectedProjection = projectionsService.getProjectionByCode(data.code, this.data);
      this.coordsFormatString = this.getBboxFormat(this.currentFormat);
    });

    this.subscriptionNewData = projectionsService.eventNewBbox.subscribe((data) => {
      this.data = data;
      if (this.selectedProjection.code) {
        this.selectedProjection = projectionsService.getProjectionByCode(this.selectedProjection.code, data);
        this.coordsFormatString = this.getBboxFormat(this.currentFormat);
      }
    });

    this.subscriptionNewFilter = projectionsService.eventFilterTextChange.subscribe((data) => {
      this.data = projectionsService.getFilterProjection();
      if (projectionsService.initCoords.bboxToCoords) {
        projectionsService.setCoordsFromBbox(projectionsService.initCoords.bboxToCoords);
      }
    });
  }



  orderBy = function (field) {
    this.orderby = (this.orderby === field) ? '-' + field : field;
  };


  scrollToSelectedProjection = function (code) {
    if (document.getElementById(code)) {
      document.getElementById(code).scrollIntoView();
    }
  };


  onClickProjection = function (_projection_selected) {
    if (this.projectionsService.initCoords.shpParams.coords) {
      this.projectionsService.setProjectionCodeSelected({ code: _projection_selected.code, fromMap: false });
    } else {
      this.projectionsService.setProjectionCodeSelected({ code: _projection_selected.code, fromMap: true });
    }
  };


  getBboxFormat = function (format) {
    const coords = this.selectedProjection.coords;
    if (this.selectedProjection.coords) {
      const x_min = coords[0][0];
      const x_max = coords[1][0];
      const y_min = coords[0][1];
      const y_max = coords[1][1];
      let formatedString = '';
      switch (format) {
        case 'wkt':
          formatedString = 'POLYGON(' + x_min + ' ' + y_min + ','
            + x_min + ' ' + y_max + ','
            + x_max + ' ' + y_max + ','
            + x_max + ' ' + y_min + ','
            + x_min + ' ' + y_min
            + ')';
          break;

        case 'geojson':
          formatedString = '{"type": "Polygon","coordinates": [' +
            // tslint:disable-next-line:max-line-length
            '[[' + x_min + ', ' + y_min + '], [' + x_min + ', ' + y_max + '], [' + x_max + ', ' + y_max + '],[' + x_max + ', ' + y_min + '],[' + x_min + ', ' + y_min + ']' + ']]}';
          break;

        case 'xyMinMax':
          formatedString = x_min + ' ' + y_min + ', ' + x_max + ' ' + y_max;
          break;

        case 'yxMinMax':
          formatedString = y_min + ' ' + x_min + ', ' + y_max + ' ' + x_max;
          break;

        case 'overpassXML':
          formatedString = '<bbox-query e="' + x_max + '" n="' + y_max + '" s="' + y_min + '" w="' + x_min + '"/>';
          break;

        case 'overpassQL':
          formatedString = y_min + ',' + x_min + ',' + y_max + ',' + x_max;
          break;
      }

      return formatedString;
    }
  };

  formatChange = function (select) {
    this.currentFormat = select.value;
    this.coordsFormatString = this.getBboxFormat(this.currentFormat);
  };


  ngOnInit() {
    if (this.projectionsService.initCoords.bboxToCoords) {
      this.projectionsService.setCoordsFromBbox(this.projectionsService.initCoords.bboxToCoords);

    } else {
      this.data = this.projectionsService.getFilterProjection();
    }
  }


  ngOnDestroy() {
    this.subscriptionNewData.unsubscribe();
    this.subscriptionDataLoad.unsubscribe();
    this.subscriptionProjectionCodeChange.unsubscribe();
    this.subscriptionNewFilter.unsubscribe();
  }

}
