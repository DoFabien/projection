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
import { MatSelectModule } from '@angular/material/select';
import { MapService } from '../../services/map.service';
import { GeoJSONSource, MapMouseEvent } from 'maplibre-gl';
import { BboxFormatPipe } from '../../pipes/bbox-format.pipe';
import { BaseProjectionComponent } from '../base-projection.component';
import { signal } from '@angular/core';

@Component({
  selector: 'app-bbox-to-coords',
  templateUrl: './bbox-to-coords.component.html',
  styleUrls: ['./bbox-to-coords.component.scss'],
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule, MatFormFieldModule, 
    MatInputModule, MatCardModule, OrderBy, MatSelectModule, 
    BboxFormatPipe, FilterPipe
  ],
  providers: [BboxFormatPipe]
})
export class BboxToCoordsComponent extends BaseProjectionComponent implements OnInit {
  filterByBbox = input<boolean>(true);
  inputData = model<[[number, number], [number, number]] | undefined>(undefined);
  currentFormat = signal<string>('wkt');
  startCoords = signal<[number, number] | undefined>(undefined);

  private lastDrawTime = 0;
  private readonly FRAME_RATE = 16; // ~60fps

  constructor(
    projectionsService: ProjectionsService,
    mapService: MapService,
    private bboxFormatPipe: BboxFormatPipe
  ) {
    super(projectionsService, mapService);

    effect(() => {
      const coords = this.inputData();
      if (!coords) return;
      
      const newProjections = this.projectionsService.getCoordsFromBbox(coords, this.filterByBbox(), this.searchTerm());
      this.resultProjections.set(newProjections);
      
      const currentProjection = this.selectedProjection();
      if (currentProjection) {
        const updatedProjection = newProjections.find(p => p.code === currentProjection.code);
        if (JSON.stringify(currentProjection.coords) !== JSON.stringify(updatedProjection?.coords)) {
          this.selectedProjection.set(updatedProjection);
        }
      }
      
      this.saveState();
    }, { allowSignalWrites: true });
  }

  override ngOnInit() {
    super.ngOnInit();
    
    // Restaurer les données sauvegardées
    const savedState = localStorage.getItem(this.getStorageKey());
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        if (state.bbox) {
          this.inputData.set(state.bbox);
        }
        if (state.format) {
          this.currentFormat.set(state.format);
        }
      } catch (error) {
        console.error('Error loading state:', error);
      }
    }
  }

  protected override initializeMap(): void {
    this.mapService.map.on('click', this.mapClickHandler as (ev: MapMouseEvent) => void);
    this.mapService.map.on('mousemove', this.mapMouseMoveHandler as (ev: MapMouseEvent) => void);

    // Cleanup on destroy
    this.destroyRef.onDestroy(() => {
      const geojson: GeoJSON.GeoJSON = {type: 'FeatureCollection', features: []};
      const source = this.mapService.map.getSource('bboxToCoords') as GeoJSONSource;
      source?.setData(geojson);
      this.mapService.map.off('click', this.mapClickHandler as (ev: MapMouseEvent) => void);
      this.mapService.map.off('mousemove', this.mapMouseMoveHandler as (ev: MapMouseEvent) => void);
    });

    // Restaurer la bbox sur la carte si elle existe
    if (this.inputData()) {
      this.updateMapBbox(this.inputData()!);
    }
  }

  protected override getStorageKey(): string {
    return 'bbox-to-coords-state';
  }

  private saveState() {
    const state = {
      bbox: this.inputData(),
      format: this.currentFormat(),
      filterByBbox: this.filterByBbox()
    };
    localStorage.setItem(this.getStorageKey(), JSON.stringify(state));
  }

  private updateMapBbox(coords: [[number, number], [number, number]]) {
    const geojson: GeoJSON.GeoJSON = {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Polygon',
          coordinates: [[
            coords[0],
            [coords[0][0], coords[1][1]],
            coords[1], 
            [coords[1][0], coords[0][1]],
            coords[0]
          ]]
        }
      }]
    };
    
    const source = this.mapService.map.getSource('bboxToCoords') as GeoJSONSource;
    if (source) {
      source.setData(geojson);
    }
  }

  private mapClickHandler = (e: MapMouseEvent) => {
    const currentCoords: [number, number] = [e.lngLat.lng, e.lngLat.lat];
    if (this.startCoords()) {
      this.inputData.set([this.startCoords()!, currentCoords]);
      this.startCoords.set(undefined);
      this.saveState();
    } else {
      this.startCoords.set(currentCoords);
    }
  };

  private mapMouseMoveHandler = (e: MapMouseEvent) => {
    if (!this.startCoords()) return;
    
    const now = performance.now();
    if (now - this.lastDrawTime < this.FRAME_RATE) return;
    this.lastDrawTime = now;
    
    const currentCoords: [number, number] = [e.lngLat.lng, e.lngLat.lat];
    this.updateMapBbox([this.startCoords()!, currentCoords]);
  };

  formatChange(format: string) {
    this.currentFormat.set(format);
    this.saveState();
  }

  onClickProjection(p: Projection): void {
    this.selectedProjection.set(p);
  }

  copyToClipboard() {
    if (this.selectedProjection()?.coords) {
      const formattedCoords = this.bboxFormatPipe.transform(
        this.selectedProjection()?.coords, 
        this.currentFormat()
      );
      
      if (formattedCoords) {
        navigator.clipboard.writeText(formattedCoords);
      }
    }
  }
}
