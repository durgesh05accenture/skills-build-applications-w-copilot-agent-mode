import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

const app = createApp();

describe('resume customization', () => {
  it('prioritizes matching lines while preserving the original resume and reporting gaps', async () => {
    const resume = 'Alex Example\nBuilt dashboards with React\nDeveloped Python APIs with SQL\nEducation: Example University';
    const response = await request(app).post('/api/resume/customize').send({
      resume,
      jobDescription: 'Seeking Python and SQL development with React and Kubernetes.',
    });
    expect(response.status).toBe(200);
    expect(response.body.tailoredResume).toBe(`Relevant highlights\nDeveloped Python APIs with SQL\nBuilt dashboards with React\n\nOriginal resume\n${resume}`);
    expect(response.body.matchedKeywords).toEqual(['python', 'sql', 'react']);
    expect(response.body.missingKeywords).toContain('kubernetes');
    expect(response.body.tailoredResume).not.toContain('Kubernetes');
  });

  it('returns the original resume when there are no matching terms', async () => {
    const response = await request(app).post('/api/resume/customize').send({ resume: 'Built bridges', jobDescription: 'Python developer' });
    expect(response.status).toBe(200);
    expect(response.body.tailoredResume).toBe('Built bridges');
    expect(response.body.matchedKeywords).toEqual([]);
  });

  it('rejects missing, invalid, and oversized inputs', async () => {
    for (const body of [{}, { resume: ' ', jobDescription: 'developer' }, { resume: [], jobDescription: 'developer' }, { resume: 'x'.repeat(20001), jobDescription: 'developer' }]) {
      const response = await request(app).post('/api/resume/customize').send(body);
      expect(response.status).toBe(400);
      expect(response.body.error).toBeTruthy();
    }
  });
});
