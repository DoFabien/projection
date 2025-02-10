import { HttpClient } from '@angular/common/http';
import { Injectable, EventEmitter } from '@angular/core';
import { bboxPolygon, booleanPointInPolygon, point } from '@turf/turf';

import projectionsList from '../../assets/projections.json';
import proj4 from 'proj4';

@Injectable({
    providedIn: 'root',
     
  })
export class ProjectionsService {


    projections:any[] = [];
    projectionCodeSelected?: string ;
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


    initCoords : any = {
        coordsToPoints: { lng: null, lat: null },
        pointToCoords: { lng: null, lat: null },
        shpParams: { fileName: '', coords: null },
        bboxToCoords: []
    };


    data = [];

    constructor(private http: HttpClient) {
        
    }

    loadProjections() {
        this.projections = projectionsList;
        this.eventProjsectionsLoaded.emit(projectionsList);
    }
    getProjectionCodeSelected() {
        return this.projectionCodeSelected;
    }

    setProjectionCodeSelected(code: any) {
        this.projectionCodeSelected = code;
        this.eventProjectionCodeSelect.emit(code);
    }

    getProjections(): any[] {
        return JSON.parse(JSON.stringify(this.projections));
    }


    getFilterProjection(searchTerm: string) {
        const full_data = this.getProjections();
        let res = [];
        const patt = new RegExp(searchTerm, 'i');
        if (searchTerm) {
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


    getProjsectionsFromWGS84(lng: number, lat: number, filterByBbox: boolean, searchTerm: string) {
      const proj_4326 = '+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs';
      const list_proj_point_to_coords = this.getFilterProjection(searchTerm);
      const filteredData = [];
        for (let i = 0; i < list_proj_point_to_coords.length; i++) {

            // filter by bbox
            const _point = point([lng, lat]);
            const _bbox = bboxPolygon(list_proj_point_to_coords[i].wgs84bounds);
            if (!filterByBbox || booleanPointInPolygon(_point, _bbox)) {
              const coords_from_proj = proj4(proj_4326, list_proj_point_to_coords[i].proj4, [lng, lat]);
                list_proj_point_to_coords[i].lng = coords_from_proj[0];
                list_proj_point_to_coords[i].lat = coords_from_proj[1];
                filteredData.push(list_proj_point_to_coords[i]);
            }
        }

        return filteredData;
        // this.initCoords.pointToCoords = { lng: lng, lat: lat };
        // this.eventProjsectionsFromWGS84.emit({ coordsClick: { lng: lng, lat: lat }, result: filteredData });
    
    }

    getProjectionsToWGS84(lng: number, lat: number, filterByBbox: boolean, searchTerm: string) {
      const proj_4326 = '+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs';
      const list_proj_point_to_coords = this.getFilterProjection(searchTerm);
      const filteredData = [];
        for (let i = 0; i < list_proj_point_to_coords.length; i++) {
          const coords_from_proj = proj4(list_proj_point_to_coords[i].proj4, proj_4326, [lng, lat]);
            if (isNaN(coords_from_proj[0]) || isNaN(coords_from_proj[1])) {
                continue; // Passer à l'itération suivante
            }
            list_proj_point_to_coords[i].lng = coords_from_proj[0];
            list_proj_point_to_coords[i].lat = coords_from_proj[1];
            const _point = point([coords_from_proj[0], coords_from_proj[1]]);
            const bbox = bboxPolygon(list_proj_point_to_coords[i].wgs84bounds);

            if (!filterByBbox || booleanPointInPolygon(_point, bbox)) {
                filteredData.push(list_proj_point_to_coords[i]);
            }
        }

        return filteredData
    }

    getCoordsFromBbox(coords:[[number, number], [number, number]] ,  filterByBbox: boolean, searchTerm: string) {
        const proj_4326 = '+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs';
        const result = this.getFilterProjection(searchTerm);
        const filteredData = [];

        if (coords[0] && coords[1]) {
          const point1 = point([coords[0][0], coords[0][1]]);
          const point2 = point([coords[1][0], coords[1][1]]);

            for (let i = 0; i < result.length; i++) {
              const bbox = bboxPolygon(result[i].wgs84bounds);
                if (!this.filterBbox || (booleanPointInPolygon(point1, bbox) && booleanPointInPolygon(point2, bbox)) ) {
                  const coords1 = proj4(proj_4326, result[i].proj4, [coords[0][0], coords[0][1]]);
                  const coords2 = proj4(proj_4326, result[i].proj4, [coords[1][0], coords[1][1]]);
                  const x_min: number = (coords1[0] < coords2[0]) ? coords1[0] : coords2[0];
                  const x_max: number = (coords1[0] >= coords2[0]) ? coords1[0] : coords2[0];
                  const y_min: number = (coords1[1] < coords2[1]) ? coords1[1] : coords2[1];
                  const y_max: number = (coords1[1] >= coords2[1]) ? coords1[1] : coords2[1];
                     result[i].coords = [[x_min, y_min], [x_max, y_max]];
                    filteredData.push(result[i]);
                }

            }
        }
        return filteredData;
    }

    getProjectionByCode(code: string | undefined, projections: any[]): any {
        for (let i = 0; i < projections.length; i++) {
            if (projections[i].code === code) {
                return projections[i];
            }
        }
        return undefined;
    }

    projIsPresent(code: string | undefined, projections: any[]) {
        if (!code) {
            return false;
        }
        for (let i = 0; i < projections.length; i++) {
            if (projections[i].code === code) {
                return true;
            }
        }
        return false;
    }

}
