import { Injectable, EventEmitter } from '@angular/core';
import { Http, Response } from '@angular/http';

declare var proj4: any;
declare var turf: any;

@Injectable()
export class ProjectionsService {
    private proj4: any;

    projections = [];
    projectionCodeSelected: string = null;
    filterText = '';
    filterBbox = true;

    eventProjsectionsFromWGS84 = new EventEmitter();
    eventProjsectionsToWGS84 = new EventEmitter();
    eventProjsectionsLoaded = new EventEmitter();
    eventPageChange = new EventEmitter();
    eventProjectionCodeSelect = new EventEmitter();
    eventFilterTextChange = new EventEmitter();
    eventNewShp = new EventEmitter();
    eventNewBbox = new EventEmitter();


    initCoords = {
        coordsToPoints: { lng: null, lat: null },
        pointToCoords: { lng: null, lat: null },
        shpParams: { fileName: '', coords: null },
        bboxToCoords: []
    };


    data = [];

    constructor(private http: Http) {
        this.proj4 = proj4;
    }

    loadProjections() {
        this.http.get('./assets/projections.json')
            .map((res: Response) => res.json())
            .subscribe(
            data => { this.projections = data; this.eventProjsectionsLoaded.emit(data); },
            err => console.error(err)
            );
    }
    getProjectionCodeSelected() {
        return this.projectionCodeSelected;
    }

    setProjectionCodeSelected(code) {
        this.projectionCodeSelected = code;
        this.eventProjectionCodeSelect.emit(code);
    }

    getFilterText() {
        return JSON.parse(JSON.stringify(this.filterText));
    }
    setFilterText(text) {
        this.filterText = text;
        this.eventFilterTextChange.emit(text);
    }

    getProjections() {
        return JSON.parse(JSON.stringify(this.projections));
    }


    getFilterProjection() {
        const full_data = this.getProjections();
        let res = [];
        const patt = new RegExp(this.getFilterText(), 'i');
        if (this.getFilterText()) {
            full_data.forEach(element => {
                if (patt.test(element.code) || patt.test(element.name)) {
                    res.push(element);
                }
            });
        } else {
            res = full_data;
        }
        return res;
    }

    filterBySridBBox(unfilteredList: any[]) {
        for (let i = 0; i < unfilteredList.length; i++) {
          const point = turf.point([unfilteredList[i].lng, unfilteredList[i].lat]);
          const bbox = turf.bboxPolygon(unfilteredList[i].wgs84bounds);
        }

    }

    getProjsectionsFromWGS84(lng: number, lat: number) {
      const proj_4326 = '+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs';
      const list_proj_point_to_coords = this.getFilterProjection();
      const filteredData = [];
        for (let i = 0; i < list_proj_point_to_coords.length; i++) {

            // filter by bbox
            const point = turf.point([lng, lat]);
            const bbox = turf.bboxPolygon(list_proj_point_to_coords[i].wgs84bounds);
            if (turf.inside(point, bbox) || !this.filterBbox) {
              const coords_from_proj = proj4(proj_4326, list_proj_point_to_coords[i].proj4, [lng, lat]);
                list_proj_point_to_coords[i].lng = coords_from_proj[0];
                list_proj_point_to_coords[i].lat = coords_from_proj[1];
                filteredData.push(list_proj_point_to_coords[i]);
            }
        }
        this.initCoords.pointToCoords = { lng: lng, lat: lat };
        this.eventProjsectionsFromWGS84.emit({ coordsClick: { lng: lng, lat: lat }, result: filteredData });
    }

    getProjectionsToWGS84(lng: number, lat: number) {

      const proj_4326 = '+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs';
      const list_proj_point_to_coords = this.getFilterProjection();
      const filteredData = [];
        for (let i = 0; i < list_proj_point_to_coords.length; i++) {
          const coords_from_proj = proj4(list_proj_point_to_coords[i].proj4, proj_4326, [lng, lat]);
            list_proj_point_to_coords[i].lng = coords_from_proj[0];
            list_proj_point_to_coords[i].lat = coords_from_proj[1];

            const point = turf.point([coords_from_proj[0], coords_from_proj[1]]);
            const bbox = turf.bboxPolygon(list_proj_point_to_coords[i].wgs84bounds);

            if (turf.inside(point, bbox) || !this.filterBbox) {
                filteredData.push(list_proj_point_to_coords[i]);
            }
        }
        this.initCoords.coordsToPoints = { lng: lng, lat: lat };
        this.eventProjsectionsToWGS84.emit({ coordsClick: { lng: lng, lat: lat }, result: filteredData });
    }

