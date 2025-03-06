import { MeasurementService } from "../../src/services/measurements";
import { MeasurementController } from "../../src/controllers/measurement";
import { MeasurementSeeder } from "../utils/seeders";
import { Database } from "sqlite3";

jest.mock("../../src/services/measurements", () => {
  return {
    MeasurementService: jest.fn().mockImplementation(() => {
      return {
        create: jest.fn(),
        createMany: jest.fn(),
      };
    }),
  };
});

describe("MeasurementController create() function tests", () => {
  /*** CONFIG ***/
  let db: Database;
  let measurementController: MeasurementController;
  let mockRequest: Partial<Request> | any;
  let mockResponse: Partial<Response> | any;
  let mockMeasurementService: jest.Mocked<MeasurementService>;

  beforeAll(() => {
    db = new Database(":memory:");

    mockMeasurementService = new MeasurementService(db) as jest.Mocked<MeasurementService>;
    measurementController = new MeasurementController(mockMeasurementService);
  });

  beforeEach(() => {
    mockRequest = {
      body: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

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

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.any(String),
      })
    );
  });

  it("should not allow a measurement without value to be stored.", async () => {
    mockRequest.body = MeasurementSeeder.generate();
    mockRequest.body.value = undefined;

    await measurementController.create(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.any(String),
      })
    );
  });

  it("should not allow a measurement without meterID to be stored.", async () => {
    mockRequest.body = MeasurementSeeder.generate();
    mockRequest.body.meterID = undefined;

    await measurementController.create(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.any(String),
      })
    );
  });

  it("should not allow a measurement without type to be stored.", async () => {
    mockRequest.body = MeasurementSeeder.generate();
    mockRequest.body.type = undefined;

    await measurementController.create(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.any(String),
      })
    );
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
