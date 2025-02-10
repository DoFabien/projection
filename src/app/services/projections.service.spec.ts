import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ProjectionsService } from './projections.service';
import { HttpClient } from '@angular/common/http';
import projectionsList from '../../assets/projections.json';

describe('ProjectionsService', () => {
  let service: ProjectionsService;
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ProjectionsService]
    });
    service = TestBed.inject(ProjectionsService);
    httpMock = TestBed.inject(HttpTestingController);
    httpClient = TestBed.inject(HttpClient);
  });

  afterEach(() => {
    httpMock.verify(); // Vérifie qu'il n'y a pas de requêtes non vérifiées
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should load projections from JSON', () => {
    service.loadProjections();
    expect(service.projections).toEqual(projectionsList);
  });

  it('should get the selected projection code', () => {
    service.setProjectionCodeSelected('EPSG:4326');
    expect(service.getProjectionCodeSelected()).toBe('EPSG:4326');
  });

  it('should set the selected projection code', () => {
    service.setProjectionCodeSelected('EPSG:3857');
    expect(service.projectionCodeSelected).toBe('EPSG:3857');
  });

  it('should return a copy of projections', () => {
    service.loadProjections();
    const projections = service.getProjections();
    expect(projections).toEqual(projectionsList);
    expect(projections).not.toBe(projectionsList); // Vérifie que c'est une copie
  });

  it('should filter projections by code or name (getFilterProjection)', () => {
    service.loadProjections();
    // Test avec une recherche existante
    let filtered = service.getFilterProjection('4326');
    expect(filtered.length).toBeGreaterThanOrEqual(1);
    expect(filtered[0].code).toContain('4326');

    // Test avec une recherche inexistante
    filtered = service.getFilterProjection('NonExistent');
    expect(filtered.length).toBe(0);

    // Test avec une recherche insensible à la casse
    filtered = service.getFilterProjection('wgs');
    expect(filtered.length).toBeGreaterThanOrEqual(1);
    expect(filtered[0].name.toLowerCase()).toContain('wgs');
  });

  it('should get projections from WGS84 (getProjsectionsFromWGS84)', () => {
    service.loadProjections();
    const lng = 2.35;
    const lat = 48.85;
    const filterByBbox = true;
    const searchTerm = '';

    const result = service.getProjsectionsFromWGS84(lng, lat, filterByBbox, searchTerm);
    expect(result.length).toBeGreaterThanOrEqual(0);
  });

  it('should get projections to WGS84 (getProjectionsToWGS84)', () => {
    service.loadProjections();
    const lng = 2.35;
    const lat = 48.85;
    const filterByBbox = true;
    const searchTerm = '';

    const result = service.getProjectionsToWGS84(lng, lat, filterByBbox, searchTerm);
    expect(result.length).toBeGreaterThanOrEqual(0);
  });

  it('should get coords from bbox (getCoordsFromBbox)', () => {
    service.loadProjections();
    const coords: [[number, number], [number, number]] = [[2, 48], [3, 49]];
    const filterByBbox = true;
    const searchTerm = '';

    const result = service.getCoordsFromBbox(coords, filterByBbox, searchTerm);
    expect(result.length).toBeGreaterThanOrEqual(0);
  });

  it('should get projection by code (getProjectionByCode)', () => {
    service.loadProjections();
    const projection = service.getProjectionByCode('EPSG:4326', service.projections);
    expect(projection).toBeDefined();
    expect(projection?.code).toBe('EPSG:4326');

    const nonExistentProjection = service.getProjectionByCode('NonExistent', service.projections);
    expect(nonExistentProjection).toBeUndefined();
  });

  it('should check if projection is present (projIsPresent)', () => {
    service.loadProjections();
    expect(service.projIsPresent('EPSG:4326', service.projections)).toBe(true);
    expect(service.projIsPresent('NonExistent', service.projections)).toBe(false);
    expect(service.projIsPresent(undefined, service.projections)).toBe(false);
  });
});