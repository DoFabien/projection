import { Component, model, effect, input, OnInit } from '@angular/core';
import { ProjectionsService } from '../../services/projections.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { OrderBy } from '../../pipes/order_by.pipe';
import { FilterPipe } from '../../pipes/filter.pipe';
import { MatIconModule } from '@angular/material/icon';
import { RoundCoords } from '../../pipes/round_coords.pipe';
import { MapService } from '../../services/map.service';
import { GeoJSONSource } from 'maplibre-gl';
import { BaseProjectionComponent } from '../base-projection.component';

@Component({
  selector: 'app-point-to-coords',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule, MatFormFieldModule, 
    MatInputModule, MatCardModule, MatIconModule, RoundCoords, 
    OrderBy
, FilterPipe
  ],
  templateUrl: './point-to-coords.component.html',
  styleUrls: ['./point-to-coords.component.scss']
})
export class PointToCoordsComponent extends BaseProjectionComponent implements OnInit {
  filterByBbox = input<boolean>(true);
  inputData = model<[number, number] | undefined>(undefined);

  constructor(
    projectionsService: ProjectionsService,
    mapService: MapService
  ) {
    super(projectionsService, mapService);

    // Effect for projections
    effect(() => {
      const coords = this.inputData();
      if (!coords) return;
      const result = this.projectionsService.getProjsectionsFromWGS84(
        coords[0], 
        coords[1], 
        this.filterByBbox(),
        this.searchTerm(),
      );
      this.resultProjections.set(result);

      // Update map when inputData changes
      this.updateMapPoint(coords);
    });
  }

  override ngOnInit() {
    super.ngOnInit();
    
    // Restaurer les données sauvegardées
    const savedState = localStorage.getItem(this.getStorageKey());
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        if (state.coords) {
          this.inputData.set(state.coords);
        }
      } catch (error) {
        console.error('Error loading state:', error);
      }
    }
  }


  protected override initializeMap(): void {
    this.mapService.map.on('click', this.mapClickHandler);
    this.mapService.map.getCanvas().style.cursor = "pointer";

    // Cleanup on destroy
    this.destroyRef.onDestroy(() => {
      this.mapService.map.off('click', this.mapClickHandler);
      const geojson: GeoJSON.GeoJSON = {type: 'FeatureCollection', features: []};
      const source = this.mapService.map.getSource('pointToCoords') as GeoJSONSource;
      source?.setData(geojson);
      this.mapService.map.getCanvas().style.cursor = "default";
    });
  }

  protected override getStorageKey(): string {
    return 'point-to-coords-state';
  }

  setInputData(coords: [number, number] | undefined) {
    if (!coords) return;
    this.inputData.set(coords);
  }

  private updateMapPoint(coords: [number, number]) {
    const geojson: GeoJSON.GeoJSON = {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Point',
          coordinates: coords
        }
      }]
    };
    
    const source = this.mapService.map.getSource('pointToCoords') as GeoJSONSource;
    if (source) {
      source.setData(geojson);
    }
  }

  private mapClickHandler = (e: any) => {
    const coords: [number, number] = [e.lngLat.lng, e.lngLat.lat];
    this.setInputData(coords);

    // Sauvegarder les coordonnées après le clic
    this.saveState();
  };

  private saveState() {
    const state = {
      coords: this.inputData(),
      filterByBbox: this.filterByBbox()
    };
    localStorage.setItem(this.getStorageKey(), JSON.stringify(state));
  }

  protected override loadComponentData(data: any) {
    if (data.coords) {
      this.inputData.set(data.coords);
    }
  }

  protected override getComponentData(): any {
    return {
      coords: this.inputData(),
      filterByBbox: this.filterByBbox()
    };
  }
}
