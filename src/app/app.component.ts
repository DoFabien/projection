// import { Component } from '@angular/core';

// @Component({
//   selector: 'app-root',
//   templateUrl: './app.component.html',
//   styleUrls: ['./app.component.css']
// })
// export class AppComponent {
//   title = 'app';
// }

import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';


import { ProjectionsService } from './shared/projections.service';
import { GeocoderService } from './shared/geocoder.service';

// import { MdUniqueSelectionDispatcher } from '@angular2-material/core';
import { ActivatedRoute, Router, NavigationStart } from '@angular/router';
// import { MdIconRegistry } from '@angular2-material/icon';



declare let L: any;
@Component({
  selector: 'app-app', // <app-app></app-app>
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  // providers: [MdUniqueSelectionDispatcher],
  // viewProviders: [MdIconRegistry]
})

export class AppComponent implements OnInit, OnDestroy, AfterViewInit {
  // subscription: Subscription;
  filterText = '';
  map: any;
  markerLayer: any;
  locationLayer: any;
  coordsBbox = [];
  locationInit;
  geocodeText;


  featureColor = {
    selected: { fillColor: '#FF0000', color: '#FF0000' },
    unselected: { fillColor: '#000000', color: '#000000' }
  };


  constructor(public projectionsService: ProjectionsService,
    private route: ActivatedRoute,
    public router: Router,
    private geocoderService: GeocoderService) {
    router.events.subscribe(e => {
      if (e instanceof NavigationStart) {
        this.markerLayer.clearLayers();
      }
    });


  }

  // red orange-dark orange yellow blue-dark blue cyan purple violet pink green-dark green green-light black white
  getColorIcon = function (region) {
    switch (region) {
      case 'World': return 'blue-dark';
      case 'France': return 'cyan';
      case 'Europe': return 'blue';
      case 'Guadeloupe': return 'cyan';
      case 'Guiana': return 'cyan';
      case 'Martinique': return 'cyan';
      case 'Reunion': return 'cyan';
      case 'Polynesia': return 'cyan';
      case 'New Caledonia': return 'cyan';
      case 'Mayotte': return 'cyan';
      case 'Belgium': return 'yellow';
      case 'Ireland': return 'green-dark';
      case 'Luxembourg': return 'red';
      case 'Suisse': return 'red';
      case 'Italy': return 'green';
      case 'USA-Canada': return 'purple';
      case 'Spain': return 'orange-dark';
      case 'North America': return 'violet';
      case 'USA': return 'violet';
      case 'Canada': return 'purple';
      case 'Vietnam': return 'green-dark';
      case 'Indonesia': return 'purple';
      case 'Western Sahara': return 'purple';
      case 'Morocco': return 'orange-dark';
      case 'Algeria': return 'green-dark';
      case 'Tunisia': return 'orange-dark';
      default: return 'black';
    }
  };

  drawMarkerFromCoords(coords_list) {

    this.markerLayer.clearLayers();
    const markers = L.markerClusterGroup({ maxClusterRadius: 30 });
    this.markerLayer.addLayer(markers);
    for (let i = 0; i < coords_list.length; i++) {
      const extraMarkers = L.ExtraMarkers.icon({
        icon: 'fa-number',
        iconColor: 'white',
        markerColor: this.getColorIcon(coords_list[i].region),
        shape: 'circle',
        prefix: 'fa',
        number: coords_list[i].region.substr(0, 3)
      });

      const marker = L.marker([coords_list[i].lat, coords_list[i].lng], { icon: extraMarkers });
      marker.code = coords_list[i].code;

      marker.on('click', function (e) {
        this.projectionsService.setProjectionCodeSelected({ code: e.target.code, fromMap: true });
      }
        , this);
      markers.addLayer(marker);
    }

  }

  onClickPolygon = function (e) {
    this.projectionsService.eventProjectionCodeSelect.emit({ code: e.target.code, fromMap: true });
    this.setPolygonStyle(e.target.code);

  };

