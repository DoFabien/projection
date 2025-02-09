import { Component, OnInit, OnDestroy, ChangeDetectorRef, signal, input, model, effect } from '@angular/core';
import { ProjectionsService } from '../../services/projections.service';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { OrderBy } from '../../pipes/order_by.pipe';
import { MatIconModule } from '@angular/material/icon';
import { RoundCoords } from '../../pipes/round_coords.pipe';
import { MapService } from '../../services/map.service';

import { GeoJSONSource, LngLatLike } from 'maplibre-gl';


@Component({
    selector: 'app-point-to-coords',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule, MatFormFieldModule, MatInputModule, MatCardModule,
        MatIconModule, RoundCoords, OrderBy
    ],
    templateUrl: './point-to-coords.component.html',
    styleUrls: ['./point-to-coords.component.scss']
})
export class PointToCoordsComponent {

  filterByBbox = input<boolean>(true);
  orderByField = signal<string>('');
  inputData = model<[number, number] | undefined>(undefined);
  resultProjections = signal<Projection[]>([]);
  selectedProjection = signal<Projection | undefined>(undefined);
  


  constructor(
    public projectionsService: ProjectionsService,
    public mapService: MapService
  ) {
    // Effect pour les projections
    effect(() => {
      const coords = this.inputData();
      if (!coords) return;
      const result: Projection[] = this.projectionsService.getProjsectionsFromWGS84(coords[0], coords[1], this.filterByBbox());
      this.resultProjections.set(result);
    });

    // Effect pour la carte
    effect(() => {
      if (this.mapService.mapReady()) {
        this.mapService.map.on('click', this.mapClickHandler);
        this.setInputData(this.inputData());
        this.mapService.map.getCanvas().style.cursor = "pointer";
      }
    });
  }




  ngOnDestroy() {
    this.mapService.map.off('click', this.mapClickHandler);

    const geojson: GeoJSON.GeoJSON = {type: 'FeatureCollection',features:[]}
    const source = this.mapService.map.getSource('pointToCoords') as GeoJSONSource;
    source?.setData(geojson);
    this.mapService.map.getCanvas().style.cursor = "default";
  }

  setInputData(coords: [number, number] | undefined) {
    if (!coords) return;
    this.inputData.set(coords);
    const geojson: GeoJSON.GeoJSON = {
      type: 'FeatureCollection',
      features:[
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Point', coordinates: coords
          }
        }
      ]
    }
    const source = this.mapService.map.getSource('pointToCoords') as GeoJSONSource;
    source?.setData(geojson);
  }

  private mapClickHandler = (e: any) => {
    this.setInputData([e.lngLat.lng, e.lngLat.lat])
  };

  setOrderBy(field: string) {
    this.orderByField.set(!this.orderByField() ? field : this.orderByField() === field ? `-${field}` : this.orderByField() === `-${field}` ? '' : field);
  }

}
