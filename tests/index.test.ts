import { describe, it, expect } from 'bun:test';
import { performRegression, type DataPoint } from '../src/index';

describe('performRegression', () => {
  // Existing tests...
  
  describe('additional models', () => {
    it('should compute power regression', () => {
      const data: DataPoint[] = [
        { x: 1, y: 2 },
        { x: 2, y: 2 * Math.pow(2, 1.5) },
        { x: 3, y: 2 * Math.pow(3, 1.5) },
        { x: 4, y: 2 * Math.pow(4, 1.5) },
      ];
      const result = performRegression(data, { model: 'power' });
      expect(result.coefficients[0]).toBeCloseTo(2, 2);
      expect(result.coefficients[1]).toBeCloseTo(1.5, 2);
      expect(result.rSquared).toBeCloseTo(1, 4);
    });

    it('should compute logistic regression', () => {
      const data: DataPoint[] = [
        { x: 0, y: 0.5 },
        { x: 1, y: 1 / (1 + Math.exp(-1)) },
        { x: 2, y: 1 / (1 + Math.exp(-2)) },
      ];
      const result = performRegression(data, { model: 'logistic' });
      expect(result.coefficients[0]).toBeCloseTo(0, 2);
      expect(result.coefficients[1]).toBeCloseTo(1, 2);
      expect(result.rSquared).toBeCloseTo(1, 4);
    });

    it('should throw on invalid power data', () => {
      expect(() => performRegression(
        [{ x: 0, y: 1 }], 
        { model: 'power' }
      )).toThrow('positive x');
      expect(() => performRegression(
        [{ x: 1, y: 0 }], 
        { model: 'power' }
      )).toThrow('positive y');
    });

    it('should throw on invalid logistic data', () => {
      expect(() => performRegression(
        [{ x: 0, y: 0 }], 
        { model: 'logistic' }
      )).toThrow('between 0 and 1');
      expect(() => performRegression(
        [{ x: 0, y: 1 }], 
        { model: 'logistic' }
      )).toThrow('between 0 and 1');
    });

    // Existing exponential/logarithmic tests
  });
});
