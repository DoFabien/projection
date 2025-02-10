import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { ProjectionsService } from '../services/projections.service';
import { MapService } from '../services/map.service';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { EventEmitter } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { NavigationStart, Event as RouterEvent } from '@angular/router';
import { fakeAsync, tick, flush } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Subject } from 'rxjs';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let projectionsService: ProjectionsService;
  let mapService: MapService;
  let routerEvents: Subject<RouterEvent>;

  beforeEach(async () => {
    const mockProjectionsService = {
      projections: [],
      projectionCodeSelected: '',
      filterText: '',
      filterBbox: false,
      eventProjectionsFromWGS84: new EventEmitter(),
      eventProjectionsToWGS84: new EventEmitter(),
      loadProjections: jest.fn(),
      setProjection: jest.fn(),
      filterProjections: jest.fn(),
      getProjections: jest.fn()
    };

    const mockMapService = {
      map: null,
      mapReady: false,
      featureColor: '#ff0000',
      initMap: jest.fn(),
      clearMarkers: jest.fn(),
      geocode: jest.fn(),
      getLocation: jest.fn()
    };

    routerEvents = new Subject<RouterEvent>();
    const mockRouter = {
      events: routerEvents,
      navigate: jest.fn(),
      url: '/'
    };

    const mockActivatedRoute = {
      snapshot: {
        paramMap: new Map()
      }
    };

    await TestBed.configureTestingModule({
      imports: [
        RouterModule,
        MatSlideToggleModule,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
        MatButtonModule,
        FormsModule,
        NoopAnimationsModule,
        AppComponent
      ],
      providers: [
        provideHttpClient(),
        { provide: ProjectionsService, useValue: mockProjectionsService },
        { provide: MapService, useValue: mockMapService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    }).compileComponents();

    projectionsService = TestBed.inject(ProjectionsService);
    mapService = TestBed.inject(MapService);
  });

  beforeEach(() => {
    localStorage.clear();
    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize the map after view init', () => {
    component.ngAfterViewInit();
    expect(mapService.initMap).toHaveBeenCalledWith('map');
  });

  it('should load projections on init', () => {
    component.ngOnInit();
    expect(projectionsService.loadProjections).toHaveBeenCalled();
  });

  it('should clear markers on route change', () => {
    routerEvents.next(new NavigationStart(0, '/'));
    component.ngOnInit();
    expect(mapService.clearMarkers).toHaveBeenCalled();
  });

  it('should geocode a location', () => {
    const location = 'Paris';
    component.geocodeText.set(location);
    component.geocode(location);
    expect(mapService.geocode).toHaveBeenCalledWith(location);
  });

  it('should not geocode an empty location', () => {
    component.geocodeText.set('');
    component.geocode('');
    expect(mapService.geocode).not.toHaveBeenCalled();
  });

  it('should get the user location', () => {
    component.getLocation();
    expect(mapService.getLocation).toHaveBeenCalled();
  });

  it('should set order by field', () => {
    component.setOrderBy('code');
    expect(component.orderByField()).toBe('code');
    component.setOrderBy('code');
    expect(component.orderByField()).toBe('-code');
    component.setOrderBy('code');
    expect(component.orderByField()).toBe('');
    component.setOrderBy('name');
    expect(component.orderByField()).toBe('name');
  });

  describe('Global state handling', () => {
    it('should persist state changes to localStorage', fakeAsync(() => {
      // Initialize component
      component.ngOnInit();
      tick(500);
      fixture.detectChanges();

      // Verify initial state in both signal and localStorage
      let state = JSON.parse(localStorage.getItem('global-state') || '{}');
      expect(state).toEqual({
        searchTerm: '',
        filterByBbox: true,
        orderByField: ''
      });

      // Change values one by one with detectChanges after each
      component.searchTerm.set('newTest');
      fixture.detectChanges();
      tick(500);

      component.filterByBbox.set(false);
      fixture.detectChanges();
      tick(500);

      component.orderByField.set('name');
      fixture.detectChanges();
      tick(500);

      // Force a flush
      flush();
      fixture.detectChanges();

      // Final verification
      state = JSON.parse(localStorage.getItem('global-state') || '{}');
      expect(state).toEqual({
        searchTerm: 'newTest',
        filterByBbox: false,
        orderByField: 'name'
      });
    }));
  });
});
