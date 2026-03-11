import { describe, it, expect } from 'bun:test';
import app from '../src/server';

describe('Interactive Plotter Server', () => {
  it('should initialize with default dataset', async () => {
    const res = await app.request('/');
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('Regression Plot');
  });

  it('should add data points', async () => {
    const req = new Request('http://localhost/point', { method: 'PUT' });
    const res = await app.request(req);
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('name="x_0"');
  });

  it('should update regression model', async () => {
    const form = new FormData();
    form.append('model', 'exponential');
    
    const req = new Request('http://localhost/update', {
      method: 'POST',
      body: form
    });
    
    const res = await app.request(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.result.model).toBe('exponential');
  });
});
