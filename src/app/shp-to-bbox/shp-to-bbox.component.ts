import { Component, OnInit, OnDestroy } from '@angular/core';
import { ProjectionsService } from '../shared/projections.service';

import { MdIconRegistry } from '@angular2-material/icon';
import { Observable } from 'rxjs/Rx';


@Component({
    selector: 'my-shp-to-bbox',
    templateUrl: './shp-to-bbox.component.html',
    styleUrls: ['./shp-to-bbox.component.scss'],
    viewProviders: [MdIconRegistry]
})
export class ShpToBboxComponent implements OnInit, OnDestroy {

    data: any = [];
    reader = new FileReader();
    selectedProjection = { code: null };

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
            if (data.fromMap) {
                if (document.getElementById(data.code)) {
                    document.getElementById(data.code).scrollIntoView();
                }
            }
        });

        this.subscriptionNewData = projectionsService.eventNewShp.subscribe((data) => {
            this.data = data;
        });

        this.subscriptionNewFilter = projectionsService.eventFilterTextChange.subscribe((data) => {
            this.data = projectionsService.getFilterProjection();
            if (projectionsService.initCoords.shpParams.coords){
                projectionsService.setCoordsShp(projectionsService.initCoords.shpParams.coords, ''); }
        });

     

        let fileloaded = Observable.fromEvent(this.reader, 'loadend');

        fileloaded.subscribe((data: ProgressEvent) => {
            let target: any = data.target;
            let dataview = new DataView(target.result, 0, 80);
            let file_code = dataview.getInt32(0);
            let file_length = dataview.getInt32(24);
            let file_type = dataview.getInt32(32, true);
            let x_min = dataview.getFloat64(36, true);
            let x_max = dataview.getFloat64(52, true);
            let y_min = dataview.getFloat64(44, true);
            let y_max = dataview.getFloat64(60, true);
            let shpParamsCoords = [{ lng: x_min, lat: y_min }, { lng: x_min, lat: y_max }, { lng: x_max, lat: y_max }, { lng: x_max, lat: y_min }];
            this.projectionsService.setCoordsShp(shpParamsCoords, '');
        });
    }

    onChange = function (e) {
        let shpFile = e.target.files[0];
        this.shpParams = {};
        this.shpParams.fileName = shpFile.name;
        this.reader.readAsArrayBuffer(shpFile);
    };

    orderBy = function (field) {
        this.orderby = (this.orderby === field) ? '-' + field : field;
    };

    submitNewCoords(latlng) {

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
