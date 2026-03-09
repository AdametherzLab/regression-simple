import { describe, it, expect, afterEach } from 'bun:test';
import { existsSync, unlinkSync } from 'fs';
import { performRegression, exportResults, exportResultsToFile } from '../src/index';
import type { RegressionResult } from '../src/index';

const sampleResult: RegressionResult = {
  coefficients: [1, 2],
  rSquared: 0.99,
  predictionIntervals: [
    { lower: 0.5, upper: 1.5 },
    { lower: 2.5, upper: 3.5 },
  ],
};

const tmpFile = '/tmp/regression-export-test-output';

afterEach(() => {
  for (const ext of ['.json', '.csv']) {
    const f = tmpFile + ext;
    if (existsSync(f)) unlinkSync(f);
  }
});

describe('exportResults', () => {
  it('should export valid JSON with all fields', () => {
    const json = exportResults(sampleResult, { format: 'json', label: 'test-run' });
    const parsed = JSON.parse(json);
    expect(parsed.label).toBe('test-run');
    expect(parsed.coefficients).toEqual([1, 2]);
    expect(parsed.rSquared).toBe(0.99);
    expect(parsed.predictionIntervals).toHaveLength(2);
    expect(parsed.predictionIntervals[0].lower).toBe(0.5);
  });

  it('should export valid CSV with coefficients and r-squared', () => {
    const csv = exportResults(sampleResult, { format: 'csv' });
    const lines = csv.split('\n');
    expect(lines[0]).toBe('section,index,value');
    expect(lines[1]).toBe('coefficient,0,1');
    expect(lines[2]).toBe('coefficient,1,2');
    expect(lines[3]).toBe('r_squared,0,0.99');
    // prediction intervals section
    expect(lines[5]).toBe('interval_index,lower,upper');
    expect(lines[6]).toBe('0,0.5,1.5');
  });

  it('should default to JSON when no format specified', () => {
    const output = exportResults(sampleResult);
    const parsed = JSON.parse(output);
    expect(parsed.coefficients).toEqual([1, 2]);
    expect(parsed.rSquared).toBe(0.99);
  });

  it('should omit predictionIntervals from JSON when absent', () => {
    const result: RegressionResult = { coefficients: [3], rSquared: 0.5 };
    const parsed = JSON.parse(exportResults(result));
    expect(parsed.predictionIntervals).toBeUndefined();
  });

  it('should include label comment in CSV when provided', () => {
    const csv = exportResults(sampleResult, { format: 'csv', label: 'My Run' });
    expect(csv.startsWith('# My Run')).toBe(true);
  });

  it('should round-trip with performRegression output', () => {
    const data = [
      { x: 0, y: 1 },
      { x: 1, y: 3 },
      { x: 2, y: 5 },
      { x: 3, y: 7 },
    ];
    const result = performRegression(data, { degree: 1, confidenceLevel: 0.95 });
    const json = exportResults(result, { format: 'json' });
    const parsed = JSON.parse(json);
    expect(parsed.coefficients[0]).toBeCloseTo(1, 5);
    expect(parsed.coefficients[1]).toBeCloseTo(2, 5);
    expect(parsed.rSquared).toBe(1);
    expect(parsed.predictionIntervals).toHaveLength(4);
  });
});

describe('exportResultsToFile', () => {
  it('should write JSON file to disk', async () => {
    const path = tmpFile + '.json';
    await exportResultsToFile(path, sampleResult, { format: 'json' });
    const content = await Bun.file(path).text();
    const parsed = JSON.parse(content);
    expect(parsed.coefficients).toEqual([1, 2]);
  });

  it('should write CSV file to disk', async () => {
    const path = tmpFile + '.csv';
    await exportResultsToFile(path, sampleResult, { format: 'csv' });
    const content = await Bun.file(path).text();
    expect(content).toContain('coefficient,0,1');
    expect(content).toContain('r_squared,0,0.99');
  });
});
