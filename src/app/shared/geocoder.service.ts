import {Injectable} from '@angular/core';
import {Observable, Observer, map, of} from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
    providedIn: 'root',
  })
export class GeocoderService {
    constructor(private _http: HttpClient) {

    }

    getCoordsByAdress(text: string) {
        return this._http.get(`https://api-adresse.data.gouv.fr/search/?q=${text}&limit=1`)
            .pipe(
                map((res: any) => {
                    return res.features[0].geometry.coordinates.reverse();
                }
            )
            )
  
    }

    getCurrentLocation() {
        navigator.geolocation.getCurrentPosition(position =>  position );

    }

     getLocation(): Observable<any> {

        return new Observable((observer: Observer<any>) => {

            if (window.navigator && window.navigator.geolocation) {
                window.navigator.geolocation.getCurrentPosition(
                    (position) => {
                        observer.next(position);
                        observer.complete();
                    },
                    (error) => {

                        // switch (error.code) {
                        //     case 1:
                        //         observer.error(GEOLOCATION_ERRORS['errors.location.permissionDenied']);
                        //         break;
                        //     case 2:
                        //         observer.error(GEOLOCATION_ERRORS['errors.location.positionUnavailable']);
                        //         break;
                        //     case 3:
                        //         observer.error(GEOLOCATION_ERRORS['errors.location.timeout']);
                        //         break;
                        // }
                    });
            } else {

                // observer.error(GEOLOCATION_ERRORS['errors.location.unsupportedBrowser']);
            }

        });



    }

}
