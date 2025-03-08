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

describe("MeasurementController create() tests", () => {
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
  it("should succesfully handle a single valid measurement and return status 201.", async () => {
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

  it("should not allow a measurement without timestamp to be stored.", async () => {
    mockRequest.body = MeasurementSeeder.generate();
    mockRequest.body.timestamp = undefined;

    await measurementController.create(mockRequest, mockResponse);

    expectStatus400(mockResponse);
  });

  it("should not allow a measurement without value to be stored.", async () => {
    mockRequest.body = MeasurementSeeder.generate();
    mockRequest.body.value = undefined;

    await measurementController.create(mockRequest, mockResponse);

    expectStatus400(mockResponse);
  });

  it("should not allow a measurement without meterID to be stored.", async () => {
    mockRequest.body = MeasurementSeeder.generate();
    mockRequest.body.meterID = undefined;

    await measurementController.create(mockRequest, mockResponse);

    expectStatus400(mockResponse);
  });

  it("should not allow a measurement without type to be stored.", async () => {
    mockRequest.body = MeasurementSeeder.generate();
    mockRequest.body.type = undefined;

    await measurementController.create(mockRequest, mockResponse);

    expectStatus400(mockResponse);
  });

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

describe("MeasurementController findAll() tests", () => {
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
  it("should succesfully fetch data without filters and return status 200", async () => {
    mockRequest.body = {};

    await measurementController.findAll(mockRequest, mockResponse);

    expect(mockMeasurementService.findAll).toHaveBeenCalled();
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: expect.any(String),
      })
    );
  });

  // startDate tests
  it("should succesfully fetch data with a valid startDate and return status 200", async () => {
    mockRequest.body = { startDate: new Date().toISOString() };

    await measurementController.findAll(mockRequest, mockResponse);

    expect(mockMeasurementService.findAll).toHaveBeenCalled();
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: expect.any(String),
      })
    );
  });

  it("should fail to fetch data with an invalid startDate and return status 400", async () => {
    mockRequest.body = { startDate: new Date().toUTCString() };

    await measurementController.findAll(mockRequest, mockResponse);

    expect(mockMeasurementService.findAll).not.toHaveBeenCalled();
    expectStatus400(mockResponse);
  });

  // endDate tests
  it("should succesfully fetch data with a valid endDate and return status 200", async () => {
    mockRequest.body = { endDate: new Date().toISOString() };

    await measurementController.findAll(mockRequest, mockResponse);

    expect(mockMeasurementService.findAll).toHaveBeenCalled();
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: expect.any(String),
      })
    );
  });

  it("should fail to fetch data with an invalid endDate and return status 400", async () => {
    mockRequest.body = { endDate: new Date().toUTCString() };

    await measurementController.findAll(mockRequest, mockResponse);

    expect(mockMeasurementService.findAll).not.toHaveBeenCalled();
    expectStatus400(mockResponse);
  });

  // meterID tests
  it("should succesfully fetch data with a valid meterID and return status 200", async () => {
    mockRequest.body = { meterID: "ID123" };

    await measurementController.findAll(mockRequest, mockResponse);

    expect(mockMeasurementService.findAll).toHaveBeenCalled();
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: expect.any(String),
      })
    );
  });

  it("should fail to fetch data with an invalid meterID and return status 400", async () => {
    mockRequest.body = { meterID: 123 };

    await measurementController.findAll(mockRequest, mockResponse);

    expect(mockMeasurementService.findAll).not.toHaveBeenCalled();
    expectStatus400(mockResponse);
  });

  // type tests
  it("should succesfully fetch data with a valid type and return status 200", async () => {
    mockRequest.body = { type: "production" };

    await measurementController.findAll(mockRequest, mockResponse);

    expect(mockMeasurementService.findAll).toHaveBeenCalled();
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: expect.any(String),
      })
    );
  });

  it("should fail to fetch data with an invalid type and return status 400", async () => {
    mockRequest.body = { type: "not a valid type" };

    await measurementController.findAll(mockRequest, mockResponse);

    expect(mockMeasurementService.findAll).not.toHaveBeenCalled();
    expectStatus400(mockResponse);
  });

  // page tests
  it("should succesfully fetch data with a valid page and return status 200", async () => {
    mockRequest.body = { page: 1 };

    await measurementController.findAll(mockRequest, mockResponse);

    expect(mockMeasurementService.findAll).toHaveBeenCalled();
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: expect.any(String),
      })
    );
  });

  it("should fail to fetch data with an invalid page and return status 400", async () => {
    mockRequest.body = { page: "not a valid type" };

    await measurementController.findAll(mockRequest, mockResponse);

    expect(mockMeasurementService.findAll).not.toHaveBeenCalled();
    expectStatus400(mockResponse);
  });

  // limit tests
  it("should succesfully fetch data with a valid limit and return status 200", async () => {
    mockRequest.body = { limit: 25 };

    await measurementController.findAll(mockRequest, mockResponse);

    expect(mockMeasurementService.findAll).toHaveBeenCalled();
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: expect.any(String),
      })
    );
  });

  it("should fail to fetch data with an invalid limit and return status 400", async () => {
    mockRequest.body = { limit: "not a valid type" };

    await measurementController.findAll(mockRequest, mockResponse);

    expect(mockMeasurementService.findAll).not.toHaveBeenCalled();
    expectStatus400(mockResponse);
  });
});

