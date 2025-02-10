import { Component, OnInit, AfterViewInit, signal, model, effect } from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {MatDividerModule} from '@angular/material/divider';
import {MatButtonModule} from '@angular/material/button';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field'
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import { ProjectionsService } from '../services/projections.service';
import {  Router, NavigationStart, RouterOutlet, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {MatTooltipModule} from '@angular/material/tooltip';
import { MapService } from '../services/map.service';
import { PointToCoordsComponent } from './point-to-coords/point-to-coords.component';
import { CoordsToPointsComponent } from './coords-to-points/coords-to-points.component';
import { BboxToCoordsComponent } from './bbox-to-coords/bbox-to-coords.component';
import { Feature } from 'maplibre-gl';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule, 
        MatButtonModule, MatDividerModule, MatIconModule, MatFormFieldModule, MatInputModule, MatSlideToggleModule, MatTooltipModule, 
        PointToCoordsComponent, CoordsToPointsComponent, BboxToCoordsComponent],
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, AfterViewInit {

  filterText = signal<string>('');
  searchTerm = signal<string>('');
  filterByBbox = model<boolean>(true);
  geocodeText = signal<string>('');
  orderByField = signal<string>('');

  featurePointToCoordsInput = signal<[number, number] | undefined>(undefined);

  constructor(
    public projectionsService: ProjectionsService,
    public router: Router,
    private mapService: MapService
  ) {
    router.events.subscribe(e => {
      if (e instanceof NavigationStart) {
        this.mapService.clearMarkers();
      }
    });

    // Effect pour sauvegarder l'état global
    effect(() => {
      const state = {
        searchTerm: this.searchTerm(),
        filterByBbox: this.filterByBbox(),
        orderByField: this.orderByField()
      };
      localStorage.setItem('global-state', JSON.stringify(state));
    });
  }

  ngOnInit() {
    this.projectionsService.loadProjections();
    
    // Charger l'état global
    const savedState = localStorage.getItem('global-state');
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        if (state.searchTerm) this.searchTerm.set(state.searchTerm);
        if (state.filterByBbox !== undefined) this.filterByBbox.set(state.filterByBbox);
        if (state.orderByField) this.orderByField.set(state.orderByField);
      } catch (error) {
        console.error('Error loading global state:', error);
      }
    }
  }

  ngAfterViewInit() {
    this.mapService.initMap('map');
  }

  geocode(text: string | undefined) {
    if (text) {
      this.mapService.geocode(text);
    }
  }

  getLocation(center: boolean = true) {
    this.mapService.getLocation(center);
  }

  setOrderBy(field: string) {
    this.orderByField.set(!this.orderByField() ? field : 
      this.orderByField() === field ? `-${field}` : 
      this.orderByField() === `-${field}` ? '' : field
    );
  }
}
