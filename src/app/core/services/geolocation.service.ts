import { Injectable } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';

export interface GeoLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
}

@Injectable({ providedIn: 'root' })
export class GeolocationService {
  getCurrentPosition(): Observable<GeoLocation> {
    if (!navigator.geolocation) {
      return throwError(() => new Error('Geolocation is not supported by this browser.'));
    }

    return from(
      new Promise<GeoLocation>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy
            });
          },
          (error) => {
            let message = 'Unable to retrieve location.';
            switch (error.code) {
              case error.PERMISSION_DENIED:
                message = 'Location permission denied. Please enable location access to submit geotagged evidence.';
                break;
              case error.POSITION_UNAVAILABLE:
                message = 'Location information is unavailable.';
                break;
              case error.TIMEOUT:
                message = 'Location request timed out.';
                break;
            }
            reject(new Error(message));
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          }
        );
      })
    );
  }

  checkPermission(): Promise<PermissionState> {
    if (!navigator.permissions) {
      return Promise.resolve('prompt' as PermissionState);
    }
    return navigator.permissions.query({ name: 'geolocation' as PermissionName })
      .then(result => result.state);
  }
}
