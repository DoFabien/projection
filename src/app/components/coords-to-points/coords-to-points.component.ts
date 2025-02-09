import { Component, signal, model, effect, input, OnInit } from '@angular/core';
import { ProjectionsService } from '../../services/projections.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { OrderBy } from '../../pipes/order_by.pipe';
import { FilterPipe } from '../../pipes/filter.pipe';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MapService } from '../../services/map.service';
import { GeoJSONSource } from 'maplibre-gl';
import { BaseProjectionComponent } from '../base-projection.component';
import { computed } from '@angular/core';

@Component({
  selector: 'app-coords-to-points',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule, MatFormFieldModule, 
    MatInputModule, MatCardModule, OrderBy, MatIconModule, 
    MatButtonModule, ReactiveFormsModule
, FilterPipe
  ],
  templateUrl: './coords-to-points.component.html',
  styleUrls: ['./coords-to-points.component.scss']
})
export class CoordsToPointsComponent extends BaseProjectionComponent implements OnInit {
  filterByBbox = input<boolean>(true);
  inputData = model<[number, number] | undefined>(undefined);
  
  lng = signal<string>('');
  lat = signal<string>('');
  isValid = computed(() => {
    const pattern = /^\s*-?[0-9]*\.?[0-9]*\s*$/;
    return pattern.test(this.lng()) && pattern.test(this.lat()) &&
           this.lng().trim() !== '' && this.lat().trim() !== '';
  });

  coordsForm = new FormGroup({
    lng: new FormControl('', [Validators.required, Validators.pattern(/\s*?-?[0-9]*\.?[0-9]*?\s*?/)]),
    lat: new FormControl('', [Validators.required, Validators.pattern(/\s*?-?[0-9]*\.?[0-9]*?\s*?/)])
  });

  constructor(
    projectionsService: ProjectionsService,
    mapService: MapService
  ) {
    super(projectionsService, mapService);

    // Effect for projections update when coordinates change
    effect(() => {
      const lng = this.lng();
      const lat = this.lat();
      if (lng && lat) {
        const _lng = Number(lng);
        const _lat = Number(lat);
        if (this.coordIsValid(_lng, 'lng') && this.coordIsValid(_lat, 'lat')) {
          this.resultProjections.set(
            this.projectionsService.getProjectionsToWGS84(_lng, _lat, this.filterByBbox(), this.searchTerm())
          );
          this.updateMapFeatures();
          this.saveState();
        }
      }
    });
  }

  override ngOnInit() {
    super.ngOnInit();
    
    // Restaurer les données sauvegardées
    const savedState = localStorage.getItem(this.getStorageKey());
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        if (state.coordinates) {
          const { lng, lat } = state.coordinates;
          this.lng.set(lng);
          this.lat.set(lat);
        }
      } catch (error) {
        console.error('Error loading state:', error);
      }
    }
  }


  protected override initializeMap(): void {
    this.mapService.map.on('click', this.mapClickHandler);

    // Cleanup on destroy
    this.destroyRef.onDestroy(() => {
      this.mapService.map.off('click', this.mapClickHandler);
      const geojson: GeoJSON.GeoJSON = { type: 'FeatureCollection', features: [] };
      const source = this.mapService.map.getSource('coordsToPoints') as GeoJSONSource;
      source?.setData(geojson);
    });
  }

  protected override getStorageKey(): string {
    return 'coords-to-points-state';
  }

  private saveState() {
    const state = {
      coordinates: {
        lng: this.lng(),
        lat: this.lat()
      },
      filterByBbox: this.filterByBbox()
    };
    localStorage.setItem(this.getStorageKey(), JSON.stringify(state));
  }

  private coordIsValid(coord: string | number | null | undefined, type: 'lng' | 'lat'): boolean {
    if (coord === null || coord === undefined || coord === '') return false;
    const num = typeof coord === 'string' ? Number(coord) : coord;
    return !isNaN(num) && isFinite(num);
  }

  private updateMapFeatures(): void {
    let features: GeoJSON.Feature[] = [];
    for (const projection of this.resultProjections()) {
      if (!projection.lng || !projection.lat) continue;
      features.push({
        type: 'Feature',
        properties: { code: projection.code, name: projection.name, region: projection.region },
        geometry: { type: 'Point', coordinates: [projection.lng, projection.lat] }
      });
    }
    this.drawFeatures(features);
  }

  private drawFeatures(features: GeoJSON.Feature[]): void {
    if (!this.mapService.map) return;
    const geojson: GeoJSON.GeoJSON = {
      type: 'FeatureCollection',
      features: features
    };
    const source = this.mapService.map.getSource('coordsToPoints') as GeoJSONSource;
    if (source) {
      source.setData(geojson);
    }
  }

  private mapClickHandler = (e: any) => {
    const features = this.mapService.map.queryRenderedFeatures(e.point, {
      layers: ['coordsToPoints-layer']
    });

    if (features.length > 0) {
      const feature = features[0];
      this.selectProjectionFromMap(feature);
    }
  };

  selectProjectionFromList(projection: Projection) {
    this.selectedProjection.set(projection);
    if (projection.lng && projection.lat) {
      this.mapService.map.flyTo({
        center: [projection.lng, projection.lat],
        zoom: 15
      });
    }
  }

  selectProjectionFromMap(feature: any) {
    if (!feature.properties?.['code']) return;
    const currentProjection = this.resultProjections().find(p => p.code === feature.properties['code']);
    this.selectedProjection.set(currentProjection);
    this.scrollToSelectedProjection(feature.properties?.['code']);
  }

  scrollToSelectedProjection(code: string) {
    document.getElementById(code)?.scrollIntoView();
  }

  onPastLng = (e: ClipboardEvent) => {
    const data = e.clipboardData?.getData('text/plain').trim() || '';

    // Qgis like (12.345,6.7891)
    const qgisFormat = /^(-?[0-9]+\.?[0-9]*)\s?,\s?(-?[0-9]+\.?[0-9]*)$/;
    if (qgisFormat.test(data)) {
      e.preventDefault();
      const [lng, lat] = data.split(',').map(coord => coord.trim());
      this.lng.set(lng);
      this.lat.set(lat);
      return;
    }

    // WKT format
    const wktFormat = /(LineString|Point|Polygon|MULTIPOLYGON|MULTIPOINT|MULTILINESTRING)\s*\(+(-?[0-9]+\.?[0-9]*)\s(-?[0-9]+\.?[0-9]*)/i;
    const wktMatch = data.match(wktFormat);
    if (wktMatch) {
      e.preventDefault();
      this.lng.set(wktMatch[2]);
      this.lat.set(wktMatch[3]);
    }
  };

  public reverseLngLat() {
    const lng = this.lng();
    const lat = this.lat();
    this.lng.set(lat);
    this.lat.set(lng);
    this.saveState();
  }
}
