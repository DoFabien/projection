import { FilterPipe } from './filter.pipe';

describe('FilterPipe', () => {
  let pipe: FilterPipe;
  
  // Données de test
  const testItems = [
    { code: 'EPSG:4326', name: 'WGS 84' },
    { code: 'EPSG:3857', name: 'Web Mercator' },
    { code: 'EPSG:2154', name: 'RGF93 / Lambert-93' }
  ];

  beforeEach(() => {
    pipe = new FilterPipe();
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return empty array if items is null or undefined', () => {
    expect(pipe.transform(null as any, 'test')).toEqual([]);
    expect(pipe.transform(undefined as any, 'test')).toEqual([]);
  });

  it('should return original array if searchText is empty', () => {
    expect(pipe.transform(testItems, '')).toEqual(testItems);
    expect(pipe.transform(testItems, null as any)).toEqual(testItems);
    expect(pipe.transform(testItems, undefined as any)).toEqual(testItems);
  });

  it('should filter by code', () => {
    // Recherche exacte
    expect(pipe.transform(testItems, '4326')).toEqual([
      { code: 'EPSG:4326', name: 'WGS 84' }
    ]);

    // Recherche partielle
    expect(pipe.transform(testItems, 'EPSG')).toEqual(testItems);
    
    // Recherche insensible à la casse
    expect(pipe.transform(testItems, 'epsg')).toEqual(testItems);
  });

  it('should filter by name', () => {
    // Recherche exacte
    expect(pipe.transform(testItems, 'WGS 84')).toEqual([
      { code: 'EPSG:4326', name: 'WGS 84' }
    ]);

    // Recherche partielle
    expect(pipe.transform(testItems, 'Lambert')).toEqual([
      { code: 'EPSG:2154', name: 'RGF93 / Lambert-93' }
    ]);
    
    // Recherche insensible à la casse
    expect(pipe.transform(testItems, 'mercator')).toEqual([
      { code: 'EPSG:3857', name: 'Web Mercator' }
    ]);
  });

  it('should handle items with missing properties', () => {
    const itemsWithMissing = [
      { code: 'TEST1' },
      { name: 'Test 2' },
      { other: 'property' }
    ];

    expect(pipe.transform(itemsWithMissing, 'TEST1')).toEqual([
      { code: 'TEST1' }
    ]);
    expect(pipe.transform(itemsWithMissing, 'Test 2')).toEqual([
      { name: 'Test 2' }
    ]);
    expect(pipe.transform(itemsWithMissing, 'property')).toEqual([]);
  });

  it('should handle special characters and spaces', () => {
    const itemsWithSpecial = [
      { code: 'TEST-123', name: 'Test / Special' },
      { code: 'TEST_456', name: 'Test & More' }
    ];

    expect(pipe.transform(itemsWithSpecial, '-123')).toEqual([
      { code: 'TEST-123', name: 'Test / Special' }
    ]);
    expect(pipe.transform(itemsWithSpecial, '/')).toEqual([
      { code: 'TEST-123', name: 'Test / Special' }
    ]);
  });

  it('should not modify original array', () => {
    const originalItems = [...testItems];
    pipe.transform(testItems, '4326');
    expect(testItems).toEqual(originalItems);
  });
});