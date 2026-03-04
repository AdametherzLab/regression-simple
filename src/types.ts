export interface DataPoint {
  readonly x: number;
  readonly y: number;
  readonly weight?: number;
}

export interface RegressionOptions {
  readonly degree?: number;
  readonly confidenceLevel?: number;
}

export interface PredictionInterval {
  readonly lower: number;
  readonly upper: number;
}

export interface RegressionResult {
  readonly coefficients: readonly number[];
  readonly rSquared: number;
  readonly predictionIntervals?: readonly PredictionInterval[];
}

export type WeightedArray = readonly (readonly [number, number, number])[];