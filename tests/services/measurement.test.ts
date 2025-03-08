import { Database } from "sqlite3";
import { measurementTable } from "../../src/models/measurement";
import { MeasurementService } from "../../src/services/measurements";
import { Measurement, MeasurementFilter, MeasurementStats } from "../../src/types/measurement";
import { MeasurementSeeder } from "../utils/seeders";

/*
 * Helper functions
 */
async function setupTestDatabaseAndService() {
  const db = new Database(":memory:");
  await measurementTable.create(db);
  const measurementService = new MeasurementService(db);

  return { db, measurementService };
}

async function getMeasurementRow(db: Database, measurement: Measurement) {
  return await new Promise<Measurement>((resolve, reject) => {
    db.get(
      `SELECT * FROM ${measurementTable.name} WHERE id = ?`,
      [measurement.id],
      (err: Error | null, rows: Measurement) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      }
    );
  });
}

function getISODateYearAgo() {
  const dateYearAgo = new Date(new Date().setFullYear(new Date().getFullYear() - 1));
  return dateYearAgo.toISOString();
}

function getISODateNextYear() {
  const dateYearAgo = new Date(new Date().setFullYear(new Date().getFullYear() + 1));
  return dateYearAgo.toISOString();
}

function expectMeasurementRow(row: Measurement, measurement: Measurement) {
  expect(row.id).toBe(measurement.id);
  expect(row.meterID).toBe(measurement.meterID);
  expect(row.timestamp).toBe(measurement.timestamp);
  expect(row.type).toBe(measurement.type);
  expect(row.value).toBe(measurement.value);
}

function expectMeasurementStats(
  stats: MeasurementStats,
  count: number,
  sum: number,
  average: number,
  min: number,
  max: number
) {
  expect(stats.count).toBe(count);
  expect(stats.sum).toBeCloseTo(sum);
  expect(stats.average).toBeCloseTo(average);
  expect(stats.min).toBe(min);
  expect(stats.max).toBe(max);
}

describe("MeasurementService create() tests", () => {
  /*** CONFIG ***/
  let db: Database;
  let measurementService: MeasurementService;

  beforeAll(async () => {
    ({ db, measurementService } = await setupTestDatabaseAndService());
  });

  afterAll(() => {
    db.close();
  });

  /*** TESTS ***/
  it("should succesfully add a single measurement to the database.", async () => {
    const measurement = MeasurementSeeder.generate();

    await measurementService.create(measurement);

    const row: Measurement = await getMeasurementRow(db, measurement);
    expectMeasurementRow(row, measurement);
  });
});

describe("MeasurementService createMany() tests", () => {
  /*** CONFIG ***/
  let db: Database;
  let measurementService: MeasurementService;

  beforeAll(async () => {
    ({ db, measurementService } = await setupTestDatabaseAndService());
  });

  afterAll(() => {
    db.close();
  });

  /*** TESTS ***/
  it("should succesfully add multiple measurements to the database.", async () => {
    const measurements = MeasurementSeeder.generateMany(10);

    // Create all measurements and wait for them to be done
    let promises: Array<Promise<void>> = measurements.map((measurement) => measurementService.create(measurement));
    await Promise.all(promises);

    for (const measurement of measurements) {
      const row: Measurement = await getMeasurementRow(db, measurement);
      expectMeasurementRow(row, measurement);
    }
  });
});

describe("MeasurementService findAll() tests", () => {
  /*** CONFIG ***/
  let db: Database;
  let measurementService: MeasurementService;
  let measurements: Array<Measurement>;

  beforeAll(async () => {
    ({ db, measurementService } = await setupTestDatabaseAndService());

    // Fill Database with dummy data
    measurements = MeasurementSeeder.generateMany(20);
    await measurementService.createMany(measurements);
  });

  afterAll(() => {
    db.close();
  });

  /*** TESTS ***/
  it("should succesfully retrieve results from the database without filters", async () => {
    const filter: MeasurementFilter = {};
    const foundMeasurements: Array<Measurement> = await measurementService.findAll(filter);

    expect(foundMeasurements.length).toBeGreaterThan(0);
  });

  // startDate tests
  it("should retrieve results AFTER startDate", async () => {
    const filter: MeasurementFilter = { startDate: getISODateYearAgo() };
    const foundMeasurements: Array<Measurement> = await measurementService.findAll(filter);

    expect(foundMeasurements.length).toBeGreaterThan(0);
  });

  it("should not retrieve results BEFORE startDate", async () => {
    const filter: MeasurementFilter = { startDate: getISODateNextYear() };
    const foundMeasurements: Array<Measurement> = await measurementService.findAll(filter);

    expect(foundMeasurements.length).toBeLessThan(measurements.length);
    expect(foundMeasurements.length).toBe(0);
  });

  // endDate tests
  it("should retrieve results BEFORE endDate", async () => {
    const filter: MeasurementFilter = { endDate: getISODateNextYear() };
    const foundMeasurements: Array<Measurement> = await measurementService.findAll(filter);

    expect(foundMeasurements.length).toBeGreaterThan(0);
  });

  it("should not retrieve results AFTER endDate", async () => {
    const filter: MeasurementFilter = { endDate: getISODateYearAgo() };
    const foundMeasurements: Array<Measurement> = await measurementService.findAll(filter);

    expect(foundMeasurements.length).toBeLessThan(measurements.length);
    expect(foundMeasurements.length).toBe(0);
  });

  // meterID tests
  it("should only return measurements with the matching meterID", async () => {
    const meterID = measurements[0].meterID;
    const filter: MeasurementFilter = { meterID: meterID };
    const foundMeasurements: Array<Measurement> = await measurementService.findAll(filter);

    expect(foundMeasurements.length).toBeLessThan(measurements.length);
    for (const measurement of foundMeasurements) {
      expect(measurement.meterID).toBe(meterID);
    }
  });

  // type tests
  it("should only return measurements with the matching type", async () => {
    const type = measurements[0].type;
    const filter: MeasurementFilter = { type: type };
    const foundMeasurements: Array<Measurement> = await measurementService.findAll(filter);

    expect(foundMeasurements.length).toBeLessThan(measurements.length);
    for (const measurement of foundMeasurements) {
      expect(measurement.type).toBe(type);
    }
  });

  // page tests
  it("should show different results on different pages.", async () => {
    const limit = Math.ceil(measurements.length / 4);

    const firstMeasurements: Array<Measurement> = await measurementService.findAll({ page: 1, limit: limit });
    const secondMeasurements: Array<Measurement> = await measurementService.findAll({ page: 2, limit: limit });

    expect(firstMeasurements.length).toBeGreaterThan(0);
    expect(secondMeasurements.length).toBeGreaterThan(0);
    expect(firstMeasurements).not.toEqual(secondMeasurements);
  });

  // limit tests
  it("should limit the amount of results depending on the limit filter", async () => {
    const limit = Math.ceil(measurements.length / 4);
    const filter: MeasurementFilter = { limit: limit };
    const foundMeasurements: Array<Measurement> = await measurementService.findAll(filter);

    expect(foundMeasurements.length).toBeLessThanOrEqual(limit);
  });
});

