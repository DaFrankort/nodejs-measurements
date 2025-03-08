import { MeasurementService } from "../../src/services/measurements";
import { MeasurementController } from "../../src/controllers/measurement";
import { MeasurementSeeder } from "../utils/seeders";
import { Database } from "sqlite3";
import { MeasurementStats } from "../../src/types/measurement";

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

async function setupTestDatabaseAndController() {
  const db = new Database(":memory:");

  const mockMeasurementService = new MeasurementService(db) as jest.Mocked<MeasurementService>;
  const measurementController = new MeasurementController(mockMeasurementService);

  return { db, mockMeasurementService, measurementController };
}

function resetMockRequestAndResponse() {
  const mockRequest = {
    body: {},
  };

  const mockResponse = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };

  return { mockRequest, mockResponse };
}

function expectStatus400(res: Response) {
  expect(res.status).toHaveBeenCalledWith(400);
  expect(res.json).toHaveBeenCalledWith(
    expect.objectContaining({
      success: false,
      message: expect.any(String),
    })
  );
}

function expectStatus200(res: Response, responseValue: any = null) {
  expect(res.status).toHaveBeenCalledWith(200);

  if (responseValue !== null) {
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: expect.any(String),
        response: responseValue,
      })
    );
    return;
  }

  expect(res.json).toHaveBeenCalledWith(
    expect.objectContaining({
      success: true,
      message: expect.any(String),
    })
  );
}

describe("MeasurementController create()", () => {
  /*** CONFIG ***/
  let db: Database;
  let measurementController: MeasurementController;
  let mockRequest: Partial<Request> | any;
  let mockResponse: Partial<Response> | any;
  let mockMeasurementService: jest.Mocked<MeasurementService>;

  beforeAll(async () => {
    ({ db, mockMeasurementService, measurementController } = await setupTestDatabaseAndController());
  });

  beforeEach(() => {
    ({ mockRequest, mockResponse } = resetMockRequestAndResponse());

    mockMeasurementService.create.mockClear();
    mockMeasurementService.createMany.mockClear();
  });

  afterAll(() => {
    db.close();
    jest.clearAllMocks();
  });

  /*** TESTS ***/
  describe("Single Measurement", () => {
    it("should successfully handle a single valid measurement and return status 201", async () => {
      mockRequest.body = MeasurementSeeder.generate();

      await measurementController.create(mockRequest, mockResponse);

      expect(mockMeasurementService.create).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.any(String),
          id: mockRequest.body.id,
        })
      );
    });

    test.each([
      ["without timestamp", "timestamp"],
      ["without value", "value"],
      ["without meterID", "meterID"],
      ["without type", "type"],
    ])("should not allow a measurement %s to be stored", async (_, field) => {
      mockRequest.body = MeasurementSeeder.generate();
      delete mockRequest.body[field];

      await measurementController.create(mockRequest, mockResponse);

      expectStatus400(mockResponse);
    });
  });

  describe("Multiple Measurements", () => {
    it("should succesfully handle multiple valid measurements and return status 201.", async () => {
      mockRequest.body = MeasurementSeeder.generateMany(10);

      await measurementController.create(mockRequest, mockResponse);

      expect(mockMeasurementService.createMany).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.any(String),
          failedCount: 0,
          errors: undefined,
        })
      );
    });

    it("should respond with status 201 if at least one measurement was valid", async () => {
      mockRequest.body = MeasurementSeeder.generateMany(5);
      mockRequest.body[0].timestamp = undefined;
      mockRequest.body[1].value = undefined;
      mockRequest.body[2].meterID = undefined;
      mockRequest.body[3].type = undefined;

      await measurementController.create(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.any(String),
          failedCount: expect.any(Number),
          errors: expect.any(Array),
        })
      );
    });

    it("should respond with status 400 if all measurements fail validation", async () => {
      mockRequest.body = MeasurementSeeder.generateMany(4);
      mockRequest.body[0].timestamp = undefined;
      mockRequest.body[1].value = undefined;
      mockRequest.body[2].meterID = undefined;
      mockRequest.body[3].type = undefined;

      await measurementController.create(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.any(String),
          errors: expect.any(Array),
        })
      );
    });
  });
});

