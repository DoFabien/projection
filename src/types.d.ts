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
  }
  