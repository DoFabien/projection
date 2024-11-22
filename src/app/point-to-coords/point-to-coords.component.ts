import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ProjectionsService } from '../shared/projections.service';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { OrderBy } from '../pipes/order_by.pipe';
import { MatIconModule } from '@angular/material/icon';
import { RoundCoords } from '../pipes/round_coords.pipe';



@Component({
    selector: 'app-point-to-coords',
    imports: [CommonModule, RouterModule, FormsModule, MatFormFieldModule, MatInputModule, MatCardModule, OrderBy,
        MatIconModule, RoundCoords
    ],
    templateUrl: './point-to-coords.component.html',
    styleUrls: ['./point-to-coords.component.scss']
})
export class PointToCoordsComponent implements OnInit, OnDestroy {

  data: any = [];
  selectedProjection: {code : string | undefined, url?: any, region? : string, name?: string, lat?: number, lng?: number} = { code: undefined };
  orderby?: any ;

  subscriptionNewData?: Subscription;
  subscriptionNewFilter?: Subscription;
  subscriptionNewSelect?: Subscription;
  subscriptionDataLoaded?: Subscription;

  constructor(public projectionsService: ProjectionsService, private cd: ChangeDetectorRef) {

  }


  orderBy(field: string): void {
    this.orderby = (this.orderby === field) ? '-' + field : field;
  }

  onClickProjection(_projection_selected: { code: string }): void {
    this.projectionsService.setProjectionCodeSelected({ code: _projection_selected.code, fromMap: false });
  }


  ngOnInit() {
    // nouvelles data!
    this.subscriptionNewData = this.projectionsService.eventProjsectionsFromWGS84.subscribe((data) => {
      this.data = [...data.result];
      const projIsPresent = this.projectionsService.projIsPresent(this.selectedProjection.code, data.result);

      if (projIsPresent) {
        this.selectedProjection = this.projectionsService.getProjectionByCode(this.selectedProjection.code, this.data);
      } else {
        this.selectedProjection = { code: undefined };
      }
      this.cd.detectChanges();
    });

    // chargements
    this.subscriptionDataLoaded = this.projectionsService.eventProjsectionsLoaded.subscribe((data) => {
      this.data = [...data];
    });

    // le filtre a changé
    this.subscriptionNewFilter = this.projectionsService.eventFilterTextChange.subscribe((data) => {
      this.data = [...this.projectionsService.getFilterProjection()];
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

  }


  ngOnDestroy() {
    this.subscriptionNewData?.unsubscribe();
    this.subscriptionNewFilter?.unsubscribe();
    this.subscriptionNewSelect?.unsubscribe();
    this.subscriptionDataLoaded?.unsubscribe();

  }

}