describe("MeasurementController findAll()", () => {
  /*** CONFIG ***/
  let db: Database;
  let measurementController: MeasurementController;
  let mockRequest: Partial<Request> | any;
  let mockResponse: Partial<Response> | any;
  let mockMeasurementService: jest.Mocked<MeasurementService>;

  beforeAll(async () => {
    ({ db, mockMeasurementService, measurementController } = await setupTestDatabaseAndController());
  });

  beforeEach(() => {
    ({ mockRequest, mockResponse } = resetMockRequestAndResponse());

    mockMeasurementService.findAll.mockClear();
    mockMeasurementService.findAll.mockResolvedValue(MeasurementSeeder.generateMany(3));
  });

  afterAll(() => {
    db.close();
    jest.clearAllMocks();
  });

  /*** TESTS ***/
  describe("Successful requests", () => {
    test.each([
      ["without filters", {}],
      ["with a valid startDate", { startDate: new Date().toISOString() }],
      ["with a valid endDate", { endDate: new Date().toISOString() }],
      ["with a valid meterID", { meterID: "ID123" }],
      ["with a valid type", { type: "production" }],
      ["with a valid page", { page: 1 }],
      ["with a valid limit", { limit: 25 }],
    ])("should successfully fetch data %s and return status 200", async (_, body) => {
      mockRequest.body = body;

      await measurementController.findAll(mockRequest, mockResponse);

      expect(mockMeasurementService.findAll).toHaveBeenCalled();
      expectStatus200(mockResponse);
    });
  });

  describe("Failed requests", () => {
    test.each([
      ["invalid startDate", { startDate: new Date().toUTCString() }],
      ["invalid endDate", { endDate: new Date().toUTCString() }],
      ["invalid meterID", { meterID: 123 }],
      ["invalid type", { type: "not a valid type" }],
      ["invalid page", { page: "not a valid type" }],
      ["invalid limit", { limit: "not a valid type" }],
    ])("should fail to fetch data with %s and return status 400", async (_, body) => {
      mockRequest.body = body;

      await measurementController.findAll(mockRequest, mockResponse);

      expect(mockMeasurementService.findAll).not.toHaveBeenCalled();
      expectStatus400(mockResponse);
    });
  });
});

describe("MeasurementController getStats()", () => {
  /*** CONFIG ***/
  let db: Database;
  let measurementController: MeasurementController;
  let mockRequest: Partial<Request> | any;
  let mockResponse: Partial<Response> | any;
  let mockMeasurementService: jest.Mocked<MeasurementService>;
  let mockStats: MeasurementStats;

  beforeAll(async () => {
    ({ db, mockMeasurementService, measurementController } = await setupTestDatabaseAndController());
  });

  beforeEach(() => {
    ({ mockRequest, mockResponse } = resetMockRequestAndResponse());

    mockStats = {
      count: 0,
      sum: 0,
      average: 0,
      min: 0,
      max: 0,
    };
    mockMeasurementService.getStats.mockClear();
    mockMeasurementService.getStats.mockResolvedValue(mockStats);
  });

  afterAll(() => {
    db.close();
    jest.clearAllMocks();
  });

  /*** TESTS ***/
  describe("Successful requests", () => {
    test.each([
      ["without filters", {}],
      ["with a valid startDate", { startDate: new Date().toISOString() }],
      ["with a valid endDate", { endDate: new Date().toISOString() }],
      ["with a valid meterID", { meterID: "ID123" }],
      ["with a valid type", { type: "production" }],
    ])("should successfully fetch stats %s and return status 200", async (_, body) => {
      mockRequest.body = body;

      await measurementController.getStats(mockRequest, mockResponse);

      expect(mockMeasurementService.getStats).toHaveBeenCalled();
      expectStatus200(mockResponse, mockStats);
    });
  });

  describe("Failed requests", () => {
    test.each([
      ["invalid startDate", { startDate: new Date().toUTCString() }],
      ["invalid endDate", { endDate: new Date().toUTCString() }],
      ["invalid meterID", { meterID: 123 }],
      ["invalid type", { type: "not a valid type" }],
    ])("should fail to fetch stats with %s and return status 400", async (_, body) => {
      mockRequest.body = body;

      await measurementController.getStats(mockRequest, mockResponse);

      expect(mockMeasurementService.getStats).not.toHaveBeenCalled();
      expectStatus400(mockResponse);
    });
  });
});
