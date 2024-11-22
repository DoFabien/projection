import { Component, OnInit, OnDestroy } from '@angular/core';
import { ProjectionsService } from '../shared/projections.service';

import { fromEvent } from 'rxjs';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import {MatCardModule} from '@angular/material/card';
import { OrderBy } from '../pipes/order_by.pipe';

@Component({
    selector: 'app-shp-to-bbox',
    imports: [CommonModule, RouterModule, FormsModule, MatFormFieldModule, MatInputModule, MatCardModule, OrderBy],
    templateUrl: './shp-to-bbox.component.html',
    styleUrls: ['./shp-to-bbox.component.scss']
})
export class ShpToBboxComponent implements OnInit, OnDestroy {

    data: any = [];
    reader = new FileReader();
    selectedProjection : any = { code: null };

    subscriptionDataLoad;
    subscriptionNewData;
    subscriptionProjectionCodeChange;
    subscriptionNewFilter;
    orderby: any;
    shpParams: any;


    constructor(public projectionsService: ProjectionsService) {
        /* SUBSCRIPTION */
        this.subscriptionDataLoad = projectionsService.eventProjsectionsLoaded.subscribe((data) => {
            this.data = data;
        });

        this.subscriptionProjectionCodeChange = projectionsService.eventProjectionCodeSelect.subscribe((data) => {
            this.selectedProjection = projectionsService.getProjectionByCode(data.code, this.data);
            if (data.fromMap) {
                if (document.getElementById(data.code)) {
                    document.getElementById(data.code)?.scrollIntoView();
                }
            }
        });

        this.subscriptionNewData = projectionsService.eventNewShp.subscribe((data) => {
            this.data = data;
        });

        this.subscriptionNewFilter = projectionsService.eventFilterTextChange.subscribe((data) => {
            this.data = projectionsService.getFilterProjection();
            if (projectionsService.initCoords.shpParams.coords) {
                projectionsService.setCoordsShp(projectionsService.initCoords.shpParams.coords, ''); }
        });



        const fileloaded = fromEvent(this.reader, 'loadend');

        fileloaded.subscribe((data: any) => {
            const target: any = data.target;
            const dataview = new DataView(target.result, 0, 80);
            // const file_code = dataview.getInt32(0);
            // const file_length = dataview.getInt32(24);
            // const file_type = dataview.getInt32(32, true);
            const x_min = dataview.getFloat64(36, true);
            const x_max = dataview.getFloat64(52, true);
            const y_min = dataview.getFloat64(44, true);
            const y_max = dataview.getFloat64(60, true);

            const shpParamsCoords = [{ lng: x_min, lat: y_min },
                                    { lng: x_min, lat: y_max },
                                    { lng: x_max, lat: y_max },
                                    { lng: x_max, lat: y_min }];

            this.projectionsService.setCoordsShp(shpParamsCoords, '');
        });
    }

    onChange =  (e: any) => {
      const shpFile = e.target.files[0];
        this.shpParams = {};
        this.shpParams.fileName = shpFile.name;
        this.reader.readAsArrayBuffer(shpFile);
    };

    orderBy = (field: string) => {
        this.orderby = (this.orderby === field) ? '-' + field : field;
    };


    scrollToSelectedProjection =  (code : string) => {
        if (document.getElementById(code)) {
            document.getElementById(code)?.scrollIntoView();
        }
    };




    onClickProjection =  (_projection_selected :any) => {
        if (this.projectionsService.initCoords.shpParams.coords) {
            this.projectionsService.setProjectionCodeSelected({ code: _projection_selected.code, fromMap: false });
        } else {
            this.projectionsService.setProjectionCodeSelected({ code: _projection_selected.code, fromMap: true });
        }
    };

    ngOnInit() {
        if (this.projectionsService.initCoords.shpParams.coords) {
            this.projectionsService.setCoordsShp(this.projectionsService.initCoords.shpParams.coords, '');

        } else {
            this.data = this.projectionsService.getFilterProjection();
        }



    }


    ngOnDestroy() {
        this.subscriptionNewData.unsubscribe();
        this.subscriptionDataLoad.unsubscribe();
        this.subscriptionProjectionCodeChange.unsubscribe();
    }

}
