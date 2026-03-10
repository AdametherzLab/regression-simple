import type { DataPoint, RegressionOptions, PredictionInterval, RegressionResult, WeightedArray } from './types';
export type { DataPoint, RegressionOptions, PredictionInterval, RegressionResult, WeightedArray };

import { performRegression } from './regression';
export { performRegression };

import { exportResults, exportResultsToFile } from './export';
export { exportResults, exportResultsToFile };
export type { ExportFormat, ExportOptions } from './export';

import { plotRegression } from './plotter';
export { plotRegression };
export type { PlotterOptions } from './plotter';
