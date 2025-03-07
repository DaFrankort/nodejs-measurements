import request from "supertest";
import { app } from "../../src/app";
import { MeasurementService } from "../../src/services/measurements";
import { MeasurementSeeder } from "../utils/seeders";
import { Measurement, MeasurementFilter, MeasurementStats } from "../../src/types/measurement";

jest.mock("../../src/services/measurements");

describe("Measurement API Endpoints", () => {
  let mockService: jest.Mocked<MeasurementService>;

  beforeEach(() => {
    mockService = {
      create: jest.fn().mockImplementation(),
      createMany: jest.fn().mockImplementation(),
      findAll: jest.fn(),
      getStats: jest.fn(),
    } as unknown as jest.Mocked<MeasurementService>;
  });

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
    const measurements: Array<Measurement> = MeasurementSeeder.generateMany(3);
    mockService.findAll.mockResolvedValue(Promise.resolve(measurements));

    const filter: MeasurementFilter = {};
    const response = await request(app).get("/api/measurements").query(filter);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  test("GET /api/measurements/stats should return aggregated stats", async () => {
    const stats: MeasurementStats = { count: 0, sum: 10, average: 20, min: 30, max: 40 };
    mockService.getStats.mockResolvedValue(Promise.resolve(stats));

    const filter: MeasurementFilter = {};
    const response = await request(app).get("/api/measurements/stats").query(filter);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
