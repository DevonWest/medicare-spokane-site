/**
 * @jest-environment node
 */
import { GET } from '@/app/api/healthz/route';

describe('GET /api/healthz', () => {
  it('returns status ok', async () => {
    const response = await GET();
    const data = await response.json();
    expect(data.status).toBe('ok');
    expect(data.timestamp).toBeDefined();
  });

  it('returns 200 status code', async () => {
    const response = await GET();
    expect(response.status).toBe(200);
  });
});
