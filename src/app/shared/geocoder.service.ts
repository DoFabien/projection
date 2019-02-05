import {Http} from '@angular/http';
import 'rxjs/add/operator/map';
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import 'rxjs/add/operator/map';

@Injectable()
export class GeocoderService {
    constructor(private _http: Http) {

    }

    getCoordsByAdress(text: string) {
        return this._http.get(`https://api-adresse.data.gouv.fr/search/?q=${text}&limit=1`)
            .map(res => {
                return res.json().features[0].geometry.coordinates.reverse();
            });
    }

    getCurrentLocation() {
        navigator.geolocation.getCurrentPosition(position =>  position );

    }

     getLocation(): Observable<any> {

        return Observable.create(observer => {

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