  shpCoordSelected = function (projSelected) {
    this.projSelected = projSelected;
    this.setPolygonStyle(projSelected.code, true);
  };

  setPolygonStyle = function (projSelectedCode, fitBounds = false) {
    this.markerLayer.getLayers().forEach(feature => {
      if (projSelectedCode === feature.code) {
        feature.setStyle(this.featureColor.selected);
        if (fitBounds) {
          this.map.fitBounds(feature.getBounds());
        }
      } else {
        feature.setStyle(this.featureColor.unselected);
      }
    });
  };


  bboxToCoordsOnClickMap = function (e) {
    if (this.coordsBbox.length !== 1) {
      this.markerLayer.clearLayers();
      this.coordsBbox = [];
      this.coordsBbox.push(e.latlng);
    } else {
      this.markerLayer.clearLayers();
      this.coordsBbox.push(e.latlng);
      L.rectangle(this.coordsBbox).addTo(this.markerLayer);
      this.projectionsService.setCoordsFromBbox(this.coordsBbox);
    }
  };

  bboxToCoordsOnMouseMoveMap = function (e) {
    if (this.router.url === '/bbox-to-coords') {
      if (this.coordsBbox.length === 1) {
        this.markerLayer.clearLayers();
        const rectangle = L.rectangle([this.coordsBbox[0], e.latlng]);
        rectangle.addTo(this.markerLayer);
      }
    }
  };

  onClickMap(e) {
    if (this.router.url === '/point-to-coords') {
      this.projectionsService.getProjsectionsFromWGS84(e.latlng.lng, e.latlng.lat);
    }
    if (this.router.url === '/bbox-to-coords') {
      this.bboxToCoordsOnClickMap(e);
    }
  }


  geocode = function (text) {
    this.geocoderService.getCoordsByAdress(text)
      .subscribe(res => {

          this.map.panTo(res);
          if (this.map.getZoom() < 13) {
            this.map.setZoom(13);
          }
      }
      );
  };

  getLocation = function () {

    this.geocoderService.getLocation()
      .subscribe(location => {
        this.locationLayer.clearLayers();
        const coordsLocation = { lat: parseFloat(location.coords.latitude), lng: parseFloat(location.coords.longitude) };
        this.locationInit = [coordsLocation.lat, coordsLocation.lng];
        const zoom = (this.map.getZoom() < 13) ? 13 : this.map.getZoom();
        this.map.setView(coordsLocation, zoom);

        L.marker(coordsLocation, {
          icon: L.icon({
            iconUrl: './assets/location.png',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          }), clickable: false
        }).addTo(this.locationLayer);
        this.locationInit = coordsLocation;
      });
  };

  ngOnInit() {
    this.projectionsService.loadProjections();
  }



