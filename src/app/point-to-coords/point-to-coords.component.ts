import { Component, OnInit, OnDestroy } from '@angular/core';
import { ProjectionsService } from '../shared/projections.service';



@Component({
  selector: 'my-point-to-coords',
  templateUrl: './point-to-coords.component.html',
  styleUrls: ['./point-to-coords.component.scss']
})
export class PointToCoordsComponent implements OnInit, OnDestroy {

  data: any = [];
  selectedProjection = { code: null };
  orderby = null;

  subscriptionNewData;
  subscriptionNewFilter;
  subscriptionNewSelect;
  subscriptionDataLoaded;

  constructor(public projectionsService: ProjectionsService) {

  }


  orderBy = function (field) {
    this.orderby = (this.orderby === field) ? '-' + field : field;
  };

  onClickProjection = function (_projection_selected) {
    this.projectionsService.setProjectionCodeSelected({ code: _projection_selected.code, fromMap: false });
  };


  ngOnInit() {
    //nouvelles data!
    this.subscriptionNewData = this.projectionsService.eventProjsectionsFromWGS84.subscribe((data) => {
      this.data = data.result;
      let projIsPresent = this.projectionsService.projIsPresent(this.selectedProjection.code, data.result);

      if (projIsPresent) {
        this.selectedProjection = this.projectionsService.getProjectionByCode(this.selectedProjection.code, this.data);
      } else {
        this.selectedProjection = { code: null };
      }
    });

    //chargements
    this.subscriptionDataLoaded = this.projectionsService.eventProjsectionsLoaded.subscribe((data) => {
      this.data = data;
    });

    //le filtre à changé
    this.subscriptionNewFilter = this.projectionsService.eventFilterTextChange.subscribe((data) => {
      this.data = this.projectionsService.getFilterProjection();
      this.projectionsService.getProjsectionsFromWGS84(this.projectionsService.initCoords.pointToCoords.lng,
        this.projectionsService.initCoords.pointToCoords.lat);
    });

    this.subscriptionNewSelect = this.projectionsService.eventProjectionCodeSelect.subscribe((data) => {
      this.selectedProjection = this.projectionsService.getProjectionByCode(data.code, this.data);
    });



    if (!this.projectionsService.initCoords.pointToCoords.lat) {
      this.data = this.projectionsService.getFilterProjection();
    } else {
      this.projectionsService.getProjsectionsFromWGS84(this.projectionsService.initCoords.pointToCoords.lng,
        this.projectionsService.initCoords.pointToCoords.lat);
    }

  };


  ngOnDestroy() {
    this.subscriptionNewData.unsubscribe();
    this.subscriptionNewFilter.unsubscribe();
    this.subscriptionNewSelect.unsubscribe();
    this.subscriptionDataLoaded.unsubscribe();

  }

}
