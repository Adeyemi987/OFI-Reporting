import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, throwError } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';

export interface GeoLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
}

@Injectable({ providedIn: 'root' })
export class GeolocationService {
  private readonly http = inject(HttpClient);

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
                message = 'Location permission denied. Please enable location access.';
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

  reverseGeocode(latitude: number, longitude: number): Observable<string> {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`;

    return this.http.get<any>(url, {
      headers: { 'Accept-Language': 'en' }
    }).pipe(
      map(res => this.formatPlaceName(res)),
      catchError(() =>
        throwError(() => new Error('Could not resolve location name. Check your network connection.'))
      )
    );
  }

  resolveLocationName(): Observable<string> {
    return this.getCurrentPosition().pipe(
      switchMap(pos => this.reverseGeocode(pos.latitude, pos.longitude))
    );
  }

  checkPermission(): Promise<PermissionState> {
    if (!navigator.permissions) {
      return Promise.resolve('prompt' as PermissionState);
    }
    return navigator.permissions.query({ name: 'geolocation' as PermissionName })
      .then(result => result.state);
  }

  private formatPlaceName(data: any): string {
    const addr = data?.address;
    if (!addr) {
      return data?.display_name ?? 'Unknown location';
    }

    const locality = addr.city || addr.town || addr.village || addr.suburb || addr.county;
    const region = addr.state || addr.region;
    const parts = [locality, region].filter(Boolean);

    return parts.length > 0 ? parts.join(', ') : (data.display_name ?? 'Unknown location');
  }
}
