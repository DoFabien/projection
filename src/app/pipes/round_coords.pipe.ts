import {Pipe, PipeTransform} from '@angular/core';

@Pipe({ 
    name: 'myRoundCoords',
    standalone: true,
 })

export class RoundCoords implements PipeTransform {
    transform(value: number): number {
        if (value === null || value === undefined) return value;
        let factor: number;
        if (Math.abs(value) < 360) {
          factor = 1e5; // round to 5 decimals
        } else {
          factor = 10;   // round to 1 decimal
        }
        let result = Math.round(value * factor) / factor;
        // Handle edge case: if result is very close to 360 (or -360), force it
        if (Math.abs(Math.abs(result) - 360) < 1e-5) {
          result = value < 0 ? -360 : 360;
        }
        return result;
    }
}
