import { Component, signal, model, effect, input, OnInit, computed } from '@angular/core';
import { ProjectionsService } from '../../services/projections.service';
import { ShpParserService } from '../../services/shp-parser.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { OrderBy } from '../../pipes/order_by.pipe';
import { FilterPipe } from '../../pipes/filter.pipe';
import { RoundCoords } from '../../pipes/round_coords.pipe';
import { MapService } from '../../services/map.service';
import { GeoJSONSource } from 'maplibre-gl';
import { BaseProjectionComponent } from '../base-projection.component';

@Component({
  selector: 'app-shp-to-map',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule, MatFormFieldModule,
    MatInputModule, MatCardModule, OrderBy, MatIconModule,
    MatButtonModule, MatProgressSpinnerModule, FilterPipe, RoundCoords
  ],
  templateUrl: './shp-to-map.component.html',
  styleUrls: ['./shp-to-map.component.scss']
})
export class ShpToMapComponent extends BaseProjectionComponent implements OnInit {
  filterByBbox = input<boolean>(true);
  internalFilterByBbox = signal<boolean>(true);
  
  shpBoundingBoxes = signal<ShpBoundingBox[]>([]);
  selectedShpBbox = signal<ShpBoundingBox | undefined>(undefined);
  isLoading = signal<boolean>(false);
  isFilteringInProgress = signal<boolean>(false);
  errorMessage = signal<string>('');
  isDragOver = signal<boolean>(false);

  // Computed property for all projections from matching bounding boxes
  allMatchingProjections = computed(() => {
    const allProjections: Projection[] = [];
    for (const bbox of this.shpBoundingBoxes()) {
      allProjections.push(...bbox.matchingProjections);
    }
    return allProjections;
  });

  constructor(
    projectionsService: ProjectionsService,
    mapService: MapService,
    private shpParserService: ShpParserService
  ) {
    super(projectionsService, mapService);

    // Simple sync input with internal signal
    effect(() => {
      const newValue = this.filterByBbox();
      const oldValue = this.internalFilterByBbox();
      
      if (newValue !== oldValue) {
        this.internalFilterByBbox.set(newValue);
        
        // If we have SHP files, recalculate projections when parent changes filter
        if (this.shpBoundingBoxes().length > 0) {
          this.isFilteringInProgress.set(true);
          
          setTimeout(() => {
            try {
              this.updateMatchingProjections();
              if (this.mapService.mapReady()) {
                this.updateMapFeatures();
              }
            } finally {
              this.isFilteringInProgress.set(false);
            }
          }, 50);
        }
      }
    });

    // Effect to automatically show all matching projections
    effect(() => {
      const allProjections = this.allMatchingProjections();
      if (allProjections.length > 0) {
        this.resultProjections.set(allProjections);
      }
    });

    // Effect to update map features when map becomes ready and we have data
    effect(() => {
      if (this.mapService.mapReady() && this.shpBoundingBoxes().length > 0) {
        this.updateMapFeatures();
      }
    });

  }

  override ngOnInit() {
    super.ngOnInit();
    // Note: Pas de chargement d'état - on veut toujours demander un nouveau SHP
  }

  protected override initializeMap(): void {
    this.mapService.map.on('click', this.mapClickHandler);
    this.mapService.map.on('mouseenter', 'reprojectedBboxes-fill', this.onPolygonMouseEnter);
    this.mapService.map.on('mouseleave', 'reprojectedBboxes-fill', this.onPolygonMouseLeave);

    // Cleanup on destroy
    this.destroyRef.onDestroy(() => {
      this.mapService.map.off('click', this.mapClickHandler);
      this.mapService.map.off('mouseenter', 'reprojectedBboxes-fill', this.onPolygonMouseEnter);
      this.mapService.map.off('mouseleave', 'reprojectedBboxes-fill', this.onPolygonMouseLeave);
      this.clearMapFeatures();
    });
  }

  protected override getStorageKey(): string {
    return 'shp-to-map-state';
  }

  protected override getComponentData(): any {
    return {}; // Pas de sauvegarde
  }

  protected override loadComponentData(data: any): void {
    // Pas de chargement d'état - on veut toujours un nouveau SHP
  }

