import {Pipe, PipeTransform} from '@angular/core'

@Pipe({name: 'orderBy', standalone: true,})

export class OrderBy implements PipeTransform {
    transform(_array: any[], field: string): any[] {

        // clone array
        const array = [..._array];

        if (!array) return [];
        if (!field) return array;

        let orderType: string = 'ASC';
        let orderField  = field;

        if (field){
              if (field[0] === '-') {
                orderField = field.substring(1);
                orderType = 'DESC';
            }

                     array.sort(function(a :any, b: any) {
                if (orderType === 'ASC') {
                    if (a[orderField] < b[orderField]) return -1;
                    if (a[orderField] > b[orderField]) return 1;
                    return 0;
                } else {
                    if (a[orderField] < b[orderField]) return 1;
                    if (a[orderField] > b[orderField]) return -1;
                    return 0;
                }
            });

        }

        return array;
    }
}