describe("MeasurementService findAll() tests", () => {
  /*** CONFIG ***/
  let db: Database;
  let measurementService: MeasurementService;
  let measurements: Array<Measurement>;
  let expectedSum: number;
  let expectedAverage: number;

  beforeAll(async () => {
    ({ db, measurementService } = await setupTestDatabaseAndService());

    // Prepare comparison data
    measurements = MeasurementSeeder.generateMany(5);
    measurements.sort((a, b) => a.value - b.value);
    expectedSum = measurements.reduce((sum, m) => sum + m.value, 0);
    expectedAverage = expectedSum / measurements.length;

    // Fill Database with dummy data
    await measurementService.createMany(measurements);
  });

  afterAll(() => {
    db.close();
  });

  /*** TESTS ***/
  it("should succesfully retrieve stats from the database without filters", async () => {
    const filter: MeasurementFilter = {};
    const stats: MeasurementStats = await measurementService.getStats(filter);

    expectMeasurementStats(
      stats,
      measurements.length,
      expectedSum,
      expectedAverage,
      measurements[0].value,
      measurements[measurements.length - 1].value
    );
  });

  // startDate tests
  it("should retrieve stats AFTER startDate", async () => {
    const filter: MeasurementFilter = { startDate: getISODateYearAgo() };
    const stats: MeasurementStats = await measurementService.getStats(filter);

    expectMeasurementStats(
      stats,
      measurements.length,
      expectedSum,
      expectedAverage,
      measurements[0].value,
      measurements[measurements.length - 1].value
    );
  });

  it("should not retrieve stats BEFORE startDate", async () => {
    const filter: MeasurementFilter = { startDate: getISODateNextYear() };
    const stats: MeasurementStats = await measurementService.getStats(filter);

    expectMeasurementStats(stats, 0, 0, 0, 0, 0);
  });

  // // endDate tests
  it("should retrieve stats BEFORE endDate", async () => {
    const filter: MeasurementFilter = { endDate: getISODateNextYear() };
    const stats: MeasurementStats = await measurementService.getStats(filter);

    expectMeasurementStats(
      stats,
      measurements.length,
      expectedSum,
      expectedAverage,
      measurements[0].value,
      measurements[measurements.length - 1].value
    );
  });

  it("should not retrieve stats AFTER endDate", async () => {
    const filter: MeasurementFilter = { endDate: getISODateYearAgo() };
    const stats: MeasurementStats = await measurementService.getStats(filter);

    expectMeasurementStats(stats, 0, 0, 0, 0, 0);
  });

  // // meterID tests
  it("should only return stats for the matching meterID", async () => {
    const meterID = measurements[0].meterID;
    const filter: MeasurementFilter = { meterID: meterID };
    const stats: MeasurementStats = await measurementService.getStats(filter);

    // Since seeded meterIDs are unique, we can safely assume there are only get stats of one measurement.
    const measurementValue = measurements[0].value;
    expectMeasurementStats(stats, 1, measurementValue, measurementValue, measurementValue, measurementValue);
  });

  // type tests
  it("should only return stats for the matching type", async () => {
    const type = measurements[0].type;
    const filter: MeasurementFilter = { type: type };
    const stats: MeasurementStats = await measurementService.getStats(filter);

    // Prepare expected values
    let expectedMeasurements: Array<Measurement> = [];
    for (const measurement of measurements) {
      if (measurement.type == type) {
        expectedMeasurements.push(measurement);
      }
    }
    const sum = expectedMeasurements.reduce((sum, m) => sum + m.value, 0);
    const average = sum / expectedMeasurements.length;
    const min = expectedMeasurements[0].value;
    const max = expectedMeasurements[expectedMeasurements.length - 1].value;

    expectMeasurementStats(stats, expectedMeasurements.length, sum, average, min, max);
  });
});