  trackByCode(index: number, projection: Projection): string | undefined {
    return projection.code;
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFiles(Array.from(files));
    }
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFiles(Array.from(input.files));
    }
  }

  private handleFiles(files: File[]): void {
    console.log('🎯 handleFiles called with:', files.length, 'files');
    console.log('📁 Files:', files.map(f => ({ name: f.name, size: f.size, type: f.type })));
    
    const shpFiles = files.filter(file => file.name.toLowerCase().endsWith('.shp'));
    console.log('🗂️ Filtered SHP files:', shpFiles.length);
    console.log('📋 SHP files:', shpFiles.map(f => f.name));
    
    if (shpFiles.length === 0) {
      console.log('❌ No SHP files found');
      this.errorMessage.set('Please select SHP files (.shp extension)');
      return;
    }

    console.log('🔄 Setting loading state to true');
    this.isLoading.set(true);
    this.errorMessage.set('');

    // Process each SHP file
    console.log('🔄 Starting to process', shpFiles.length, 'SHP files');
    shpFiles.forEach((file, index) => {
      console.log(`🔄 Processing file ${index + 1}/${shpFiles.length}:`, file.name);
      
      this.shpParserService.parseShpFile(file).subscribe({
        next: (result: ShpParseResult) => {
          console.log(`✅ File ${index + 1} processed successfully:`, result);
          
          if (result.error) {
            console.log('❌ Result contains error:', result.error);
            this.errorMessage.set(result.error);
          } else {
            console.log('✅ Result is valid, updating state...');
            console.log('📦 Current bboxes:', this.shpBoundingBoxes().length);
            
            const currentBboxes = this.shpBoundingBoxes();
            const newBboxes = [...currentBboxes, ...result.boundingBoxes];
            console.log('📦 New bboxes count:', newBboxes.length);
            
            this.shpBoundingBoxes.set(newBboxes);
            console.log('✅ BoundingBoxes updated');
            
            console.log('🔄 Updating matching projections...');
            this.updateMatchingProjections();
            console.log('✅ Matching projections updated');
            
            console.log('🗺️ Updating map features...');
            this.updateMapFeatures();
            console.log('✅ Map features updated');
            
            // Note: Pas de sauvegarde automatique
          }
          
          console.log('🔄 Setting loading state to false');
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error(`❌ Error processing file ${index + 1} (${file.name}):`, error);
          this.errorMessage.set(`Error processing ${file.name}: ${error.message}`);
          this.isLoading.set(false);
        }
      });
    });
  }

  private updateMatchingProjections(): void {
    console.log('🔄 updateMatchingProjections: Starting...');
    
    const filteredProjections = this.projectionsService.getFilterProjection(this.searchTerm());
    console.log('📋 Filtered projections count:', filteredProjections.length);
    console.log('🔍 Filter by bbox enabled:', this.internalFilterByBbox());
    
    const updatedBboxes = this.shpBoundingBoxes().map((bbox) => {
      const matchingProjections = this.shpParserService.findMatchingProjections(
        bbox, 
        filteredProjections,
        this.internalFilterByBbox()
      );
      console.log(`✅ Found ${matchingProjections.length} matching projections for ${bbox.filename} (filter by bbox: ${this.internalFilterByBbox()})`);
      
      return {
        ...bbox,
        matchingProjections: matchingProjections
      };
    });
    
    this.shpBoundingBoxes.set(updatedBboxes);
    console.log('✅ updateMatchingProjections: Completed');
  }


  private updateMapFeatures(): void {
    // Don't update map features if map is not ready
    if (!this.mapService.mapReady() || !this.mapService.map) {
      return;
    }

    // Clear existing features
    this.clearMapFeatures();

    const reprojectedBboxFeatures: GeoJSON.Feature[] = [];

    for (const bbox of this.shpBoundingBoxes()) {
      // Add polygon features for matching projections (SHP bbox reprojected)
      for (const projection of bbox.matchingProjections) {
        if (projection.reprojectedPolygon) {
          reprojectedBboxFeatures.push({
            type: 'Feature',
            properties: { 
              code: projection.code, 
              name: projection.name, 
              region: projection.region,
              shpBboxId: bbox.id,
              filename: bbox.filename,
              type: 'reprojected-shp-bbox'
            },
            geometry: { 
              type: 'Polygon', 
              coordinates: [projection.reprojectedPolygon]
            }
          });
        }
      }
    }

    this.drawReprojectedBboxFeatures(reprojectedBboxFeatures);
  }

  private drawReprojectedBboxFeatures(features: GeoJSON.Feature[]): void {
    if (!this.mapService.map || !this.mapService.mapReady()) return;
    
    const geojson: GeoJSON.GeoJSON = {
      type: 'FeatureCollection',
      features: features
    };

    // Add or update reprojected bbox source
    if (this.mapService.map.getSource('reprojectedBboxes')) {
      (this.mapService.map.getSource('reprojectedBboxes') as GeoJSONSource).setData(geojson);
    } else {
      this.mapService.map.addSource('reprojectedBboxes', {
        type: 'geojson',
        data: geojson
      });

      // Add polygon layer for reprojected SHP bounding boxes
      this.mapService.map.addLayer({
        id: 'reprojectedBboxes-fill',
        type: 'fill',
        source: 'reprojectedBboxes',
        paint: {
          'fill-color': '#ff6b35',
          'fill-opacity': 0.1
        }
      });

      this.mapService.map.addLayer({
        id: 'reprojectedBboxes-line',
        type: 'line',
        source: 'reprojectedBboxes',
        paint: {
          'line-color': '#ff6b35',
          'line-width': 2,
          'line-dasharray': [3, 3]
        }
      });
    }
  }

  private clearMapFeatures(): void {
    if (!this.mapService.map || !this.mapService.mapReady()) return;

    // Clear reprojected bbox polygons
    if (this.mapService.map.getSource('reprojectedBboxes')) {
      (this.mapService.map.getSource('reprojectedBboxes') as GeoJSONSource).setData({
        type: 'FeatureCollection',
        features: []
      });
    }
  }

  private mapClickHandler = (e: any) => {
    // Check for reprojected bbox polygon clicks
    const reprojectedBboxFeatures = this.mapService.map.queryRenderedFeatures(e.point, {
      layers: ['reprojectedBboxes-fill', 'reprojectedBboxes-line']
    });

    if (reprojectedBboxFeatures.length > 0) {
      const feature = reprojectedBboxFeatures[0];
      this.selectProjectionFromMapPolygon(feature);
      return;
    }
  };

  selectShpBboxFromMap(feature: any): void {
    const bboxId = feature.properties?.['id'];
    if (bboxId) {
      const bbox = this.shpBoundingBoxes().find(b => b.id === bboxId);
      this.selectedShpBbox.set(bbox);
      this.resultProjections.set(bbox?.matchingProjections || []);
    }
  }

  selectProjectionFromMapPolygon(feature: any): void {
    const code = feature.properties?.['code'];
    
    if (code) {
      const projection = this.allMatchingProjections().find(p => p.code === code);
      this.selectedProjection.set(projection);
      
      // Scroll to the selected projection in the list
      setTimeout(() => {
        const element = document.querySelector(`tr[data-projection-code="${code}"]`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  }

  selectProjectionFromMap(feature: any): void {
    const code = feature.properties?.['code'];
    const shpBboxId = feature.properties?.['shpBboxId'];
    
    if (code) {
      const projection = this.allMatchingProjections().find(p => p.code === code);
      this.selectedProjection.set(projection);
      
      // Also select the corresponding SHP bbox
      if (shpBboxId) {
        const bbox = this.shpBoundingBoxes().find(b => b.id === shpBboxId);
        this.selectedShpBbox.set(bbox);
      }
    }
  }

  selectShpBboxFromList(bbox: ShpBoundingBox): void {
    this.selectedShpBbox.set(bbox);
    this.resultProjections.set(bbox.matchingProjections);
    
    // Center map on bbox
    const [minX, minY, maxX, maxY] = bbox.bbox;
    this.mapService.map.fitBounds([
      [minX, minY],
      [maxX, maxY]
    ], { padding: 50 });
  }

  selectProjectionFromList(projection: Projection): void {
    this.selectedProjection.set(projection);
    if (projection.lng && projection.lat) {
      this.mapService.map.flyTo({
        center: [projection.lng, projection.lat],
        zoom: 15
      });
    }
  }

  clearAll(): void {
    this.shpBoundingBoxes.set([]);
    this.selectedShpBbox.set(undefined);
    this.selectedProjection.set(undefined);
    this.resultProjections.set([]);
    this.clearMapFeatures();
  }

  resetToUpload(): void {
    console.log('🔄 Resetting to upload state...');
    
    // Clear all data
    this.clearAll();
    
    // Reset states
    this.isLoading.set(false);
    this.isFilteringInProgress.set(false);
    this.errorMessage.set('');
    this.isDragOver.set(false);
    
    // Reset filter to default
    this.internalFilterByBbox.set(true);
    
    console.log('✅ Reset completed');
  }

  private onPolygonMouseEnter = () => {
    this.mapService.map.getCanvas().style.cursor = 'pointer';
  };

  private onPolygonMouseLeave = () => {
    this.mapService.map.getCanvas().style.cursor = '';
  };


  removeShpBbox(bbox: ShpBoundingBox): void {
    const updatedBboxes = this.shpBoundingBoxes().filter(b => b.id !== bbox.id);
    this.shpBoundingBoxes.set(updatedBboxes);
    
    if (this.selectedShpBbox() === bbox) {
      this.selectedShpBbox.set(undefined);
      this.resultProjections.set([]);
    }
    
    this.updateMapFeatures();
  }

}