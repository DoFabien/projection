import { RoundCoords } from './round_coords.pipe';

describe('RoundCoordsPipe', () => {
  let pipe: RoundCoords;

  beforeEach(() => {
    pipe = new RoundCoords();
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  describe('Coordonnées < 360 (degrés)', () => {
    it('should round coordinates to 5 decimal places', () => {
      expect(pipe.transform(2.123456789)).toBe(2.12346);
      expect(pipe.transform(-2.123456789)).toBe(-2.12346);
      expect(pipe.transform(0.000001234)).toBe(0.00000);
    });

    it('should handle small coordinates correctly', () => {
      expect(pipe.transform(0.0000001)).toBe(0.00000);
      expect(pipe.transform(-0.0000001)).toBe(-0.00000);
    });

    it('should handle zero correctly', () => {
      expect(pipe.transform(0)).toBe(0);
    });

    it('should handle edge case near 360', () => {
      expect(pipe.transform(359.999999)).toBe(360.00000);
      expect(pipe.transform(-359.999999)).toBe(-360.00000);
    });
  });

  describe('Coordonnées >= 360 (projections)', () => {
    it('should round large coordinates to 1 decimal place', () => {
      expect(pipe.transform(1000000.123456)).toBe(1000000.1);
      expect(pipe.transform(-1000000.123456)).toBe(-1000000.1);
    });

    it('should handle values just above 360', () => {
      expect(pipe.transform(360.123456)).toBe(360.1);
      expect(pipe.transform(-360.123456)).toBe(-360.1);
    });

    it('should handle very large coordinates', () => {
      expect(pipe.transform(9999999.999)).toBe(10000000.0);
      expect(pipe.transform(-9999999.999)).toBe(-10000000.0);
    });
  });

  describe('Gestion des cas spéciaux', () => {
    it('should handle undefined and null', () => {
      expect(pipe.transform(undefined as any)).toBeUndefined();
      expect(pipe.transform(null as any)).toBeNull();
    });

    it('should handle zero value', () => {
      expect(pipe.transform(0)).toBe(0);
    });

    it('should handle NaN', () => {
      expect(Number.isNaN(pipe.transform(NaN))).toBe(true);
    });

    it('should handle Infinity', () => {
      expect(pipe.transform(Infinity)).toBe(Infinity);
      expect(pipe.transform(-Infinity)).toBe(-Infinity);
    });
  });

  describe('Précision et exactitude', () => {
    it('should maintain symmetry for positive and negative values', () => {
      const value = 123.456789;
      expect(pipe.transform(value)).toBe(-pipe.transform(-value));
    });

    it('should not introduce rounding errors for whole numbers', () => {
      expect(pipe.transform(100)).toBe(100);
      expect(pipe.transform(-100)).toBe(-100);
    });

    it('should handle floating point precision correctly', () => {
      // Test pour éviter les erreurs de précision en virgule flottante
      expect(pipe.transform(2.1 + 2.2)).toBe(4.30000);
      expect(pipe.transform(0.1 + 0.2)).toBe(0.30000);
    });
  });

  describe('Performance', () => {
    it('should handle repeated transformations consistently', () => {
      const value = 123.456789;
      const result = pipe.transform(value);
      expect(pipe.transform(result)).toBe(result); // Double transformation
    });

    it('should handle a large number of transformations', () => {
      const values = Array.from({ length: 1000 }, (_, i) => i * 1.123456789);
      const start = performance.now();
      values.forEach(v => pipe.transform(v));
      const end = performance.now();
      expect(end - start).toBeLessThan(100); // Devrait s'exécuter en moins de 100ms
    });
  });
});