import { Injectable } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import proj4 from 'proj4';

@Injectable({
  providedIn: 'root'
})
export class ShpParserService {

  constructor() { }

  parseShpFile(file: File): Observable<ShpParseResult> {
    console.log('🔄 Starting SHP file parsing for:', file.name, '(' + file.size + ' bytes)');
    
    return from(this.readFileAsArrayBuffer(file)).pipe(
      map((arrayBuffer: ArrayBuffer) => {
        console.log('✅ File read, extracting bounding box...');
        
        const bbox = this.extractBoundingBoxFromShp(arrayBuffer);
        console.log('📦 Bounding box extracted:', bbox);
        
        const result = this.createShpParseResult(bbox, file.name);
        console.log('✅ SHP parsing completed');
        
        return result;
      }),
      catchError((error) => {
        console.error('❌ Error parsing SHP file:', error.message);
        return of({
          filename: file.name,
          boundingBoxes: [],
          error: `Error parsing SHP file: ${error.message}`
        });
      })
    );
  }

  private readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        if (event.target?.result) {
          resolve(event.target.result as ArrayBuffer);
        } else {
          reject(new Error('Failed to read file: no result'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Error reading file: ' + reader.error?.message));
      };
      
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Extract bounding box from SHP file header (first 100 bytes)
   * SHP header has mixed endianness:
   * - Bytes 0-28: Big Endian
   * - Bytes 32-100: Little Endian
   * 
   * Bounding box coordinates (Little Endian doubles):
   * - Byte 36: Xmin
   * - Byte 44: Ymin  
   * - Byte 52: Xmax
   * - Byte 60: Ymax
   */
  private extractBoundingBoxFromShp(arrayBuffer: ArrayBuffer): [number, number, number, number] | null {
    if (arrayBuffer.byteLength < 100) {
      throw new Error(`Invalid SHP file: header too short (${arrayBuffer.byteLength} bytes, need at least 100)`);
    }

    const dataView = new DataView(arrayBuffer);
    
    // Verify it's a valid SHP file by checking the file code (should be 9994 in big endian)
    const fileCode = dataView.getInt32(0, false); // Big endian
    if (fileCode !== 9994) {
      throw new Error(`Invalid SHP file: incorrect file code (${fileCode}, expected 9994)`);
    }

    // Extract bounding box coordinates (Little Endian doubles)
    const xmin = dataView.getFloat64(36, true); // Little endian
    const ymin = dataView.getFloat64(44, true);
    const xmax = dataView.getFloat64(52, true);
    const ymax = dataView.getFloat64(60, true);

    // Basic validation
    if (xmin > xmax || ymin > ymax) {
      throw new Error(`Invalid bounding box coordinates: [${xmin}, ${ymin}, ${xmax}, ${ymax}]`);
    }

    return [xmin, ymin, xmax, ymax];
  }

  private createShpParseResult(bbox: [number, number, number, number] | null, filename: string): ShpParseResult {
    const boundingBoxes: ShpBoundingBox[] = [];

    if (bbox) {
      const centroid = this.calculateCentroid(bbox);
      const id = this.generateId();
      
      const boundingBox: ShpBoundingBox = {
        id: id,
        filename: filename,
        bbox: bbox,
        centroid: centroid,
        matchingProjections: []
      };

      boundingBoxes.push(boundingBox);
    }

    return {
      filename: filename,
      boundingBoxes: boundingBoxes
    };
  }

  private calculateCentroid(bbox: [number, number, number, number]): [number, number] {
    const [minX, minY, maxX, maxY] = bbox;
    return [
      (minX + maxX) / 2,
      (minY + maxY) / 2
    ];
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Check if a centroid is within a projection's bounding box
   */
  isPointInProjectionBbox(centroid: [number, number], projection: any): boolean {
    if (!projection.wgs84bounds || projection.wgs84bounds.length !== 4) {
      return false;
    }

    const [lng, lat] = centroid;
    const [minX, minY, maxX, maxY] = projection.wgs84bounds;

    return lng >= minX && lng <= maxX && lat >= minY && lat <= maxY;
  }

  /**
   * Check if a point is within a WGS84 bounding box
   */
  isPointInWGS84Bbox(point: [number, number], wgs84Bbox: [number, number, number, number]): boolean {
    const [lng, lat] = point;
    const [minX, minY, maxX, maxY] = wgs84Bbox;

    return lng >= minX && lng <= maxX && lat >= minY && lat <= maxY;
  }

  /**
   * Calculate bounding box from a polygon
   */
  private calculatePolygonBbox(polygon: number[][]): [number, number, number, number] {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    for (const point of polygon) {
      if (point[0] < minX) minX = point[0];
      if (point[0] > maxX) maxX = point[0];
      if (point[1] < minY) minY = point[1];
      if (point[1] > maxY) maxY = point[1];
    }
    
    return [minX, minY, maxX, maxY];
  }

  /**
   * Find matching projections for a given SHP bounding box
   */
  findMatchingProjections(shpBbox: ShpBoundingBox, projections: any[], filterByBbox: boolean = true): any[] {
    // Si le filtre par bbox est désactivé, on prend toutes les projections
    // Sinon, on filtre par le centroïde SHP reprojeté vers WGS84 comparé aux wgs84bounds
    let matchingProjections: any[];
    
    if (filterByBbox) {
      matchingProjections = projections.filter(projection => {
        // Reprojecter le centroïde SHP vers WGS84 en utilisant cette projection
        const reprojectedCentroid = this.reprojectPointToWGS84(shpBbox.centroid, projection);
        if (!reprojectedCentroid) return false;
        
        // Vérifier si le centroïde reprojeté est dans les wgs84bounds de la projection
        return this.isPointInProjectionBbox(reprojectedCentroid, projection);
      });
    } else {
      matchingProjections = projections;
    }

    // Pour chaque projection correspondante, reprojecter la bbox SHP vers WGS84
    const projectionsWithPolygons = matchingProjections.map(projection => {
      const reprojectedPolygon = this.reprojectShpBboxToWGS84(shpBbox, projection);
      
      return {
        ...projection,
        reprojectedPolygon: reprojectedPolygon,
        // Calculer un point représentatif pour l'affichage (centre du polygon)
        lng: reprojectedPolygon ? this.calculatePolygonCenter(reprojectedPolygon)[0] : undefined,
        lat: reprojectedPolygon ? this.calculatePolygonCenter(reprojectedPolygon)[1] : undefined
      };
    });

    return projectionsWithPolygons;
  }

  /**
   * Reprojecter les 4 points de la bounding box SHP vers WGS84 en utilisant la projection donnée
   */
  private reprojectShpBboxToWGS84(shpBbox: ShpBoundingBox, projection: any): number[][] | null {
    if (!projection.proj4) {
      return null;
    }

    try {
      const [minX, minY, maxX, maxY] = shpBbox.bbox;
      const wgs84Proj = '+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs';
      
      // Créer les 4 coins de la bounding box SHP et les reprojecter vers WGS84
      // On assume que les coordonnées SHP sont dans le système de projection donné
      const topLeft = proj4(projection.proj4, wgs84Proj, [minX, maxY]);
      const topRight = proj4(projection.proj4, wgs84Proj, [maxX, maxY]);
      const bottomRight = proj4(projection.proj4, wgs84Proj, [maxX, minY]);
      const bottomLeft = proj4(projection.proj4, wgs84Proj, [minX, minY]);
      
      const polygon = [
        topLeft,
        topRight,
        bottomRight,
        bottomLeft,
        topLeft // Fermer le polygon
      ];

      return polygon;
    } catch (error) {
      console.warn('Erreur lors de la reprojection SHP bbox pour', projection.code, ':', error);
      return null;
    }
  }

  /**
   * Calculer le centre d'un polygon
   */
  private calculatePolygonCenter(polygon: number[][]): [number, number] {
    let sumX = 0;
    let sumY = 0;
    const validPoints = polygon.slice(0, -1); // Exclure le dernier point (doublé)
    
    for (const point of validPoints) {
      sumX += point[0];
      sumY += point[1];
    }
    
    return [sumX / validPoints.length, sumY / validPoints.length];
  }

  /**
   * Reprojecter un point vers WGS84 en utilisant la projection donnée
   */
  private reprojectPointToWGS84(point: [number, number], projection: any): [number, number] | null {
    if (!projection.proj4) {
      return null;
    }

    try {
      const wgs84Proj = '+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs';
      
      // Reprojecter le point depuis la projection vers WGS84
      const reprojectedPoint = proj4(projection.proj4, wgs84Proj, point);
      
      return [reprojectedPoint[0], reprojectedPoint[1]];
    } catch (error) {
      console.warn('Erreur lors de la reprojection du point pour', projection.code, ':', error);
      return null;
    }
  }
}