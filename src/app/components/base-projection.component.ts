import { signal, effect, DestroyRef, inject, OnInit, Directive, input, output } from '@angular/core';
import { ProjectionsService } from '../services/projections.service';
import { MapService } from '../services/map.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Directive()
export abstract class BaseProjectionComponent implements OnInit {
  protected destroyRef = inject(DestroyRef);
  
  orderByField = input<string>('');
  searchTerm = input<string>('');
  orderBy = output<string>();
  resultProjections = signal<Projection[]>([]);
  selectedProjection = signal<Projection | undefined>(undefined);

  protected constructor(
    protected projectionsService: ProjectionsService,
    protected mapService: MapService
  ) {
    // Map initialization effect
    effect(() => {
      if (this.mapService.mapReady()) {
        this.initializeMap();
      }
    });

    // Save inputs to localStorage whenever they change
    effect(() => {
      this.saveToLocalStorage();
    });
  }

  ngOnInit() {
    // Delay localStorage loading until after child component initialization
    setTimeout(() => this.loadFromLocalStorage(), 0);
  }

  protected abstract initializeMap(): void;
  protected abstract getStorageKey(): string;

  setOrderBy(field: string) {
    this.orderBy.emit(field);
  }

  protected loadFromLocalStorage() {
    try {
      const key = this.getStorageKey();
      const saved = localStorage.getItem(key);
      if (saved) {
        const data = JSON.parse(saved);
        this.loadComponentData(data);
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
    }
  }

  protected saveToLocalStorage() {
    try {
      const key = this.getStorageKey();
      const baseData = { 
      };
      const componentData = this.getComponentData();
      localStorage.setItem(key, JSON.stringify({ ...baseData, ...componentData }));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }

  // Override these methods in components to handle component-specific data
  protected loadComponentData(data: any) {}
  protected getComponentData(): any {
    return {};
  }
}