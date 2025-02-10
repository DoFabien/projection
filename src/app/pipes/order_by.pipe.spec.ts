import { OrderBy } from './order_by.pipe';

describe('OrderByPipe', () => {
  let pipe: OrderBy;
  
  // Données de test
  const testItems = [
    { code: 'EPSG:3857', name: 'Web Mercator', value: 2 },
    { code: 'EPSG:4326', name: 'WGS 84', value: 1 },
    { code: 'EPSG:2154', name: 'RGF93', value: 3 }
  ];

  beforeEach(() => {
    pipe = new OrderBy();
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return empty array if input array is null or undefined', () => {
    expect(pipe.transform(null as any, 'code')).toEqual([]);
    expect(pipe.transform(undefined as any, 'code')).toEqual([]);
  });

  it('should return original array if no field is specified', () => {
    expect(pipe.transform(testItems, '')).toEqual(testItems);
    expect(pipe.transform(testItems, null as any)).toEqual(testItems);
    expect(pipe.transform(testItems, undefined as any)).toEqual(testItems);
  });

  it('should sort by code in ascending order', () => {
    const result = pipe.transform(testItems, 'code');
    expect(result).toEqual([
      { code: 'EPSG:2154', name: 'RGF93', value: 3 },
      { code: 'EPSG:3857', name: 'Web Mercator', value: 2 },
      { code: 'EPSG:4326', name: 'WGS 84', value: 1 }
    ]);
  });

  it('should sort by code in descending order', () => {
    const result = pipe.transform(testItems, '-code');
    expect(result).toEqual([
      { code: 'EPSG:4326', name: 'WGS 84', value: 1 },
      { code: 'EPSG:3857', name: 'Web Mercator', value: 2 },
      { code: 'EPSG:2154', name: 'RGF93', value: 3 }
    ]);
  });

  it('should sort by name in ascending order', () => {
    const result = pipe.transform(testItems, 'name');
    expect(result).toEqual([
      { code: 'EPSG:2154', name: 'RGF93', value: 3 },
      { code: 'EPSG:3857', name: 'Web Mercator', value: 2 },
      { code: 'EPSG:4326', name: 'WGS 84', value: 1 }
    ]);
  });

  it('should sort by name in descending order', () => {
    const result = pipe.transform(testItems, '-name');
    expect(result).toEqual([
      { code: 'EPSG:4326', name: 'WGS 84', value: 1 },
      { code: 'EPSG:3857', name: 'Web Mercator', value: 2 },
      { code: 'EPSG:2154', name: 'RGF93', value: 3 }
    ]);
  });

  it('should sort numeric values correctly', () => {
    const result = pipe.transform(testItems, 'value');
    expect(result).toEqual([
      { code: 'EPSG:4326', name: 'WGS 84', value: 1 },
      { code: 'EPSG:3857', name: 'Web Mercator', value: 2 },
      { code: 'EPSG:2154', name: 'RGF93', value: 3 }
    ]);
  });

  it('should handle items with missing properties', () => {
    const itemsWithMissing = [
      { code: 'TEST1' },
      { code: 'TEST2', name: 'Test' },
      { name: 'Only Name' }
    ];

    const resultCode = pipe.transform(itemsWithMissing, 'code');
    expect(resultCode[0].code).toBe('TEST1');
    expect(resultCode[1].code).toBe('TEST2');
  });

  it('should not modify the original array', () => {
    const original = [...testItems];
    pipe.transform(testItems, 'code');
    expect(testItems).toEqual(original);
  });

  it('should maintain stable sort for equal values', () => {
    const itemsWithDuplicates = [
      { code: 'A', value: 1 },
      { code: 'B', value: 1 },
      { code: 'C', value: 1 }
    ];

    const result = pipe.transform(itemsWithDuplicates, 'value');
    expect(result[0].code).toBe('A');
    expect(result[1].code).toBe('B');
    expect(result[2].code).toBe('C');
  });
});