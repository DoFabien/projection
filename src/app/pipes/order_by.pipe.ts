import {Pipe, PipeTransform} from '@angular/core'

@Pipe({name: 'orderBy', standalone: true,})

export class OrderBy implements PipeTransform {
    transform(array: any[], field: string): any[] {
        if (!array) return [];
        if (!field) return array;
        
        let desc = false;
        let key = field;
        if (field.startsWith('-')) {
          desc = true;
          key = field.substring(1);
        }
        
        // Return a sorted copy of the array
        return [...array].sort((a, b) => {
          const valA = a[key];
          const valB = b[key];
          if (typeof valA === 'string' && typeof valB === 'string') {
            const res = valA.localeCompare(valB);
            return desc ? -res : res;
          } else {
            return desc ? valB - valA : valA - valB;
          }
        });
    }
}
