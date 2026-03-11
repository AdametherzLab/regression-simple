import { Hono } from 'hono';
import { performRegression } from './regression';
import { plotRegression } from './plotter';
import type { DataPoint, RegressionOptions } from './types';

const app = new Hono();
let dataset: DataPoint[] = [];
let currentOptions: RegressionOptions = { model: 'linear' };

app.get('/', (c) => {
  try {
    const result = performRegression(dataset, currentOptions);
    return c.html(plotRegression(dataset, result, { interactive: true }));
  } catch (error) {
    return c.html(`<div class="error">${error.message}</div>`);
  }
});

app.post('/update', async (c) => {
  const formData = await c.req.formData();
  
  // Update data points
  const newData = [...dataset];
  Array.from(formData.entries()).forEach(([key, value]) => {
    const match = key.match(/x_(\d+)/);
    if (match) {
      const i = parseInt(match[1]);
      newData[i] = { ...newData[i], x: parseFloat(value as string) };
    }
  });

  Array.from(formData.entries()).forEach(([key, value]) => {
    const match = key.match(/y_(\d+)/);
    if (match) {
      const i = parseInt(match[1]);
      newData[i] = { ...newData[i], y: parseFloat(value as string) };
    }
  });

  // Update regression options
  currentOptions = {
    model: formData.get('model') as any,
    degree: formData.has('degree') ? parseInt(formData.get('degree') as string) : undefined
  };

  dataset = newData;
  const result = performRegression(dataset, currentOptions);
  return c.json({ data: dataset, result });
});

app.put('/point', (c) => {
  dataset = [...dataset, { x: 0, y: 0 }];
  return c.html(dataset.map((d, i) => `
    <tr>
      <td><input type="number" name="x_${i}" value="${d.x}" step="0.1" hx-post="/update"></td>
      <td><input type="number" name="y_${i}" value="${d.y}" step="0.1" hx-post="/update"></td>
      <td><button hx-delete="/point/${i}">×</button></td>
    </tr>`).join('')
  );
});

app.delete('/point/:index', (c) => {
  const index = parseInt(c.req.param('index'));
  dataset = dataset.filter((_, i) => i !== index);
  return c.html('');
});

export default app;
