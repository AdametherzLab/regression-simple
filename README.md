# regression-simple 📈

**Crunch numbers faster than a calculator on caffeine ☕**  
Simple linear/polynomial regression with prediction intervals and R². Perfect for when you need stats without the bloat.

## 🚀 Features

- Linear & polynomial regression (degree 1-5)
- Prediction intervals at 95% confidence
- R-squared goodness-of-fit
- Weighted data support ⚖️
- **Zero dependencies** 🎉
- Full TypeScript support 🦕
- Tiny footprint (<5KB minified)

## 📦 Installation

```bash
bun add regression-simple
# or
npm install regression-simple
```

## 💻 Quick Start

```typescript
// REMOVED external import: import { performRegression, type DataPoint } from 'regression-simple';

// Your data points (x, y)
const data: DataPoint[] = [
  [1, 2], [2, 3], [3, 5], 
  [4, 7], [5, 11]
];

// Run regression with options
const result = performRegression(data, {
  degree: 2, // Polynomial degree (1 = linear)
  predictionInterval: 0.95 // Generate prediction band
});

console.log(`Equation: y = ${result.equation}`);
console.log(`R²: ${result.rSquared.toFixed(3)}`);
console.log(`Next prediction: ${result.predict(6).toFixed(2)}`);
```

## 📖 API Guide

### `performRegression(data, options?)`
**The brains of the operation** 🧠

| Param       | Type              | Description                     |
|-------------|-------------------|---------------------------------|
| data        | `DataPoint[]`     | Array of [x, y] tuples          |
| options     | `RegressionOptions` | Configuration (see below)       |

**Options (`RegressionOptions`):**
```typescript
{
  degree?: number;          // Polynomial degree (default: 1)
  weights?: WeightedArray;  // Array of [x, y, weight] tuples
  predictionInterval?: number; // 0-1 value (e.g., 0.95 for 95% band)
}
```

**Returns `RegressionResult`:**
```typescript
{
  equation: string;         // "y = ax + b" or "y = ax² + bx + c"
  coefficients: number[];   // [a, b] or [a, b, c] etc.
  rSquared: number;         // Goodness-of-fit (0-1)
  predict: (x: number) => number; // Prediction function
  predictionBand?: PredictionInterval[]; // [lower, upper] tuples
}
```

## 🧪 More Examples

**Weighted Regression:**
```typescript
const weightedData: WeightedArray = [
  [1, 2, 0.5], // Third value is weight
  [2, 3, 1.0],
  [3, 5, 2.0]
];

const result = performRegression(weightedData, {
  degree: 1,
  predictionInterval: 0.9
});
```

**Access Raw Outputs:**
```typescript
const { coefficients, rSquared } = performRegression(data);

console.log(`Slope: ${coefficients[0]}`);
console.log(`Intercept: ${coefficients[1]}`);
console.log(`Accuracy: ${(rSquared * 100).toFixed(1)}%`);
```

## 🤝 Contributing

Found a bug? Have an idea? Let's make this better together!  
🐛 [Open an issue](https://github.com/AdametherzLab/regression-simple/issues)  
🛠️ [Submit a PR](https://github.com/AdametherzLab/regression-simple/pulls)

## 📄 License

MIT © [AdametherzLab](https://github.com/AdametherzLab)  
Made with ❤️ and enough coffee to power a small nation