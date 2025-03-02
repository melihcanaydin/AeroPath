import request from 'supertest';

import { createApp } from '../../app';

const TIMEOUT = 10_000;

let server: Express.Application;

describe('server', () => {
  beforeAll(async () => {
    server = await createApp();
  });

  describe('shortest route', () => {
    it('correctly routes from TLL to SFO without ground hops', async () => {
      // https://www.greatcirclemap.com/?routes=TLL-TRD-KEF-YEG-SFO
      const response = await request(server).get('/routes/TLL/SFO');
      const body = response.body;

      expect(body.distance).toBeGreaterThanOrEqual(8900);
      expect(body.distance).toBeLessThanOrEqual(9400);
      expect(body).toEqual(expect.objectContaining({
        source: 'TLL',
        destination: 'SFO',
      }));
      expect([
        ['TLL', 'TRD', 'KEF', 'YEG', 'SFO']
      ]).toContainEqual(body.hops);
    }, TIMEOUT);


    it('correctly routes from HAV to TAY', async () => {
      // https://www.greatcirclemap.com/?routes=%20HAV-NAS-JFK-HEL-TAY
      const response = await request(server).get('/routes/HAV/TAY');
      const body = response.body;

      expect(body.distance).toBeGreaterThanOrEqual(9100);
      expect(body.distance).toBeLessThanOrEqual(9200);
      expect(body).toEqual(expect.objectContaining({
        source: 'HAV',
        destination: 'TAY',
        hops: ['HAV', 'NAS', 'JFK', 'HEL', 'TAY'],
      }));
    }, TIMEOUT);
  });

  describe('routes extended via ground', () => {
    it('correctly routes from TLL to SFO with ground hops', async () => {
      // https://www.greatcirclemap.com/?routes=TLL-ARN-OAK-SFO
      const response = await request(server).get('/routes/TLL/SFO?with-ground-hops');
      const body = response.body;

      expect(body.distance).toBeGreaterThanOrEqual(8900);
      expect(body.distance).toBeLessThanOrEqual(9050);
      expect(body).toEqual(expect.objectContaining({
        source: 'TLL',
        destination: 'SFO',
      }));
      expect([
        ['TLL', 'ARN', 'OAK', 'SFO']
      ]).toContainEqual(body.hops);
    }, TIMEOUT);

    it('correctly routes from TLL to LHR with ground hops', async () => {
      // https://www.greatcirclemap.com/?routes=TLL-STN-LHR
      const response = await request(server).get('/routes/TLL/LHR?with-ground-hops');
      const body = response.body;

      expect(body.distance).toBeGreaterThanOrEqual(1800);
      expect(body.distance).toBeLessThanOrEqual(1850);
      expect(body).toEqual(expect.objectContaining({
        source: 'TLL',
        destination: 'LHR',
        hops: ['TLL', 'STN', 'LHR'],
      }));
    }, TIMEOUT);
  });

  describe('Route Finding', () => {
    it('should find a direct route between two airports', async () => {
      const response = await request(server)
        .get('/routes/YYZ/LAX')
        .expect(200);

      expect(response.body).toHaveProperty('route');
      expect(response.body.route).toBeInstanceOf(Array);
    });

    it('should find a route with multiple legs (up to 4)', async () => {
      const response = await request(server)
        .get('/routes/YYZ/HKG')
        .expect(200);

      expect(response.body.route.length).toBeLessThanOrEqual(4);
    });

    it('should return 404 when no route is found', async () => {
      // Using a non-existent airport code that should be valid format but unreachable
      await request(server)
        .get('/routes/YYZ/XYZ')
        .expect(404)
        .expect((res) => {
          expect(res.body.error).toBe('No route found');
        });
    });
  });

  describe('Input Validation', () => {
    it('should return 400 for invalid airport codes', async () => {
      await request(server)
        .get('/routes/INVALID/LAX')
        .expect(400)
        .expect((res) => {
          expect(res.body.error).toBe('Invalid airport code format');
        });
    });

    it('should return 400 when airport codes are the same', async () => {
      await request(server)
        .get('/routes/LAX/LAX')
        .expect(400)
        .expect((res) => {
          expect(res.body.error).toBe('Origin and destination cannot be the same');
        });
    });
  });

  describe('Ground Hops Feature', () => {
    it('should consider ground transportation when with-ground-hops=true', async () => {
      const response = await request(server)
        .get('/routes/YYZ/LAX?with-ground-hops=true')
        .expect(200);

      expect(response.body).toHaveProperty('route');
      // Additional assertions for ground hops could be added here
    });
  });

  describe('Performance Tests', () => {
    it('should cache and return routes quickly on subsequent requests', async () => {
      // First request
      const start = Date.now();
      await request(server).get('/routes/YYZ/LAX');
      const firstDuration = Date.now() - start;

      // Second request (should be faster due to caching)
      const cachedStart = Date.now();
      await request(server).get('/routes/YYZ/LAX');
      const secondDuration = Date.now() - cachedStart;

      expect(secondDuration).toBeLessThan(firstDuration);
    });

    it('should handle concurrent requests efficiently', async () => {
      const requests = Array(10).fill(null).map(() => 
        request(server).get('/routes/YYZ/LAX')
      );

      const responses = await Promise.all(requests);
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle disconnected airports appropriately', async () => {
      // Assuming we have a known disconnected airport in our test data
      await request(server)
        .get('/routes/DISCONNECTED/LAX')
        .expect(404)
        .expect((res) => {
          expect(res.body.error).toBe('No route found');
        });
    });

    it('should respect the maximum of 4 legs limit', async () => {
      const response = await request(server)
        .get('/routes/YYZ/SYD') // Assuming this requires a complex route
        .expect(200);

      expect(response.body.route.length).toBeLessThanOrEqual(4);
    });
  });

  describe('error handling', () => {
    it('returns 404 for invalid airport codes', async () => {
      const response = await request(server).get('/routes/INVALID/SFO');
      expect(response.status).toBe(404);
      expect(response.text).toContain('No such airport');
    });

    it('returns 404 when no route is found', async () => {
      // Assuming these airports exist but have no connecting route
      const response = await request(server).get('/routes/JFK/XYZ');
      expect(response.status).toBe(404);
      expect(response.text).toContain('No route found');
    });

    it('handles maximum leg constraint', async () => {
      const response = await request(server).get('/routes/TLL/SFO');
      expect(response.body.hops.length).toBeLessThanOrEqual(5); // 4 legs = 5 airports
    });
  });

  describe('ground hops feature', () => {
    it('finds shorter route with ground transportation', async () => {
      const withoutGround = await request(server).get('/routes/TLL/SFO');
      const withGround = await request(server).get('/routes/TLL/SFO?with-ground-hops');
      
      expect(withGround.body.distance).toBeLessThanOrEqual(withoutGround.body.distance);
    });
  });
});
