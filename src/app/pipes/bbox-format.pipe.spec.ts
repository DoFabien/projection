import { BboxFormatPipe } from './bbox-format.pipe';

describe('BboxFormatPipe', () => {
  let pipe: BboxFormatPipe;
  
  // Données de test
  const testCoords: [[number, number], [number, number]] = [
    [2.3, 48.8],  // x_min, y_min
    [2.4, 48.9]   // x_max, y_max
  ];

  beforeEach(() => {
    pipe = new BboxFormatPipe();
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return empty string for undefined coords', () => {
    expect(pipe.transform(undefined, 'wkt')).toBe('');
  });

  it('should return empty string for unknown format', () => {
    expect(pipe.transform(testCoords, 'unknown')).toBe('');
  });

  it('should format as WKT', () => {
    const expected = 'POLYGON(2.3 48.8,2.3 48.9,2.4 48.9,2.4 48.8,2.3 48.8)';
    expect(pipe.transform(testCoords, 'wkt')).toBe(expected);
  });

  it('should format as GeoJSON', () => {
    const expected = '{"type": "Polygon","coordinates": [[2.3, 48.8], [2.3, 48.9], [2.4, 48.9],[2.4, 48.8],[2.3, 48.8]]}';
    expect(pipe.transform(testCoords, 'geojson')).toBe(expected);
    
    // Vérifier que le résultat est un JSON valide
    expect(() => JSON.parse(pipe.transform(testCoords, 'geojson'))).not.toThrow();
  });

  it('should format as xyMinMax', () => {
    const expected = '2.3 48.8, 2.4 48.9';
    expect(pipe.transform(testCoords, 'xyMinMax')).toBe(expected);
  });

  it('should format as yxMinMax', () => {
    const expected = '48.8 2.3, 48.9 2.4';
    expect(pipe.transform(testCoords, 'yxMinMax')).toBe(expected);
  });

  it('should format as overpassXML', () => {
    const expected = '<bbox-query e="2.4" n="48.9" s="48.8" w="2.3"/>';
    expect(pipe.transform(testCoords, 'overpassXML')).toBe(expected);
  });

  it('should format as overpassQL', () => {
    const expected = '48.8,2.3,48.9,2.4';
    expect(pipe.transform(testCoords, 'overpassQL')).toBe(expected);
  });

  it('should handle integer coordinates', () => {
    const integerCoords: [[number, number], [number, number]] = [
      [2, 48],
      [3, 49]
    ];
    expect(pipe.transform(integerCoords, 'xyMinMax')).toBe('2 48, 3 49');
  });

  it('should handle negative coordinates', () => {
    const negativeCoords: [[number, number], [number, number]] = [
      [-2.3, -48.8],
      [-2.2, -48.7]
    ];
    expect(pipe.transform(negativeCoords, 'xyMinMax')).toBe('-2.3 -48.8, -2.2 -48.7');
  });

  it('should handle coordinates at zero', () => {
    const zeroCoords: [[number, number], [number, number]] = [
      [0, 0],
      [1, 1]
    ];
    expect(pipe.transform(zeroCoords, 'xyMinMax')).toBe('0 0, 1 1');
  });

  it('should handle coordinates with many decimal places', () => {
    const preciseCoords: [[number, number], [number, number]] = [
      [2.34567890, 48.87654321],
      [2.45678901, 48.98765432]
    ];
    // Les nombres doivent garder leur précision
    expect(pipe.transform(preciseCoords, 'xyMinMax'))
      .toBe('2.3456789 48.87654321, 2.45678901 48.98765432');
  });

  // Tests de validation des formats
  describe('Format validations', () => {
    it('WKT should create valid polygon string', () => {
      const wkt = pipe.transform(testCoords, 'wkt');
      expect(wkt).toMatch(/^POLYGON\([0-9\.\s,-]+\)$/);
    });

    it('GeoJSON should create valid JSON', () => {
      const geojson = pipe.transform(testCoords, 'geojson');
      const parsed = JSON.parse(geojson);
      expect(parsed.type).toBe('Polygon');
      expect(Array.isArray(parsed.coordinates)).toBe(true);
    });

    it('overpassXML should create valid XML', () => {
      const xml = pipe.transform(testCoords, 'overpassXML');
      expect(xml).toMatch(/^<bbox-query[^>]+\/>$/);
      expect(xml).toContain('e="');
      expect(xml).toContain('n="');
      expect(xml).toContain('s="');
      expect(xml).toContain('w="');
    });
  });
});