describe("MeasurementController getStats() tests", () => {
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
  it("should succesfully fetch stats without filters and return status 200", async () => {
    mockRequest.body = {};

    await measurementController.getStats(mockRequest, mockResponse);

    expect(mockMeasurementService.getStats).toHaveBeenCalled();
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: expect.any(String),
        response: mockStats,
      })
    );
  });

  // // startDate tests
  it("should succesfully fetch stats with a valid startDate and return status 200", async () => {
    mockRequest.body = { startDate: new Date().toISOString() };

    await measurementController.getStats(mockRequest, mockResponse);

    expect(mockMeasurementService.getStats).toHaveBeenCalled();
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: expect.any(String),
        response: mockStats,
      })
    );
  });

  it("should fail to fetch stats with an invalid startDate and return status 400", async () => {
    mockRequest.body = { startDate: new Date().toUTCString() };

    await measurementController.getStats(mockRequest, mockResponse);

    expect(mockMeasurementService.getStats).not.toHaveBeenCalled();
    expectStatus400(mockResponse);
  });

  // // endDate tests
  it("should succesfully fetch stats with a valid endDate and return status 200", async () => {
    mockRequest.body = { endDate: new Date().toISOString() };

    await measurementController.getStats(mockRequest, mockResponse);

    expect(mockMeasurementService.getStats).toHaveBeenCalled();
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: expect.any(String),
        response: mockStats,
      })
    );
  });

  it("should fail to fetch stats with an invalid endDate and return status 400", async () => {
    mockRequest.body = { endDate: new Date().toUTCString() };

    await measurementController.getStats(mockRequest, mockResponse);

    expect(mockMeasurementService.getStats).not.toHaveBeenCalled();
    expectStatus400(mockResponse);
  });

  // // meterID tests
  it("should succesfully fetch stats with a valid meterID and return status 200", async () => {
    mockRequest.body = { meterID: "ID123" };

    await measurementController.getStats(mockRequest, mockResponse);

    expect(mockMeasurementService.getStats).toHaveBeenCalled();
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: expect.any(String),
        response: mockStats,
      })
    );
  });

  it("should fail to fetch stats with an invalid meterID and return status 400", async () => {
    mockRequest.body = { meterID: 123 };

    await measurementController.getStats(mockRequest, mockResponse);

    expect(mockMeasurementService.getStats).not.toHaveBeenCalled();
    expectStatus400(mockResponse);
  });

  // // type tests
  it("should succesfully fetch stats with a valid type and return status 200", async () => {
    mockRequest.body = { type: "production" };

    await measurementController.getStats(mockRequest, mockResponse);

    expect(mockMeasurementService.getStats).toHaveBeenCalled();
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: expect.any(String),
        response: mockStats,
      })
    );
  });

  it("should fail to fetch stats with an invalid type and return status 400", async () => {
    mockRequest.body = { type: "not a valid type" };

    await measurementController.getStats(mockRequest, mockResponse);

    expect(mockMeasurementService.getStats).not.toHaveBeenCalled();
    expectStatus400(mockResponse);
  });
});
