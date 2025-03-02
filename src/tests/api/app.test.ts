import request from "supertest";
import { Express } from "express";
import { createApp } from "../../app";

const TIMEOUT = 10_000;

let server: Express;

describe("server", () => {
  beforeAll(async () => {
    server = await createApp();
  });

  describe("shortest route", () => {
    it(
      "correctly routes from TLL to SFO without ground hops",
      async () => {
        // https://www.greatcirclemap.com/?routes=TLL-TRD-KEF-YEG-SFO
        const response = await request(server).get("/routes/TLL/SFO");
        const routeData = response.body.data || response.body;

        expect(routeData.distance).toBeGreaterThanOrEqual(8900);
        expect(routeData.distance).toBeLessThanOrEqual(9400);
        expect(routeData).toEqual(
          expect.objectContaining({
            source: "TLL",
            destination: "SFO",
          })
        );
        expect([["TLL", "TRD", "KEF", "YEG", "SFO"]]).toContainEqual(
          routeData.hops
        );
      },
      TIMEOUT
    );

    it(
      "correctly routes from HAV to TAY",
      async () => {
        const response = await request(server).get("/routes/HAV/TAY");
        const routeData = response.body.data || response.body;

        expect(routeData.distance).toBeGreaterThanOrEqual(9100);
        expect(routeData.distance).toBeLessThanOrEqual(9200);
        expect(routeData).toEqual(
          expect.objectContaining({
            source: "HAV",
            destination: "TAY",
            hops: ["HAV", "NAS", "JFK", "HEL", "TAY"],
          })
        );
      },
      TIMEOUT
    );
  });

  describe("routes extended via ground", () => {
    it(
      "correctly routes from TLL to SFO with ground hops",
      async () => {
        const response = await request(server).get(
          "/routes/TLL/SFO?with-ground-hops=true"
        );
        const routeData = response.body.data || response.body;

        expect(routeData.distance).toBeGreaterThanOrEqual(8900);
        expect(routeData.distance).toBeLessThanOrEqual(9700);
        expect(routeData).toEqual(
          expect.objectContaining({
            source: "TLL",
            destination: "SFO",
          })
        );
        expect([["TLL", "ARN", "OAK", "SFO"]]).toContainEqual(routeData.hops);
      },
      TIMEOUT
    );

    it(
      "correctly routes from TLL to LHR with ground hops",
      async () => {
        const response = await request(server).get(
          "/routes/TLL/LHR?with-ground-hops=true"
        );
        const routeData = response.body.data || response.body;

        expect(routeData.distance).toBeGreaterThanOrEqual(1800);
        expect(routeData.distance).toBeLessThanOrEqual(1900);
        expect(routeData).toEqual(
          expect.objectContaining({
            source: "TLL",
            destination: "LHR",
          })
        );
        expect([["TLL", "STN", "LHR"]]).toContainEqual(routeData.hops);
      },
      TIMEOUT
    );
  });

  afterAll(async () => {
    await new Promise((resolve) => setTimeout(resolve, 500));
  });
});
