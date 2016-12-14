import {Pipe, PipeTransform} from '@angular/core';

@Pipe({ name: 'myRoundCoords' })

export class RoundCoords implements PipeTransform {
    transform(value: number, args: string[]) {
        if (value) {
            if (Math.abs(value ) < 360) {
                return Math.round(value * 10e5) / 10e5;
            } else {
               return Math.round(value * 10e1) / 10e1 ;
            }

        }


    }
}