  ngAfterViewInit() {
    const that = this;
    if (this.locationInit) {
      this.map = L.map('map').setView(this.locationInit, 13);
    } else {
      this.map = L.map('map').setView([48, 5], 6);
    }

    this.markerLayer = L.featureGroup();
    this.markerLayer.addTo(this.map);
    this.locationLayer = L.featureGroup();
    this.locationLayer.addTo(this.map);



    const CLE_IGN = '7w0sxl9imubregycnsqerliz';

    // tslint:disable-next-line:max-line-length
    const url_ign_scan = `https://wxs.ign.fr/an7nvfzojv5wa96dsga5nk8w/geoportail/wmts?layer=GEOGRAPHICALGRIDSYSTEMS.MAPS&style=normal&tilematrixset=PM&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image%2Fjpeg&TILEMATRIX={z}&TILECOL={x}&TILEROW={y}`;
    // tslint:disable-next-line:max-line-length
    const url_ign_parcelaire = `https://wxs.ign.fr/an7nvfzojv5wa96dsga5nk8w/geoportail/wmts?layer=CADASTRALPARCELS.PARCELS&style=bdparcellaire&tilematrixset=PM&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image%2Fpng&TILEMATRIX={z}&TILECOL={x}&TILEROW={y}`;
    // tslint:disable-next-line:max-line-length
    const url_ign_ortho = `https://wxs.ign.fr/an7nvfzojv5wa96dsga5nk8w/geoportail/wmts?layer=ORTHOIMAGERY.ORTHOPHOTOS&style=normal&tilematrixset=PM&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image%2Fjpeg&TILEMATRIX={z}&TILECOL={x}&TILEROW={y}`;

    const base_osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    { attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors' });
    const base_mapbox = L.tileLayer('https://{s}.tiles.mapbox.com/v3/{id}/{z}/{x}/{y}.png', { id: 'fabiendelolmo.h5p49m4f' });
    const base_ign_scan = L.tileLayer(url_ign_scan, { attribution: '&copy; <a href="http://www.ign.fr/">IGN</a>' });
    const base_ign_ortho = L.tileLayer(url_ign_ortho, { attribution: '&copy; <a href="http://www.ign.fr/">IGN</a>' });
    const base_ign_parcelaire = L.tileLayer(url_ign_parcelaire, { attribution: '&copy; <a href="http://www.ign.fr/">IGN</a>' });

    base_osm.addTo(this.map);

    const baseMaps = {
      'OSM': base_osm,
      'Mapbox OSM': base_mapbox,
      'Scan IGN': base_ign_scan,
      'Ortho IGN': base_ign_ortho,
      'Parcelaire IGN': base_ign_parcelaire
    };

    L.control.layers(baseMaps).addTo(this.map);

    this.map.on('click', this.onClickMap, this);
    this.map.on('mousemove', this.bboxToCoordsOnMouseMoveMap, this);

    this.projectionsService.eventProjsectionsToWGS84.subscribe((projs) => {
      if (this.router.url === '/coords-to-points') {
        this.drawMarkerFromCoords(projs.result);
      }
    });

    this.getLocation();
    this.projectionsService.eventProjsectionsFromWGS84.subscribe((data) => {
      const latlng = data.coordsClick;
      this.markerLayer.clearLayers();
      if (latlng.lat && latlng.lng) {
        const extraMarkers = L.ExtraMarkers.icon({
          icon: 'fa-number',
          iconColor: 'black',
          markerColor: 'white',
          shape: 'circle',
          prefix: 'fa',
          number: '?'
        });
        const marker = L.marker(latlng, { icon: extraMarkers });
        marker.addTo(this.markerLayer);
      }
    });


    /*Une nouvelle projection est selectionné  */
    this.projectionsService.eventProjectionCodeSelect.subscribe((data) => {
      if (this.router.url === '/coords-to-points') {
        if (!data.fromMap) { // provient des données, on centre la map sur le marker
          const markers = this.markerLayer.getLayers()[0].getLayers();
          for (let i = 0; i < markers.length; i++) {
            if (markers[i].code === data.code) {
              this.map.panTo(markers[i].getLatLng());
              return;
            }
          }
        } else if (data.fromMap) {

        }
      }

      if (this.router.url === '/shp-to-bbox') {
        // Nouvelle projection! On zoom dessus!'
        this.setPolygonStyle(data.code, !data.fromMap);
      }

    });

    // SHP les données ont changées
    this.projectionsService.eventNewShp.subscribe((data) => {
      this.markerLayer.clearLayers();
      for (let i = 0; i < data.length; i++) {
        const polygon = L.polygon(data[i].bbox);
        polygon.code = data[i].code;
        polygon.on('click', this.onClickPolygon, this);
        polygon.setStyle(this.featureColor.unselected);
        polygon.addTo(this.markerLayer);
      }
    });

    // New bbox
    this.projectionsService.eventNewBbox.subscribe((data) => {
      this.markerLayer.clearLayers();
      if (this.projectionsService.initCoords.bboxToCoords.length === 2) {
        L.rectangle(this.projectionsService.initCoords.bboxToCoords).addTo(this.markerLayer);
      }

    });
  }

  filterBoboxChange(e) {
    this.projectionsService.eventFilterTextChange.emit(this.projectionsService.filterText);
  }

  ngOnDestroy() {
    // prevent memory leak when component is destroyed

  }
}
