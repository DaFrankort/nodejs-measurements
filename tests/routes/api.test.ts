import request from "supertest";
import { app } from "../../src/app";
import { MeasurementSeeder } from "../utils/seeders";
import { Measurement, MeasurementFilter } from "../../src/types/measurement";

jest.mock("../../src/services/measurements", () => {
  return {
    MeasurementService: jest.fn().mockImplementation(() => {
      return {
        create: jest.fn(),
        createMany: jest.fn(),
        findAll: jest.fn(),
        getStats: jest.fn(),
        // add future functions to mock here
      };
    }),
  };
});

describe("Measurement API Endpoints", () => {
  afterAll(() => {
    jest.clearAllMocks();
  });

  test("POST /api/measurements should create a measurement when single measurement is provided", async () => {
    const measurement: Measurement = MeasurementSeeder.generate();
    const response = await request(app).post("/api/measurements").send(measurement);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.id).toBe(measurement.id);
  });

  test("POST /api/measurements should create a measurement when many measurements are provided", async () => {
    const measurements: Array<Measurement> = MeasurementSeeder.generateMany(3);
    const response = await request(app).post("/api/measurements").send(measurements);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
  });

  test("GET /api/measurements should return all measurements", async () => {
    const filter: MeasurementFilter = {};
    const response = await request(app).get("/api/measurements").query(filter);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  test("GET /api/measurements/stats should return aggregated stats", async () => {
    const filter: MeasurementFilter = {};
    const response = await request(app).get("/api/measurements/stats").query(filter);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
