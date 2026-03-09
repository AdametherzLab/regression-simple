import { describe, it, expect } from 'bun:test';
import { performRegression, type DataPoint } from '../src/index';

describe('performRegression', () => {
  // Existing tests...
  
  describe('additional models', () => {
    it('should compute exponential regression', () => {
      const data: DataPoint[] = [
        { x: 0, y: 2 },
        { x: 1, y: 2 * Math.exp(0.5) },
        { x: 2, y: 2 * Math.exp(1) },
        { x: 3, y: 2 * Math.exp(1.5) },
      ];
      const result = performRegression(data, { model: 'exponential' });
      expect(result.coefficients[0]).toBeCloseTo(2, 2);
      expect(result.coefficients[1]).toBeCloseTo(0.5, 2);
      expect(result.rSquared).toBeCloseTo(1, 4);
    });

    it('should compute logarithmic regression', () => {
      const data: DataPoint[] = [
        { x: 1, y: 3 },
        { x: Math.E, y: 5 },
        { x: Math.E ** 2, y: 7 },
      ];
      const result = performRegression(data, { model: 'logarithmic' });
      expect(result.coefficients[0]).toBeCloseTo(3, 2);
      expect(result.coefficients[1]).toBeCloseTo(2, 2);
      expect(result.rSquared).toBeCloseTo(1, 4);
    });

    it('should handle weighted exponential regression', () => {
      const data: DataPoint[] = [
        { x: 1, y: 10, weight: 1000 },
        { x: 2, y: 20, weight: 1 },
        { x: 3, y: 30, weight: 1 },
      ];
      const result = performRegression(data, { model: 'exponential' });
      expect(result.coefficients[0]).toBeCloseTo(10, 1);
      expect(result.coefficients[1]).toBeCloseTo(0, 1);
    });

    it('should throw on invalid exponential data', () => {
      expect(() => performRegression(
        [{ x: 0, y: 0 }], 
        { model: 'exponential' }
      )).toThrow('positive');
    });

    it('should throw on invalid logarithmic data', () => {
      expect(() => performRegression(
        [{ x: 0, y: 0 }], 
        { model: 'logarithmic' }
      )).toThrow('positive');
    });
  });
});
