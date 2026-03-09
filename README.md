# regression-simple 📈

**Crunch numbers faster than a calculator on caffeine ☕**  
Simple linear/polynomial regression with prediction intervals and R². Perfect for when you need stats without the bloat.

## 🚀 Features

- Linear & polynomial regression (degree 1-5)
- Prediction intervals at 95% confidence
- R-squared goodness-of-fit
- Weighted data support ⚖️
- **Export results** to JSON or CSV 📄
- **Zero dependencies** 🎉
- Full TypeScript support 🦕
- Tiny footprint (<5KB minified)

## 📦 Installation

bash
bun add regression-simple
# or
npm install regression-simple


## 💻 Quick Start


import { performRegression, exportResults, exportResultsToFile } from 'regression-simple';
import type { DataPoint } from 'regression-simple';

const data: DataPoint[] = [
  { x: 1, y: 2 }, { x: 2, y: 3 }, { x: 3, y: 5 },
  { x: 4, y: 7 }, { x: 5, y: 11 }
];

const result = performRegression(data, {
  degree: 2,
  confidenceLevel: 0.95
});

console.log('Coefficients:', result.coefficients);
console.log('R²:', result.rSquared);


## 📤 Exporting Results

Serialize results to a string:


// Export as JSON string
const json = exportResults(result, { format: 'json', label: 'experiment-1' });
console.log(json);

// Export as CSV string
const csv = exportResults(result, { format: 'csv' });
console.log(csv);


Write directly to a file:


await exportResultsToFile('results.json', result, { format: 'json' });
await exportResultsToFile('results.csv', result, { format: 'csv', label: 'run-42' });


### JSON output example


{
  "label": "experiment-1",
  "coefficients": [0.2857, 0.0857, 0.4286],
  "rSquared": 0.9952,
  "predictionIntervals": [
    { "lower": 1.12, "upper": 3.45 }
  ]
}


### CSV output example


section,index,value
coefficient,0,0.2857
coefficient,1,0.0857
coefficient,2,0.4286
r_squared,0,0.9952

interval_index,lower,upper
0,1.12,3.45


## 📖 API

### `performRegression(data, options?)`

| Parameter | Type | Description |
|-----------|------|-------------|
| `data` | `DataPoint[]` | Array of `{ x, y, weight? }` objects |
| `options.degree` | `number` | Polynomial degree (default: 1) |
| `options.confidenceLevel` | `number` | Confidence level for prediction intervals (e.g. 0.95) |

Returns `RegressionResult` with `coefficients`, `rSquared`, and optional `predictionIntervals`.

### `exportResults(result, options?)`

| Parameter | Type | Description |
|-----------|------|-------------|
| `result` | `RegressionResult` | The regression result to serialize |
| `options.format` | `'json' \| 'csv'` | Output format (default: `'json'`) |
| `options.label` | `string` | Optional label included in output |

Returns a `string` with the serialized result.

### `exportResultsToFile(filePath, result, options?)`

Same as `exportResults` but writes directly to `filePath`. Returns `Promise<void>`.

## 📄 License

MIT
