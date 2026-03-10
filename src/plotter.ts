import type { DataPoint, RegressionResult } from './types';

export interface PlotterOptions {
  /** Title of the plot */
  readonly title?: string;
  /** Width of the chart in pixels (default: 800) */
  readonly width?: number;
  /** Height of the chart in pixels (default: 600) */
  readonly height?: number;
  /** Whether to show prediction intervals (default: true if available) */
  readonly showPredictionIntervals?: boolean;
  /** Number of points to use for the regression curve (default: 100) */
  readonly curveResolution?: number;
}

/**
 * Generates an interactive HTML plot of the regression results.
 * Creates a standalone HTML file with Chart.js visualization showing
 * data points, fitted curve, and optional prediction intervals.
 * 
 * @param data - Original data points
 * @param result - Regression result from performRegression
 * @param options - Plotting options
 * @returns HTML string that can be saved to a file and opened in a browser
 * 
 * @example
 * 
 * const data = [{ x: 1, y: 2 }, { x: 2, y: 4 }, { x: 3, y: 6 }];
 * const result = performRegression(data, { model: 'linear' });
 * const html = plotRegression(data, result, { title: 'Linear Fit' });
 * await Bun.write('plot.html', html);
 * 
 */
export function plotRegression(
  data: DataPoint[],
  result: RegressionResult,
  options: PlotterOptions = {}
): string {
  const {
    title = 'Regression Plot',
    width = 800,
    height = 600,
    showPredictionIntervals = result.predictionIntervals !== undefined,
    curveResolution = 100
  } = options;

  if (data.length === 0) {
    throw new Error('No data points provided');
  }

  const xValues = data.map(d => d.x);
  const minX = Math.min(...xValues);
  const maxX = Math.max(...xValues);
  const xRange = maxX - minX || 1;

  // Generate curve points
  const curvePoints: { x: number; y: number }[] = [];
  const lowerBounds: { x: number; y: number }[] = [];
  const upperBounds: { x: number; y: number }[] = [];

  for (let i = 0; i <= curveResolution; i++) {
    const x = minX + (i / curveResolution) * xRange;
    const y = evaluateRegression(x, result);
    curvePoints.push({ x, y });

    if (showPredictionIntervals && result.predictionIntervals) {
      // Find closest prediction interval for this x value
      const idx = findClosestIndex(x, data.map(d => d.x));
      if (result.predictionIntervals[idx]) {
        lowerBounds.push({ x, y: result.predictionIntervals[idx].lower });
        upperBounds.push({ x, y: result.predictionIntervals[idx].upper });
      }
    }
  }

  const chartData = {
    datasets: [
      {
        label: 'Data Points',
        data: data.map(d => ({ x: d.x, y: d.y })),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        type: 'scatter',
        showLine: false
      },
      {
        label: 'Regression Curve',
        data: curvePoints,
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.1)',
        type: 'line',
        fill: false,
        tension: 0.4,
        pointRadius: 0
      }
    ]
  };

  if (showPredictionIntervals && result.predictionIntervals && lowerBounds.length > 0) {
    // Add prediction interval bands
    chartData.datasets.push({
      label: 'Upper Bound',
      data: upperBounds,
      borderColor: 'rgba(75, 192, 192, 0.3)',
      backgroundColor: 'rgba(75, 192, 192, 0.1)',
      type: 'line',
      fill: false,
      pointRadius: 0,
      borderDash: [5, 5]
    });
    chartData.datasets.push({
      label: 'Lower Bound',
      data: lowerBounds,
      borderColor: 'rgba(75, 192, 192, 0.3)',
      backgroundColor: 'rgba(75, 192, 192, 0.1)',
      type: 'line',
      fill: '-1', // Fill to previous dataset
      pointRadius: 0,
      borderDash: [5, 5]
    });
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            max-width: ${width + 40}px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1 {
            margin: 0 0 20px 0;
            font-size: 24px;
            color: #333;
        }
        .stats {
            margin-top: 20px;
            padding: 15px;
            background: #f9f9f9;
            border-radius: 4px;
            font-family: monospace;
            font-size: 14px;
        }
        .stats-row {
            margin: 5px 0;
        }
        canvas {
            max-width: 100%;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>${title}</h1>
        <canvas id="regressionChart" width="${width}" height="${height}"></canvas>
        <div class="stats">
            <div class="stats-row"><strong>Model:</strong> ${result.model || 'polynomial'}</div>
            <div class="stats-row"><strong>R²:</strong> ${result.rSquared.toFixed(6)}</div>
            <div class="stats-row"><strong>Coefficients:</strong> [${result.coefficients.map(c => c.toFixed(6)).join(', ')}]</div>
        </div>
    </div>
    <script>
        const ctx = document.getElementById('regressionChart').getContext('2d');
        const chartData = ${JSON.stringify(chartData)};
        
        new Chart(ctx, {
            type: 'scatter',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        type: 'linear',
                        position: 'bottom',
                        title: {
                            display: true,
                            text: 'X'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Y'
                        }
                    }
                },
                plugins: {
                    title: {
                        display: false
                    },
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                }
            }
        });
    </script>
</body>
</html>`;

  return html;
}

function evaluateRegression(x: number, result: RegressionResult): number {
  const { coefficients, model = 'polynomial' } = result;
  
  switch (model) {
    case 'exponential':
      return coefficients[0] * Math.exp(coefficients[1] * x);
    case 'logarithmic':
      return coefficients[0] + coefficients[1] * Math.log(x);
    case 'power':
      return coefficients[0] * Math.pow(x, coefficients[1]);
    case 'logistic': {
      const linear = coefficients[0] + coefficients[1] * x;
      return 1 / (1 + Math.exp(-linear));
    }
    case 'linear':
    case 'polynomial':
    default:
      return coefficients.reduce((sum, coeff, i) => sum + coeff * Math.pow(x, i), 0);
  }
}

function findClosestIndex(target: number, values: number[]): number {
  let closest = 0;
  let minDiff = Math.abs(values[0] - target);
  
  for (let i = 1; i < values.length; i++) {
    const diff = Math.abs(values[i] - target);
    if (diff < minDiff) {
      minDiff = diff;
      closest = i;
    }
  }
  
  return closest;
}
