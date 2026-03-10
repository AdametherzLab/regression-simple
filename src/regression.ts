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
  const model = options.model ?? 'polynomial';
  const degree = options.degree ?? (model === 'polynomial' ? 1 : undefined);

  if (model === 'exponential' || model === 'logarithmic' || model === 'power' || model === 'logistic') {
    if (degree !== undefined && degree !== 1) {
      throw new Error(`Degree must be 1 for ${model} regression`);
    }
  } else if (model === 'polynomial') {
    if (!Number.isInteger(degree) || degree! < 1) {
      throw new Error('Polynomial degree must be a positive integer');
    }
  }

  const confidenceLevel = options.confidenceLevel;
  const weightedData = data.map(({ x, y, weight = 1 }) => [x, y, weight] as const);

  // Validate weights
  for (const [x, y, weight] of weightedData) {
    if (weight < 0) {
      throw new Error('Weights must be non-negative');
    }
  }

  // Validate model-specific data requirements
  if (model === 'exponential') {
    for (const [x, y] of weightedData) {
      if (y <= 0) throw new Error('Exponential regression requires positive y values');
    }
  }
  if (model === 'logarithmic') {
    for (const [x] of weightedData) {
      if (x <= 0) throw new Error('Logarithmic regression requires positive x values');
    }
  }
  if (model === 'power') {
    for (const [x, y] of weightedData) {
      if (x <= 0) throw new Error('Power regression requires positive x values');
      if (y <= 0) throw new Error('Power regression requires positive y values');
    }
  }
  if (model === 'logistic') {
    for (const [x, y] of weightedData) {
      if (y <= 0 || y >= 1) throw new Error('Logistic regression requires y values between 0 and 1');
    }
  }

  // Build design matrix and transformed Y values
  const X: number[][] = [];
  const Y: number[] = [];
  const xValues: number[] = [];

  for (const [x, y, weight] of weightedData) {
    let xVal = x;
    let yVal = y;

    switch (model) {
      case 'exponential':
        yVal = Math.log(y);
        break;
      case 'logarithmic':
        xVal = Math.log(x);
        break;
      case 'power':
        xVal = Math.log(x);
        yVal = Math.log(y);
        break;
      case 'logistic':
        yVal = Math.log(y / (1 - y));
        break;
    }

    const sqrtW = Math.sqrt(weight);
    let row: number[];

    switch (model) {
      case 'exponential':
      case 'logarithmic':
      case 'power':
      case 'logistic':
        row = [sqrtW, xVal * sqrtW];
        break;
      default: {
        const effectiveDegree = degree!;
        row = Array.from({ length: effectiveDegree + 1 }, (_, d) => Math.pow(xVal, d) * sqrtW);
        break;
      }
    }

    xValues.push(xVal);
    X.push(row);
    Y.push(yVal * sqrtW);
  }

  if (X.length <= X[0].length) {
    throw new Error(`Insufficient data points for ${model} regression`);
  }

  // Solve linear system
  const XT = transpose(X);
  const XTX = multiply(XT, X);
  const XTY = multiplyMatrixVector(XT, Y);
  let originalCoefficients: number[];
  try {
    originalCoefficients = solveLinearSystem(XTX, XTY);
  } catch (error) {
    if (error.message.includes('Singular matrix')) {
      throw new Error('Matrix is singular - data may be collinear');
    }
    throw error;
  }

  // Adjust coefficients for specific models
  let coefficients = originalCoefficients.slice();
  if (model === 'exponential') {
    coefficients = [Math.exp(originalCoefficients[0]), originalCoefficients[1]];
  }
  if (model === 'power') {
    coefficients = [Math.exp(originalCoefficients[0]), originalCoefficients[1]];
  }

  // Calculate predictions in original scale
  const predictions = data.map((dp) => {
    switch (model) {
      case 'exponential':
        return coefficients[0] * Math.exp(coefficients[1] * dp.x);
      case 'logarithmic':
        return coefficients[0] + coefficients[1] * Math.log(dp.x);
      case 'power':
        return coefficients[0] * Math.pow(dp.x, coefficients[1]);
      case 'logistic': {
        const linear = coefficients[0] + coefficients[1] * dp.x;
        return 1 / (1 + Math.exp(-linear));
      }
      default:
        return coefficients.reduce((sum, coeff, d) => sum + coeff * Math.pow(dp.x, d), 0);
    }
  });

  // Compute R-squared
  const weights = data.map(dp => dp.weight ?? 1);
  const weightedYSum = data.reduce((sum, dp, i) => sum + dp.y * weights[i], 0);
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  const weightedMeanY = weightedYSum / totalWeight;

  const sse = data.reduce((sum, dp, i) => {
    const residual = dp.y - predictions[i];
    return sum + weights[i] * residual ** 2;
  }, 0);

  const sst = data.reduce((sum, dp, i) => {
    return sum + weights[i] * (dp.y - weightedMeanY) ** 2;
  }, 0);

  const rSquared = sst === 0 ? 1 : 1 - sse / sst;

  // Calculate prediction intervals
  let predictionIntervals: PredictionInterval[] | undefined;
  if (confidenceLevel !== undefined) {
    const sigmaSquared = sse / (data.length - coefficients.length);
    const XTXInverse = invertMatrix(XTX);
    const criticalValue = probit(1 - (1 - confidenceLevel) / 2);

    predictionIntervals = xValues.map((xVal, i) => {
      let designRow: number[];
      switch (model) {
        case 'exponential':
          designRow = [1, data[i].x];
          break;
        case 'logarithmic':
        case 'power':
          designRow = [1, xVal];
          break;
        case 'logistic':
          designRow = [1, data[i].x];
          break;
        default:
          designRow = Array.from({ length: coefficients.length }, (_, d) => Math.pow(xVal, d));
      }

      const varianceFactor = dotProduct(
        multiplyMatrixVector(XTXInverse, designRow),
        designRow
      );
      const se = Math.sqrt(sigmaSquared * (1 + varianceFactor));

      let yHatLinear;
      if (model === 'exponential' || model === 'power') {
        yHatLinear = dotProduct(designRow, originalCoefficients);
      } else {
        yHatLinear = dotProduct(designRow, coefficients);
      }
      
      let lower, upper;
      if (model === 'exponential' || model === 'power') {
        lower = Math.exp(yHatLinear - criticalValue * se);
        upper = Math.exp(yHatLinear + criticalValue * se);
      } else if (model === 'logistic') {
        lower = 1 / (1 + Math.exp(-(yHatLinear - criticalValue * se)));
        upper = 1 / (1 + Math.exp(-(yHatLinear + criticalValue * se)));
      } else {
        lower = yHatLinear - criticalValue * se;
        upper = yHatLinear + criticalValue * se;
      }

      return { lower, upper };
    });
  }

  return {
    coefficients,
    rSquared,
    predictionIntervals
  };
}
