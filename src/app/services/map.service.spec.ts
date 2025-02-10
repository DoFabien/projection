import { TestBed } from '@angular/core/testing';
import { MapService } from './map.service';
import { provideHttpClient } from '@angular/common/http';

describe('MapService', () => {
  let service: MapService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MapService,
        provideHttpClient()
      ]
    });
    service = TestBed.inject(MapService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
