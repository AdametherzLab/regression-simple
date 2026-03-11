import type { DataPoint, RegressionResult } from './types';

export interface PlotterOptions {
  readonly title?: string;
  readonly width?: number;
  readonly height?: number;
  readonly showPredictionIntervals?: boolean;
  readonly curveResolution?: number;
  readonly enableZoom?: boolean;
  readonly enablePan?: boolean;
  readonly interactive?: boolean;
}

/**
 * Generates an interactive HTML plot with dynamic controls for model parameters
 * and data point adjustments. Includes real-time regression updates via HTMX.
 */
export function plotRegression(
  data: DataPoint[],
  result: RegressionResult,
  options: PlotterOptions = {}
): string {
  const {
    title = 'Interactive Regression Plot',
    width = 1000,
    height = 800,
    interactive = true,
    curveResolution = 100
  } = options;

  const modelOptions = ['linear', 'polynomial', 'exponential', 'logarithmic', 'power', 'logistic'];
  
  return `<!DOCTYPE html>
<html>
<head>
  <title>${title}</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1"></script>
  <script src="https://unpkg.com/htmx.org@1.9.10"></script>
  <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-zoom@2.0.1"></script>
  <style>
    .container { max-width: ${width}px; margin: 0 auto; }
    .controls { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; padding: 1rem; }
    .data-table { margin: 1rem 0; }
    table { width: 100%; border-collapse: collapse; }
    td, th { padding: 0.5rem; border: 1px solid #ddd; }
    input[type='number'] { width: 80px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="controls" hx-target="#chart-container">
      <div>
        <label>Model Type:
          <select name="model" hx-post="/update">
            ${modelOptions.map(m => `<option ${m === result.model ? 'selected' : ''}>${m}</option>`)}
          </select>
        </label>
      </div>
      ${result.model === 'polynomial' ? `
      <div>
        <label>Degree:
          <input type="number" name="degree" value="${result.coefficients.length - 1}"
                 min="1" max="5" hx-post="/update">
        </label>
      </div>` : ''}
    </div>

    <div class="data-table">
      <table>
        <thead><tr><th>X</th><th>Y</th><th></th></tr></thead>
        <tbody hx-target="#chart-container">
          ${data.map((d, i) => `
            <tr>
              <td><input type="number" name="x_${i}" value="${d.x}" step="0.1" hx-post="/update"></td>
              <td><input type="number" name="y_${i}" value="${d.y}" step="0.1" hx-post="/update"></td>
              <td><button hx-delete="/point/${i}">×</button></td>
            </tr>`).join('')}
        </tbody>
      </table>
      <button hx-put="/point" hx-target="tbody">Add Point</button>
    </div>

    <div id="chart-container">
      <canvas id="chart" width="${width}" height="${height}"></canvas>
    </div>
  </div>

  <script>
    let chart;
    function initChart(data, result) {
      const ctx = document.getElementById('chart').getContext('2d');
      
      if (chart) chart.destroy();
      chart = new Chart(ctx, {
        type: 'scatter',
        data: {
          datasets: [{
            label: 'Data Points',
            data: data,
            backgroundColor: 'rgb(75, 192, 192)'
          }, {
            label: 'Regression Curve',
            data: generateCurvePoints(result),
            borderColor: 'rgb(255, 99, 132)',
            type: 'line',
            fill: false
          }]
        },
        options: {
          plugins: {
            zoom: {
              zoom: { wheel: { enabled: true }, pinch: { enabled: true } },
              pan: { enabled: true }
            }
          }
        }
      });
    }

    function generateCurvePoints(result) {
      const points = [];
      for (let x = 0; x <= 10; x += 0.1) {
        points.push({ x, y: evaluateModel(x, result) });
      }
      return points;
    }

    function evaluateModel(x, result) {
      switch (result.model) {
        case 'linear': return result.coefficients[0] + result.coefficients[1] * x;
        case 'exponential': return result.coefficients[0] * Math.exp(result.coefficients[1] * x);
        case 'logarithmic': return result.coefficients[0] + result.coefficients[1] * Math.log(x);
        case 'power': return result.coefficients[0] * Math.pow(x, result.coefficients[1]);
        case 'polynomial': return result.coefficients.reduce((sum, c, i) => sum + c * Math.pow(x, i), 0);
      }
    }

    htmx.on('htmx:afterRequest', (evt) => {
      if (evt.detail.target.id === 'chart-container') {
        const response = JSON.parse(evt.detail.xhr.response);
        initChart(response.data, response.result);
      }
    });

    initChart(${JSON.stringify(data)}, ${JSON.stringify(result)});
  </script>
</body>
</html>`;
}
