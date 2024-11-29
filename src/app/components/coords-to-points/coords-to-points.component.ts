import { Component, OnInit, OnDestroy, signal, model, effect, EffectRef, computed, input } from '@angular/core';
import { ProjectionsService } from '../../services/projections.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { OrderBy } from '../../pipes/order_by.pipe';
import { MatIconModule } from '@angular/material/icon';
import { RoundCoords } from '../../pipes/round_coords.pipe';
import { MatButtonModule } from '@angular/material/button';
import { MapService } from '../../services/map.service';
import { GeoJSONSource } from 'maplibre-gl';



@Component({
    selector: 'app-coords-to-points',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule, MatFormFieldModule, MatInputModule, MatCardModule, OrderBy,
        MatIconModule, MatButtonModule, ReactiveFormsModule, OrderBy
    ],
    templateUrl: './coords-to-points.component.html',
    styleUrls: ['./coords-to-points.component.scss']
})
export class CoordsToPointsComponent implements OnInit, OnDestroy {


  filterByBbox = input<boolean>(true);

  orderByField = signal<string>('');
  inputData = model<[number, number] | undefined>(undefined);
  resultProjections = signal<Projection[]>([]);
  selectedProjection = signal<Projection | undefined>(undefined);
 
  private formEffect: EffectRef | undefined;

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
    public projectionsService: ProjectionsService,
    public mapService: MapService ) {
      this.formEffect = effect(() => {
        const coords = this.inputData();
        if (coords) {
          this.coordsForm.patchValue({
            lng: coords[0].toString(),
            lat: coords[1].toString()
          }, { emitEvent: false });
        }
      });

      effect(() => {
          this.setInputData([this.lng(), this.lat()]);

      });
  }

  ngOnInit() {
    if (!this.mapService.map) return;
    this.mapService.map.on('click', this.mapClickHandler);
    this.setInputData([this.lng(), this.lat()]);

  }

  private coordIsValid(coord: string | number | null | undefined, type: 'lng' | 'lat'): boolean {
    if (coord === null || coord === undefined || coord === '') return false;
    const num = typeof coord === 'string' ? Number(coord) : coord;
    if (isNaN(num) ||  !isFinite(num) ){
      return false;
    }

    // if (type === 'lng' && (num < -180 || num > 180)) return false;
    // if (type === 'lat' && (num < -90 || num > 90)) return false;
    return true;
  }

  ngOnDestroy() {
    this.mapService.map.off('click', this.mapClickHandler);

    const geojson: GeoJSON.GeoJSON = {type: 'FeatureCollection',features:[]}
    const source = this.mapService.map.getSource('coordsToPoints') as GeoJSONSource;
    source?.setData(geojson);
    this.formEffect?.destroy();
  }

  drawFeateurs(features: GeoJSON.Feature[]):void{
    const geojson: GeoJSON.GeoJSON = {
      type: 'FeatureCollection',
      features: features
    }
    const source = this.mapService.map.getSource('coordsToPoints') as GeoJSONSource;
    source?.setData(geojson);
  }

  isValidCoords(coords: [any, any] | undefined): boolean {
    return !!coords && coords.length === 2 && this.coordIsValid(coords[0], 'lng') && this.coordIsValid(coords[1], 'lat');
  }

  setInputData(coords: [string, string] | undefined) {
    let errorInput = [];
    const lng = coords?.[0]?.trim();
    const lat = coords?.[1]?.trim();

    // Vérifier d'abord si les chaînes sont vides
    if (!lng || !lat) {
      this.resultProjections.set([]);
      this.drawFeateurs([]);
      errorInput.push('empty coordinates');
      return;
    }

    const _lng = Number(lng);
    const _lat = Number(lat);
 
    if (!this.coordIsValid(_lng, 'lng') || !this.coordIsValid(_lat, 'lat')) {
      if (!coords) errorInput.push('coords undefined');
      if (coords?.length !== 2) errorInput.push('coords length not valid');
      if (!this.coordIsValid(_lng, 'lng')) errorInput.push('coord lng not valid');
      if (!this.coordIsValid(_lat, 'lat')) errorInput.push('coord lat not valid');
      
      this.resultProjections.set([]);
      this.drawFeateurs([]);
      return;
    } 

    // this.inputData.set(coords);
    this.resultProjections.set(this.projectionsService.getProjectionsToWGS84(_lng, _lat, this.filterByBbox()));
  
    let features: GeoJSON.Feature[] = [];
    for (const projection of this.resultProjections()) {
      if (!projection.lng || !projection.lat) continue;
      features.push({
        type: 'Feature',
        properties: { code: projection.code, name: projection.name, region: projection.region },
        geometry: { type: 'Point', coordinates: [projection.lng, projection.lat] }
      });
    }
  
    this.drawFeateurs(features);
  }

  selectProjectrionFromList(projection: Projection) {
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

  private mapClickHandler = (e: any) => {
    const features = this.mapService.map.queryRenderedFeatures(e.point, {
      layers: ['coordsToPoints-layer']
    });
    
    if (features.length > 0) {
      // Un point a été cliqué
      const feature = features[0];
      this.selectProjectionFromMap(feature);
    }

  };

  scrollToSelectedProjection = function (code: string) {
    if (document.getElementById(code)) {
      document.getElementById(code)?.scrollIntoView();
    }
  };

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


  setOrderBy(field: string) {
    this.orderByField.set(!this.orderByField() ? field : this.orderByField() === field ? `-${field}` : this.orderByField() === `-${field}` ? '' : field);
  }

  reverseLngLat() {

    const lng = this.lng();
    const lat = this.lat();
    this.lng.set(lat);
    this.lat.set(lng);

  }

 

}
