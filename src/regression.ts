import type { DataPoint, PredictionInterval, RegressionOptions, RegressionResult } from './types';

function transpose(matrix: number[][]): number[][] {
  return matrix[0].map((_, col) => matrix.map(row => row[col]));
}

function multiply(a: number[][], b: number[][]): number[][] {
  return a.map(row => 
    b[0].map((_, colIdx) => 
      row.reduce((sum, ai, rowIdx) => sum + ai * b[rowIdx][colIdx], 0)
    )
  );
}

function multiplyMatrixVector(matrix: number[][], vector: number[]): number[] {
  return matrix.map(row => 
    row.reduce((sum, val, idx) => sum + val * vector[idx], 0)
  );
}

function dotProduct(a: number[], b: number[]): number {
  return a.reduce((sum, val, i) => sum + val * b[i], 0);
}

function solveLinearSystem(A: number[][], b: number[]): number[] {
  const n = A.length;
  const augmented = A.map((row, i) => [...row, b[i]]);

  for (let i = 0; i < n; i++) {
    let maxRow = i;
    for (let j = i; j < n; j++) {
      if (Math.abs(augmented[j][i]) > Math.abs(augmented[maxRow][i])) {
        maxRow = j;
      }
    }
    [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];

    const pivot = augmented[i][i];
    if (Math.abs(pivot) < 1e-10) throw new Error('Singular matrix');
    
    for (let j = i; j <= n; j++) augmented[i][j] /= pivot;
    for (let j = 0; j < n; j++) {
      if (j !== i) {
        const factor = augmented[j][i];
        for (let k = i; k <= n; k++) augmented[j][k] -= factor * augmented[i][k];
      }
    }
  }

  return augmented.map(row => row[n]);
}

function invertMatrix(matrix: number[][]): number[][] {
  const n = matrix.length;
  const augmented = matrix.map((row, i) => 
    [...row, ...Array(n).fill(0).map((_, j) => j === i ? 1 : 0)]
  );

  for (let i = 0; i < n; i++) {
    let maxRow = i;
    for (let j = i; j < n; j++) {
      if (Math.abs(augmented[j][i]) > Math.abs(augmented[maxRow][i])) {
        maxRow = j;
      }
    }
    [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];

    const pivot = augmented[i][i];
    for (let j = i; j < 2 * n; j++) augmented[i][j] /= pivot;
    for (let j = 0; j < n; j++) {
      if (j !== i) {
        const factor = augmented[j][i];
        for (let k = i; k < 2 * n; k++) augmented[j][k] -= factor * augmented[i][k];
      }
    }
  }

  return augmented.map(row => row.slice(-n));
}

function probit(p: number): number {
  const a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02, 1.383577518672690e+02];
  const b = [-8.301545205030929e+01, 4.658090436859859e+02, -9.249711727467677e+02, 6.610834126039097e+02];
  const c = [0.3374754822726147, 0.9761690190917186, 0.1607979714918209, 0.0276438810333863];
  
  if (p <= 0 || p >= 1) throw new Error('Invalid p-value');
  const q = p - 0.5;
  
  if (Math.abs(q) <= 0.425) {
    const r = q * q;
    return q * (((a[3] * r + a[2]) * r + a[1]) * r + a[0]) / 
      ((((b[3] * r + b[2]) * r + b[1]) * r + b[0]) * r + 1);
  }
  
  const r = Math.sqrt(-Math.log(q < 0 ? p : 1 - p));
  let x = c[0] + r * (c[1] + r * (c[2] + r * c[3]));
  if (q < 0) x = -x;
  return x;
}

export function performRegression(
  data: DataPoint[],
  options: RegressionOptions = {}
): RegressionResult {
  const degree = options.degree ?? 1;
  const confidenceLevel = options.confidenceLevel;
  const weightedData = data.map(({ x, y, weight = 1 }) => [x, y, weight] as const);
  
  if (weightedData.length <= degree + 1) {
    throw new Error(`Insufficient data points for degree ${degree} regression`);
  }

  const xValues: number[] = [];
  const X: number[][] = [];
  const Y: number[] = [];
  
  for (const [x, y, weight] of weightedData) {
    xValues.push(x);
    const sqrtW = Math.sqrt(weight);
    const row = Array.from({ length: degree + 1 }, (_, d) => Math.pow(x, d) * sqrtW);
    X.push(row);
    Y.push(y * sqrtW);
  }

  const XT = transpose(X);
  const XTX = multiply(XT, X);
  const XTY = multiplyMatrixVector(XT, Y);
  const coefficients = solveLinearSystem(XTX, XTY);

  const predictions = X.map(row => dotProduct(row, coefficients));
  const residuals = Y.map((y, i) => y - predictions[i]);
  const sse = residuals.reduce((sum, r) => sum + r ** 2, 0);
  const yMean = Y.reduce((sum, y) => sum + y, 0) / Y.length;
  const sst = Y.reduce((sum, y) => sum + (y - yMean) ** 2, 0);
  const rSquared = sst === 0 ? 1 : 1 - sse / sst;

  let predictionIntervals: PredictionInterval[] | undefined;
  if (confidenceLevel !== undefined) {
    const sigmaSquared = sse / (Y.length - coefficients.length);
    const XTXInverse = invertMatrix(XTX);
    const criticalValue = probit(1 - (1 - confidenceLevel) / 2);

    predictionIntervals = xValues.map(x => {
      const designRow = Array.from({ length: degree + 1 }, (_, d) => Math.pow(x, d));
      const varianceFactor = dotProduct(
        multiplyMatrixVector(XTXInverse, designRow),
        designRow
      );
      const se = Math.sqrt(sigmaSquared * (1 + varianceFactor));
      const yHat = dotProduct(designRow, coefficients);
      const margin = criticalValue * se;
      return { lower: yHat - margin, upper: yHat + margin };
    });
  }

  return { coefficients, rSquared, predictionIntervals };
}