import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ProjectionsService } from '../shared/projections.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { OrderBy } from '../pipes/order_by.pipe';
import {MatSelectModule} from '@angular/material/select';

@Component({
  selector: 'app-bbox-to-coords',
  templateUrl: './bbox-to-coords.component.html',
  styleUrls: ['./bbox-to-coords.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatFormFieldModule, MatInputModule,  MatCardModule, OrderBy,MatSelectModule],
})
export class BboxToCoordsComponent implements OnInit, OnDestroy {

  data: any = [];
  reader = new FileReader();
  selectedProjection : any= { code: null };
  coordsFormatString = '';
  currentFormat = 'wkt';
  orderby: any;
  subscriptionDataLoad;
  subscriptionNewData;
  subscriptionProjectionCodeChange;
  subscriptionNewFilter;

  constructor(public projectionsService: ProjectionsService, private cd: ChangeDetectorRef) {
    /* SUBSCRIPTION */
    this.subscriptionDataLoad = projectionsService.eventProjsectionsLoaded.subscribe((data) => {
      this.data = data;
      this.cd.detectChanges();
    });

    this.subscriptionProjectionCodeChange = projectionsService.eventProjectionCodeSelect.subscribe((data) => {
      this.selectedProjection = projectionsService.getProjectionByCode(data.code, this.data);
      this.coordsFormatString = this.getBboxFormat(this.currentFormat);
      this.cd.detectChanges();
    });

    this.subscriptionNewData = projectionsService.eventNewBbox.subscribe((data) => {
      this.data = data;
      if (this.selectedProjection.code) {
        this.selectedProjection = projectionsService.getProjectionByCode(this.selectedProjection.code, data);
        this.coordsFormatString = this.getBboxFormat(this.currentFormat);
        
      }
      this.cd.detectChanges();
      
    });

    this.subscriptionNewFilter = projectionsService.eventFilterTextChange.subscribe((data) => {
      this.data = projectionsService.getFilterProjection();
      if (projectionsService.initCoords.bboxToCoords) {
        projectionsService.setCoordsFromBbox(projectionsService.initCoords.bboxToCoords);
      }
    });
  }


  orderBy(field: string): void {
    this.orderby = (this.orderby === field) ? '-' + field : field;
  }


  scrollToSelectedProjection(code : string) {
    if (document.getElementById(code)) {
      document.getElementById(code)?.scrollIntoView();
    }
  };


  onClickProjection  (_projection_selected: any) {
    if (this.projectionsService.initCoords.shpParams.coords) {
      this.projectionsService.setProjectionCodeSelected({ code: _projection_selected.code, fromMap: false });
    } else {
      this.projectionsService.setProjectionCodeSelected({ code: _projection_selected.code, fromMap: true });
    }
  };


  getBboxFormat (format: string): string {
    if (!this.selectedProjection?.coords){
      return ''
    }
    let formatedString = '';

    const coords = this.selectedProjection?.coords;
    if (this.selectedProjection.coords) {
      const x_min = coords[0][0];
      const x_max = coords[1][0];
      const y_min = coords[0][1];
      const y_max = coords[1][1];
     
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
        default:
          formatedString = '';
      }
    }
    
    return formatedString;
  };

  formatChange  (select: any) {
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
