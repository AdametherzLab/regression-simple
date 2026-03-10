# regression-simple 📈

**Crunch numbers faster than a calculator on caffeine ☕**  
Simple regression library with support for linear, polynomial, exponential, logarithmic, power, and logistic models. Includes prediction intervals and R². Perfect for when you need stats without the bloat.

## 🚀 Features

- **Multiple regression models**:
  - Linear & polynomial regression (degree 1-5)
  - Exponential (y = aeᵇˣ)
  - Logarithmic (y = a + b lnx)
  - Power law (y = axᵇ)
  - Logistic regression 
- Prediction intervals at custom confidence levels
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

// Polynomial example
const data: DataPoint[] = [
  { x: 1, y: 2 }, { x: 2, y: 3 }, { x: 3, y: 5 },
  { x: 4, y: 7 }, { x: 5, y: 11 }
];

const result = performRegression(data, {
  degree: 2,
  confidenceLevel: 0.95
});

console.log('Coefficients:', result.coefficients);
console.log('R-squared:', result.rSquared);

// Exponential example
const expData = [
  { x: 1, y: 5.436 }, 
  { x: 2, y: 14.778 }, 
  { x: 3, y: 40.171 }
];
const expResult = performRegression(expData, { 
  model: 'exponential'
});
console.log('Exponential Coefficients:', expResult.coefficients);

// Export results
const json = exportResults(result, { format: 'json' });
await exportResultsToFile('results.json', result);
