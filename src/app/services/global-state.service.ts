import { Injectable, signal, effect } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GlobalStateService {
  // Global signals
  searchTerm = signal<string>('');
  filterByBbox = signal<boolean>(true);
  orderByField = signal<string>('');
  featurePointToCoordsInput = signal<[number, number] | undefined>(undefined);

  constructor() {
    // Load state from localStorage on init
    this.loadState();

    // Save state whenever it changes
    effect(() => {
      this.saveState();
    });
  }

  private loadState() {
    try {
      const savedState = localStorage.getItem('global-state');
      if (savedState) {
        const state = JSON.parse(savedState);
        if (state.searchTerm) this.searchTerm.set(state.searchTerm);
        if (state.filterByBbox !== undefined) this.filterByBbox.set(state.filterByBbox);
        if (state.orderByField) this.orderByField.set(state.orderByField);
        if (state.featurePointToCoordsInput) this.featurePointToCoordsInput.set(state.featurePointToCoordsInput);
      }
    } catch (error) {
      console.error('Error loading global state:', error);
    }
  }

  private saveState() {
    try {
      const state = {
        searchTerm: this.searchTerm(),
        filterByBbox: this.filterByBbox(),
        orderByField: this.orderByField(),
        featurePointToCoordsInput: this.featurePointToCoordsInput()
      };
      localStorage.setItem('global-state', JSON.stringify(state));
    } catch (error) {
      console.error('Error saving global state:', error);
    }
  }

  setOrderBy(field: string) {
    this.orderByField.set(!this.orderByField() ? field : 
      this.orderByField() === field ? `-${field}` : 
      this.orderByField() === `-${field}` ? '' : field
    );
  }
}