    setCoordsShp(coords, name) {
        this.initCoords.shpParams = { coords: coords, fileName: name };
        this.updateProjectionFromShp();
    }

    updateProjectionFromShp() {
      const list_proj_point_to_coords = this.getFilterProjection();
      const proj_4326 = '+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs';
      const coords = this.initCoords.shpParams.coords;
      const filteredData = [];
        for (let i = 0; i < list_proj_point_to_coords.length; i++) {
          const coords_from_proj0 = proj4(list_proj_point_to_coords[i].proj4, proj_4326, [coords[0].lng, coords[0].lat]);
          const coords_from_proj1 = proj4(list_proj_point_to_coords[i].proj4, proj_4326, [coords[1].lng, coords[1].lat]);
          const coords_from_proj2 = proj4(list_proj_point_to_coords[i].proj4, proj_4326, [coords[2].lng, coords[2].lat]);
          const coords_from_proj3 = proj4(list_proj_point_to_coords[i].proj4, proj_4326, [coords[3].lng, coords[3].lat]);

            list_proj_point_to_coords[i].bbox = [
                { lng: coords_from_proj0[0], lat: coords_from_proj0[1] },
                { lng: coords_from_proj1[0], lat: coords_from_proj1[1] },
                { lng: coords_from_proj2[0], lat: coords_from_proj2[1] },
                { lng: coords_from_proj3[0], lat: coords_from_proj3[1] }
            ];
            let inBboxProj = true;
            if (this.filterBbox) {
              const bboxProj = turf.bboxPolygon(list_proj_point_to_coords[i].wgs84bounds);
                for (let j = 0; j < list_proj_point_to_coords[i].bbox.length; j++) {
                  const point = turf.point([list_proj_point_to_coords[i].bbox[j].lng, list_proj_point_to_coords[i].bbox[j].lat]);
                    if (!turf.inside(point, bboxProj)) {
                        inBboxProj = false;
                        break;
                    }
                }
            }
            if (inBboxProj) {
                filteredData.push(list_proj_point_to_coords[i]);
            }
        }
        this.eventNewShp.emit(filteredData);
    }

    setCoordsFromBbox(coords) {
        this.initCoords.bboxToCoords = coords;
        const filteredData = [];
        const proj_4326 = '+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs';
        const result = this.getFilterProjection();


        if (coords[0] && coords[1]) {
          const point1 = turf.point([coords[0].lng, coords[0].lat]);
          const point2 = turf.point([coords[1].lng, coords[1].lat]);

            for (let i = 0; i < result.length; i++) {
              const bbox = turf.bboxPolygon(result[i].wgs84bounds);
                if (!this.filterBbox || (turf.inside(point1, bbox) && turf.inside(point2, bbox)) ) {
                  const coords1 = proj4(proj_4326, result[i].proj4, [coords[0].lng, coords[0].lat]);
                  const coords2 = proj4(proj_4326, result[i].proj4, [coords[1].lng, coords[1].lat]);
                  const x_min: number = (coords1[0] < coords2[0]) ? coords1[0] : coords2[0];
                  const x_max: number = (coords1[0] >= coords2[0]) ? coords1[0] : coords2[0];
                  const y_min: number = (coords1[1] < coords2[1]) ? coords1[1] : coords2[1];
                  const y_max: number = (coords1[1] >= coords2[1]) ? coords1[1] : coords2[1];
                     result[i].coords = [[x_min, y_min], [x_max, y_max]];
                    filteredData.push(result[i]);
                }

            }
        }
        this.eventNewBbox.emit(filteredData);
    }

    getProjectionByCode(code, projections) {
        for (let i = 0; i < projections.length; i++) {
            if (projections[i].code === code) {
                return projections[i];
            }
        }
        return null;
    }

    projIsPresent(code, projections) {
        for (let i = 0; i < projections.length; i++) {
            if (projections[i].code === code) {
                return true;
            }
        }
        return false;
    }

}
