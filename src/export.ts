import type { RegressionResult } from './types';

/** Supported export formats */
export type ExportFormat = 'json' | 'csv';

/** Options for exporting regression results */
export interface ExportOptions {
  /** Output format: 'json' or 'csv' (default: 'json') */
  readonly format?: ExportFormat;
  /** Optional label/title for the export */
  readonly label?: string;
}

/**
 * Serializes a RegressionResult to a string in the specified format.
 * @param result - The regression result to export
 * @param options - Export options (format, label)
 * @returns The serialized string ready to be written to a file
 */
export function exportResults(
  result: RegressionResult,
  options: ExportOptions = {}
): string {
  const format = options.format ?? 'json';

  if (format === 'json') {
    return exportJSON(result, options.label);
  }
  if (format === 'csv') {
    return exportCSV(result, options.label);
  }
  throw new Error(`Unsupported export format: ${format as string}`);
}

function exportJSON(result: RegressionResult, label?: string): string {
  const output: Record<string, unknown> = {
    ...(label ? { label } : {}),
    coefficients: [...result.coefficients],
    rSquared: result.rSquared,
  };
  if (result.predictionIntervals) {
    output.predictionIntervals = result.predictionIntervals.map(pi => ({
      lower: pi.lower,
      upper: pi.upper,
    }));
  }
  return JSON.stringify(output, null, 2);
}

function exportCSV(result: RegressionResult, label?: string): string {
  const lines: string[] = [];

  // Header section
  if (label) {
    lines.push(`# ${label}`);
  }

  // Coefficients row
  lines.push('section,index,value');
  result.coefficients.forEach((c, i) => {
    lines.push(`coefficient,${i},${c}`);
  });

  // R-squared row
  lines.push(`r_squared,0,${result.rSquared}`);

  // Prediction intervals
  if (result.predictionIntervals) {
    lines.push('');
    lines.push('interval_index,lower,upper');
    result.predictionIntervals.forEach((pi, i) => {
      lines.push(`${i},${pi.lower},${pi.upper}`);
    });
  }

  return lines.join('\n');
}

/**
 * Writes regression results to a file.
 * @param filePath - Destination file path
 * @param result - The regression result to export
 * @param options - Export options (format, label)
 */
export async function exportResultsToFile(
  filePath: string,
  result: RegressionResult,
  options: ExportOptions = {}
): Promise<void> {
  const content = exportResults(result, options);
  await Bun.write(filePath, content);
}
