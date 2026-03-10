import { describe, it, expect } from 'bun:test';
import { plotRegression } from '../src/plotter';
import { performRegression } from '../src/index';
import type { DataPoint } from '../src/index';

describe('plotRegression', () => {
  it('should generate valid HTML with Chart.js CDN', () => {
    const data: DataPoint[] = [
      { x: 1, y: 2 },
      { x: 2, y: 4 },
      { x: 3, y: 6 },
    ];
    const result = performRegression(data, { model: 'linear' });
    const html = plotRegression(data, result);
    
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('chart.js');
    expect(html).toContain('<canvas');
    expect(html).toContain('Regression Plot');
  });

  it('should include data points and regression curve in chart data', () => {
    const data: DataPoint[] = [
      { x: 1, y: 2 },
      { x: 2, y: 4 },
      { x: 3, y: 6 },
    ];
    const result = performRegression(data, { model: 'linear' });
    const html = plotRegression(data, result);
    
    // Check that data is embedded in the script
    expect(html).toContain('Data Points');
    expect(html).toContain('Regression Curve');
    expect(html).toContain('"x":1');
    expect(html).toContain('"y":2');
  });

  it('should include prediction intervals when available', () => {
    const data: DataPoint[] = [
      { x: 1, y: 2 },
      { x: 2, y: 4 },
      { x: 3, y: 6 },
    ];
    const result = performRegression(data, { model: 'linear', confidenceLevel: 0.95 });
    const html = plotRegression(data, result, { showPredictionIntervals: true });
    
    expect(html).toContain('Upper Bound');
    expect(html).toContain('Lower Bound');
  });

  it('should throw error for empty data', () => {
    expect(() => plotRegression([], { coefficients: [1, 2], rSquared: 1 }))
      .toThrow('No data points provided');
  });

  it('should respect custom title and dimensions', () => {
    const data: DataPoint[] = [{ x: 1, y: 2 }, { x: 2, y: 4 }];
    const result = performRegression(data, { model: 'linear' });
    const html = plotRegression(data, result, { 
      title: 'Custom Title',
      width: 1024,
      height: 768
    });
    
    expect(html).toContain('<title>Custom Title</title>');
    expect(html).toContain('width="1024"');
    expect(html).toContain('height="768"');
  });

  it('should display correct model statistics', () => {
    const data: DataPoint[] = [
      { x: 1, y: 2 },
      { x: 2, y: 4 },
      { x: 3, y: 6 },
    ];
    const result = performRegression(data, { model: 'linear' });
    const html = plotRegression(data, result);
    
    expect(html).toContain('R²:');
    expect(html).toContain('Coefficients:');
    expect(html).toContain(result.rSquared.toFixed(6));
  });
});
