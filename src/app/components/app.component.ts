import { Component, OnInit, AfterViewInit, signal, model, effect, inject } from '@angular/core';
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
import { GlobalStateService } from '../services/global-state.service';
import { Feature } from 'maplibre-gl';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule, 
        MatButtonModule, MatDividerModule, MatIconModule, MatFormFieldModule, MatInputModule, MatSlideToggleModule, MatTooltipModule],
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, AfterViewInit {

  // Injection avec inject()
  public projectionsService = inject(ProjectionsService);
  public router = inject(Router);
  private mapService = inject(MapService);
  public globalState = inject(GlobalStateService);

  // Local signals
  geocodeText = signal<string>('');

  // Computed from global state
  get searchTerm() { return this.globalState.searchTerm; }
  get filterByBbox() { return this.globalState.filterByBbox; }
  get orderByField() { return this.globalState.orderByField; }
  get featurePointToCoordsInput() { return this.globalState.featurePointToCoordsInput; }

  constructor() {
    this.router.events.subscribe(e => {
      if (e instanceof NavigationStart) {
        this.mapService.clearMarkers();
      }
    });

  }

  ngOnInit() {
    this.projectionsService.loadProjections();
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
    this.globalState.setOrderBy(field);
  }
}
