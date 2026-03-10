import { describe, it, expect } from 'bun:test';
import { performRegression, type DataPoint } from '../src/index';

describe('performRegression', () => {
  describe('additional models', () => {
    it('should fit exponential model y = a*e^(bx)', () => {
      const data: DataPoint[] = [
        { x: 1, y: 2 * Math.exp(0.5 * 1) },
        { x: 2, y: 2 * Math.exp(0.5 * 2) },
        { x: 3, y: 2 * Math.exp(0.5 * 3) },
      ];
      const result = performRegression(data, { model: 'exponential' });
      expect(result.coefficients[0]).toBeCloseTo(2, 4);
      expect(result.coefficients[1]).toBeCloseTo(0.5, 4);
      expect(result.rSquared).toBe(1);
    });

    it('should fit logarithmic model y = a + b*ln(x)', () => {
      const data: DataPoint[] = [
        { x: 1, y: 3 },
        { x: Math.E, y: 3 + 1.5 },
        { x: Math.E * Math.E, y: 3 + 1.5 * 2 },
      ];
      const result = performRegression(data, { model: 'logarithmic' });
      expect(result.coefficients[0]).toBeCloseTo(3, 4);
      expect(result.coefficients[1]).toBeCloseTo(1.5, 4);
      expect(result.rSquared).toBe(1);
    });

    it('should fit power model y = a*x^b', () => {
      const data: DataPoint[] = [
        { x: 1, y: 5 },
        { x: 2, y: 5 * Math.pow(2, 2) },
        { x: 3, y: 5 * Math.pow(3, 2) },
      ];
      const result = performRegression(data, { model: 'power' });
      expect(result.coefficients[0]).toBeCloseTo(5, 4);
      expect(result.coefficients[1]).toBeCloseTo(2, 4);
      expect(result.rSquared).toBe(1);
    });

    it('should fit logistic model', () => {
      const data: DataPoint[] = [
        { x: 1, y: 1 / (1 + Math.exp(-(0.5 + 1.2 * 1))) },
        { x: 2, y: 1 / (1 + Math.exp(-(0.5 + 1.2 * 2))) },
        { x: 3, y: 1 / (1 + Math.exp(-(0.5 + 1.2 * 3))) },
      ];
      const result = performRegression(data, { model: 'logistic' });
      expect(result.coefficients[0]).toBeCloseTo(0.5, 2);
      expect(result.coefficients[1]).toBeCloseTo(1.2, 2);
      expect(result.rSquared).toBe(1);
    });

    it('should throw error for exponential model with non-positive y', () => {
      const data = [{ x: 1, y: 0 }, { x: 2, y: -1 }];
      expect(() => performRegression(data, { model: 'exponential' })).toThrow('positive y values');
    });

    it('should throw error for logarithmic model with non-positive x', () => {
      const data = [{ x: 0, y: 1 }, { x: -1, y: 2 }];
      expect(() => performRegression(data, { model: 'logarithmic' })).toThrow('positive x values');
    });

    it('should throw error for power model with invalid x/y', () => {
      expect(() => performRegression([{ x: -1, y: 2 }], { model: 'power' })).toThrow('positive x values');
      expect(() => performRegression([{ x: 2, y: 0 }], { model: 'power' })).toThrow('positive y values');
    });

    it('should throw error for logistic model with invalid y', () => {
      expect(() => performRegression([{ x: 1, y: 1.1 }], { model: 'logistic' })).toThrow('between 0 and 1');
      expect(() => performRegression([{ x: 1, y: -0.1 }], { model: 'logistic' })).toThrow('between 0 and 1');
    });
  });

  describe('weighted regression', () => {
    // Existing weighted tests...
  });
});
