declare module "*.json" {
    const value: any;
    export default value;
}

interface Projection {
    code: string | undefined;
    url?: any;
    region?: string;
    name?: string;
    lat?: number;
    lng?: number;
    coords: [[number, number], [number, number]];
    wgs84bounds?: [number, number, number, number];
    proj4?: string;
    reprojectedPolygon?: number[][];
  }

  interface ShpBoundingBox {
    id: string;
    filename: string;
    bbox: [number, number, number, number]; // [minX, minY, maxX, maxY] en coordonnées originales
    centroid: [number, number];
    wgs84Bbox?: [number, number, number, number]; // [minX, minY, maxX, maxY] en WGS84
    matchingProjections: Projection[];
  }
  
  interface ShpParseResult {
    filename: string;
    boundingBoxes: ShpBoundingBox[];
    error?: string;
  }
  