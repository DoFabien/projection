import { Injectable, signal } from '@angular/core';
import { Map, NavigationControl, Marker, LngLat, LngLatBounds, GeoJSONSource } from 'maplibre-gl';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { GeocoderService } from './geocoder.service';

@Injectable({
  providedIn: 'root'
})
export class MapService {
  public map!: Map;
  private markers: Marker[] = [];
  private coordsBbox: LngLat[] = [];
  private locationInit: LngLat | null = null;
  private mapStyle = signal<any | null>(null);
  public mapReady = signal<boolean>(false);

  readonly featureColor = {
    selected: '#FF0000',
    unselected: '#000000'
  };

  constructor(
    private geocoderService: GeocoderService,
    private http: HttpClient
  ) {}

  private async loadMapStyle(): Promise<any> {
    const style = await firstValueFrom(this.http.get<any>('/assets/map-styles/osm-raster.json'));
    
    // Ajouter le sprite personnalisé
    style.sprite = [
      {
        id: 'projection',
        url: '/assets/map-styles/sprites/projection'
      }
    ];

    this.mapStyle.set(style);
    return style;
  }

  async initMap(elementId: string): Promise<void> {
    const style = await this.loadMapStyle();

    return new Promise<void>((resolve) => {
      this.map = new Map({
        container: elementId,
        style: style,
        center: this.locationInit ? [this.locationInit.lng, this.locationInit.lat] : [5, 48],
        zoom: this.locationInit ? 13 : 6
      });


      this.map.on('load', () => {
        // Source pour la géolocalisation
        this.map.addSource('userLocation', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: []
          }
        });

        // Layer pour la géolocalisation
        this.map.addLayer({
          id: 'userLocation-layer',
          type: 'circle',
          source: 'userLocation',
          paint: {
            'circle-radius': 8,
            'circle-color': '#4285F4',  // Bleu Google Maps
            'circle-stroke-width': 2,
            'circle-stroke-color': '#FFFFFF'
          }
        });

        this.map.addSource('pointToCoords', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: []
          }
        });

        this.map.addSource('coordsToPoints', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: []
          }
        });
        this.map.addSource('bboxToCoords', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: []
          }
        });

        this.map.addLayer({
          id: 'pointToCoords-layer',
          type: 'symbol',
          source: 'pointToCoords',
          layout: {
            'icon-image': 'projection:PointToCoord',
            'icon-allow-overlap': true,
            'icon-ignore-placement': true,
            'icon-offset': [0, -14],
          }
        });

        this.map.addLayer({
          id: 'coordsToPoints-layer',
          type: 'symbol',
          source: 'coordsToPoints',
          layout: {
            'icon-image': 'projection:{region}',
            'icon-allow-overlap': true,
            'icon-ignore-placement': true,
            'icon-offset': [0, -14],
          }
        });

        this.map.addLayer({
          id: 'bboxToCoords-layer',
          type: 'line',
          source: 'bboxToCoords',
          paint: {
            'line-color': '#0000FF',
            'line-width': 2
          }
        });

        this.map.addControl(new NavigationControl());
        this.getLocation();
        
        this.mapReady.set(true);
        resolve();
      });
    
      setTimeout(() => {
        this.map.resize();
      }, 0);
    
      window.addEventListener('resize', () => {
        this.map.resize();
      });
    });

  }



  private addBboxToMap(coordinates: number[][]): void {
    if (!this.map.getSource('bbox')) {
      this.map.addSource('bbox', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [coordinates[0][0], coordinates[0][1]],
              [coordinates[0][0], coordinates[1][1]],
              [coordinates[1][0], coordinates[1][1]],
              [coordinates[1][0], coordinates[0][1]],
              [coordinates[0][0], coordinates[0][1]]
            ]]
          }
        }
      });

      this.map.addLayer({
        id: 'bbox-fill',
        type: 'fill',
        source: 'bbox',
        paint: {
          'fill-color': this.featureColor.selected,
          'fill-opacity': 0.2
        }
      });

      this.map.addLayer({
        id: 'bbox-line',
        type: 'line',
        source: 'bbox',
        paint: {
          'line-color': this.featureColor.selected,
          'line-width': 2
        }
      });
    } else {
      const source = this.map.getSource('bbox') as maplibregl.GeoJSONSource;
      source.setData({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [coordinates[0][0], coordinates[0][1]],
            [coordinates[0][0], coordinates[1][1]],
            [coordinates[1][0], coordinates[1][1]],
            [coordinates[1][0], coordinates[0][1]],
            [coordinates[0][0], coordinates[0][1]]
          ]]
        }
      });
    }
  }

  private updateBboxPreview(lngLat: LngLat): void {
    if (this.coordsBbox.length === 1) {
      this.addBboxToMap([
        [this.coordsBbox[0].lng, this.coordsBbox[0].lat],
        [lngLat.lng, lngLat.lat]
      ]);
    }
  }


  getLocation(): void {
    this.geocoderService.getLocation().subscribe(position => {
      const coords: [number, number] = [position.coords.longitude, position.coords.latitude];
      
      // Mettre à jour la source avec la nouvelle position
      const geojson: GeoJSON.GeoJSON = {
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: coords
          },
          properties: {}
        }]
      };

      (this.map.getSource('userLocation') as GeoJSONSource).setData(geojson);

      // Centrer la carte sur la position
      this.map.flyTo({
        center: coords,
        zoom: 13
      });
    });
  }

  geocode(text: string): void {
    this.geocoderService.getCoordsByAdress(text).subscribe(coords => {
      this.clearMarkers();
      const marker = new Marker()
        .setLngLat([coords[0], coords[1]])
        .addTo(this.map);
      this.markers.push(marker);
      this.map.flyTo({
        center: [coords[0], coords[1]],
        zoom: 13
      });
    });
  }

  clearMarkers(): void {
    if (!this.map) return;
    if (this.map.getSource('points')) {
      (this.map.getSource('points') as GeoJSONSource).setData({
        type: 'FeatureCollection',
        features: []
      });
    }
    // this.store.updateFeaturePointToCoords([]);
  }

}
