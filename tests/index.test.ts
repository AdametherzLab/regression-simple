import { describe, it, expect } from 'bun:test';
import { performRegression, type DataPoint } from '../src/index';

describe('performRegression', () => {
  // Existing tests...
  
  describe('additional models', () => {
    // Existing model tests...
  });

  describe('weighted regression', () => {
    it('should fit towards higher-weighted points', () => {
      const data: DataPoint[] = [
        { x: 1, y: 1 },
        { x: 2, y: 2 },
        { x: 3, y: 5, weight: 10 },
      ];

      const result = performRegression(data, { degree: 1 });
      expect(result.coefficients[0]).toBeCloseTo(0.2157, 3);
      expect(result.coefficients[1]).toBeCloseTo(1.5882, 3);
      expect(result.rSquared).toBeGreaterThan(0.95);
    });

    it('should ignore zero-weighted points', () => {
      const data: DataPoint[] = [
        { x: 1, y: 100, weight: 0 },
        { x: 2, y: 2 },
        { x: 3, y: 3 },
      ];

      const result = performRegression(data, { degree: 1 });
      expect(result.coefficients).toEqual([1, 1]);
      expect(result.rSquared).toBe(1);
    });

    it('should handle varying weights', () => {
      const data: DataPoint[] = [
        { x: 1, y: 2, weight: 2 },
        { x: 2, y: 3, weight: 3 },
        { x: 3, y: 5, weight: 5 },
      ];

      const unweightedResult = performRegression(data, { degree: 1 });
      const weightedResult = performRegression(data.map(p => ({ ...p, weight: 1 })), { degree: 1 });
      expect(unweightedResult.coefficients).not.toEqual(weightedResult.coefficients);
    });

    it('should throw on negative weights', () => {
      expect(() => performRegression([{ x: 1, y: 2, weight: -1 }])).toThrow('non-negative');
    });
  });
});
