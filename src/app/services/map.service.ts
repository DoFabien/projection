import { Injectable } from '@angular/core';
import { Map, NavigationControl, Marker, LngLat, LngLatBounds, GeoJSONSource } from 'maplibre-gl';

import { GeocoderService } from './geocoder.service';

@Injectable({
  providedIn: 'root'
})
export class MapService {
  public map!: Map;
  private markers: Marker[] = [];
  private coordsBbox: LngLat[] = [];
  private locationInit: LngLat | null = null;

  readonly featureColor = {
    selected: '#FF0000',
    unselected: '#000000'
  };

  constructor(
    private geocoderService: GeocoderService,

  ) {}

  initMap(elementId: string): void {
    this.map = new Map({
      container: elementId,
      style: 'https://api.maptiler.com/maps/dataviz/style.json?key=K3kqmAaVrAgobSv6Bs6e',
      center: this.locationInit ? [this.locationInit.lng, this.locationInit.lat] : [5, 48],
      zoom: this.locationInit ? 13 : 6
    });
  
    setTimeout(() => {
      this.map.resize();
    }, 0);
  
    window.addEventListener('resize', () => {
      this.map.resize();
    });
  
    this.map.on('load', () => {
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
        type: 'circle',
        source: 'pointToCoords',
        paint: {
          'circle-radius': 6,
          'circle-color': '#FF0000',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#FFFFFF'
        }
      });

      this.map.addLayer({
        id: 'coordsToPoints-layer',
        type: 'circle',
        source: 'coordsToPoints',
        paint: {
          'circle-radius': 6,
          'circle-color': '#00FF00',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#000000'
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
    });
  
    this.map.addControl(new NavigationControl());
    this.getLocation();
  }


  private getColorIcon(region: string): string {
    const colorMap: { [key: string]: string } = {
      'World': 'blue-dark',
      'France': 'cyan',
      'Europe': 'blue',
      'Guadeloupe': 'cyan',
      'Guiana': 'cyan',
      'Martinique': 'cyan',
      'Reunion': 'cyan',
      'Polynesia': 'cyan',
      'New Caledonia': 'cyan',
      'Mayotte': 'cyan',
      'Belgium': 'yellow',
      'Ireland': 'green-dark',
      'Luxembourg': 'red',
      'Suisse': 'red',
      'Italy': 'green',
      'USA-Canada': 'purple',
      'Spain': 'orange-dark',
      'North America': 'violet',
      'USA': 'violet',
      'Canada': 'purple',
      'Vietnam': 'green-dark',
      'Indonesia': 'purple',
      'Western Sahara': 'purple',
      'Morocco': 'orange-dark',
      'Algeria': 'green-dark',
      'Tunisia': 'orange-dark'
    };
    return colorMap[region] || 'black';
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
      this.clearMarkers();
      const marker = new Marker()
        .setLngLat(coords)
        .addTo(this.map);
      this.markers.push(marker);
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
    if (this.map.getSource('points')) {
      (this.map.getSource('points') as GeoJSONSource).setData({
        type: 'FeatureCollection',
        features: []
      });
    }
    // this.store.updateFeaturePointToCoords([]);
  }

}
