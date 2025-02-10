import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';
import '@angular/localize/init';

setupZoneTestEnv();

// Mock pour maplibre-gl
jest.mock('maplibre-gl', () => ({
  Map: jest.fn(),
  NavigationControl: jest.fn(),
  Marker: jest.fn(() => ({
    setLngLat: jest.fn().mockReturnThis(),
    addTo: jest.fn().mockReturnThis()
  })),
  LngLat: jest.fn(),
  LngLatBounds: jest.fn(),
  GeoJSONSource: jest.fn()
}));
