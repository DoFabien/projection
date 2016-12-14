import {Pipe, PipeTransform} from '@angular/core';

@Pipe({name: 'filter'})

export class FilterPipe implements PipeTransform {
    transform(obj: any, filterText: string) {


        if (filterText) {
            let res = [];
            let patt = new RegExp(filterText);
            obj.forEach(element => {
               if (patt.test(element.code) || patt.test(element.nom)){

                   obj.hidden = 0;
                   res.push(element);
               } else {
                   obj.hidden = 1;
               }
            });
            return res;
        }else {
            return obj;
        }

    }
}
