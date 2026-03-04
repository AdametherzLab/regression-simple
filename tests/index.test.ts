import { describe, it, expect } from 'bun:test';
import { performRegression, type DataPoint } from '../src/index';

describe('performRegression', () => {
  it('should compute correct linear regression with perfect fit', () => {
    const data: DataPoint[] = [
      { x: 0, y: 1 },
      { x: 1, y: 3 },
      { x: 2, y: 5 }
    ];
    const result = performRegression(data, { degree: 1 });
    expect(result.coefficients).toEqual([1, 2]);
    expect(result.rSquared).toBe(1);
  });

  it('should calculate quadratic regression with R-squared=1', () => {
    const data: DataPoint[] = [
      { x: 0, y: 0 }, { x: 1, y: 1 },
      { x: 2, y: 4 }, { x: 3, y: 9 }
    ];
    const result = performRegression(data, { degree: 2 });
    expect(result.coefficients[0]).toBeCloseTo(0, 5);
    expect(result.coefficients[1]).toBeCloseTo(0, 5);
    expect(result.coefficients[2]).toBeCloseTo(1, 5);
    expect(result.rSquared).toBe(1);
  });

  it('should apply weights and shift regression line', () => {
    const data: DataPoint[] = [
      { x: 0, y: 0, weight: 1 },
      { x: 1, y: 1, weight: 1 },
      { x: 2, y: 10, weight: 1000 }
    ];
    const result = performRegression(data, { degree: 1 });
    expect(result.coefficients[0]).toBeCloseTo(0, 1);
    expect(result.coefficients[1]).toBeCloseTo(1, 1);
  });

  it('should generate valid prediction intervals', () => {
    const data: DataPoint[] = [
      { x: 1, y: 1 }, { x: 2, y: 2 }, { x: 3, y: 3 }
    ];
    const result = performRegression(data, { degree: 1, confidenceLevel: 0.95 });
    expect(result.predictionIntervals?.length).toBe(3);
    result.predictionIntervals?.forEach(interval => {
      expect(interval.lower).toBeLessThanOrEqual(interval.upper);
      expect(interval.lower).toBeCloseTo(interval.upper, 2);
    });
  });

  it('should throw on invalid inputs', () => {
    expect(() => performRegression([], { degree: 1 })).toThrow();
    expect(() => performRegression([{ x: 0, y: 0 }], { confidenceLevel: 1.1 })).toThrow();
    const collinearData: DataPoint[] = [
      { x: 1, y: 2 }, { x: 1, y: 3 }, { x: 1, y: 4 }
    ];
    expect(() => performRegression(collinearData, { degree: 1 })).toThrow('Singular');
  });

  it('should handle zero variance case correctly', () => {
    const data: DataPoint[] = [
      { x: 0, y: 5 }, { x: 1, y: 5 }, { x: 2, y: 5 }
    ];
    const result = performRegression(data, { degree: 1 });
    expect(result.coefficients[1]).toBeCloseTo(0, 5);
    expect(result.rSquared).toBe(1);
  });
});