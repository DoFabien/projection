import { Component, OnInit, OnDestroy, signal, model, effect, input } from '@angular/core';
import { ProjectionsService } from '../../services/projections.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { OrderBy } from '../../pipes/order_by.pipe';
import { MatSelectModule } from '@angular/material/select';
import { MapService } from '../../services/map.service';
import { GeoJSONSource, MapMouseEvent } from 'maplibre-gl';
import { BboxFormatPipe } from '../../pipes/bbox-format.pipe';

@Component({
  selector: 'app-bbox-to-coords',
  templateUrl: './bbox-to-coords.component.html',
  styleUrls: ['./bbox-to-coords.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatFormFieldModule, MatInputModule, MatCardModule, OrderBy, MatSelectModule, BboxFormatPipe],
  providers: [BboxFormatPipe]
})
export class BboxToCoordsComponent implements OnInit, OnDestroy {
  filterByBbox = input<boolean>(true);
  orderByField = signal<string>('');
  inputData = model<[[number, number], [number, number]] | undefined>(undefined);
  resultProjections = signal<Projection[]>([]);
  selectedProjection = signal<Projection | undefined>(undefined);
  currentFormat = signal<string>('wkt');
  coordsFormatString = signal<string>('');

  startCoords = signal<[number, number] | undefined>(undefined);

  private lastDrawTime = 0;
  private readonly FRAME_RATE = 16; // ~60fps

  constructor(
    public projectionsService: ProjectionsService,
    public mapService: MapService,
    private bboxFormatPipe: BboxFormatPipe
  ) {
    effect(() => {
      const coords = this.inputData();
      if (!coords) return;
      
      const newProjections = this.projectionsService.getCoordsFromBbox(coords);
      this.resultProjections.set(newProjections);
      
      const currentProjection = this.selectedProjection();
      if (currentProjection) {
        const updatedProjection = newProjections.find(p => p.code === currentProjection.code);
        if (JSON.stringify(currentProjection.coords) !== JSON.stringify(updatedProjection?.coords)) {
          this.selectedProjection.set(updatedProjection);
        }
      }
    }, { allowSignalWrites: true });

    // Effect pour la carte
    effect(() => {
      if (this.mapService.mapReady()) {
        this.setInputData(this.inputData());
        this.mapService.map.on('click', this.mapClickHandler as (ev: MapMouseEvent) => void);
        this.mapService.map.on('mousemove', this.mapMouseMoveHandler as (ev: MapMouseEvent) => void);
      }
    });
  }

  ngOnInit() {
  
  }

  ngOnDestroy() {
    const geojson: GeoJSON.GeoJSON = {type: 'FeatureCollection', features: []};
    const source = this.mapService.map.getSource('bboxToCoords') as GeoJSONSource;
    source?.setData(geojson);
    this.mapService.map.off('click', this.mapClickHandler as (ev: MapMouseEvent) => void);
    this.mapService.map.off('mousemove', this.mapMouseMoveHandler as (ev: MapMouseEvent) => void);
  }

  private mapClickHandler = (e: MapMouseEvent) => {
    const currentCoords: [number, number] = [e.lngLat.lng, e.lngLat.lat];
    if (this.startCoords()) {
      this.setInputData([this.startCoords()!, currentCoords]);
      this.startCoords.set(undefined);
    } else {
      this.startCoords.set(currentCoords);;
    }
    
   
  };

  private mapMouseMoveHandler = (e: MapMouseEvent) => {
    if (!this.startCoords()) return;
    
    const now = performance.now();
    if (now - this.lastDrawTime < this.FRAME_RATE) return;
    this.lastDrawTime = now;
    
    const currentCoords: [number, number] = [e.lngLat.lng, e.lngLat.lat];
    const start = this.startCoords()!;
    
    const geojson: GeoJSON.GeoJSON = {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Polygon',
          coordinates: [[
            start,
            [start[0], currentCoords[1]],
            currentCoords,
            [currentCoords[0], start[1]],
            start
          ]]
        }
      }]
    };
    
    const source = this.mapService.map.getSource('bboxToCoords') as GeoJSONSource;
    source?.setData(geojson);
  };

  setInputData(coords: [[number, number], [number, number]] | undefined) {
    if (!coords) return;
    this.inputData.set(coords);
    
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
    source?.setData(geojson);
  }

  formatChange(format: string) {
    this.currentFormat.set(format);
  }

  setOrderBy(field: string) {
    this.orderByField.set(
      !this.orderByField() ? field : 
      this.orderByField() === field ? `-${field}` : 
      this.orderByField() === `-${field}` ? '' : field
    );
  }

  onClickProjection(p: any): void {
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
