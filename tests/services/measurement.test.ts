import { Database } from "sqlite3";
import { MeasurementService, MeasurementTable } from "../../src/services/measurements";
import { Measurement, MeasurementFilter, MeasurementStats } from "../../src/types/measurement";
import { MeasurementSeeder } from "../utils/seeders";

/*
 * Helper functions
 */
async function setupTestDatabaseAndService() {
  const db = new Database(":memory:");
  await MeasurementTable.create(db);
  const measurementService = new MeasurementService(db);

  return { db, measurementService };
}

async function getMeasurementRow(db: Database, measurement: Measurement) {
  return await new Promise<Measurement>((resolve, reject) => {
    db.get(
      `SELECT * FROM ${MeasurementTable.name} WHERE id = ?`,
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

const getExpectedStats = (filteredMeasurements: Measurement[]) => {
  const sum = filteredMeasurements.reduce((acc, m) => acc + m.value, 0);
  const average = sum / (filteredMeasurements.length || 1);
  const min = filteredMeasurements.length ? filteredMeasurements[0].value : 0;
  const max = filteredMeasurements.length ? filteredMeasurements[filteredMeasurements.length - 1].value : 0;

  return { count: filteredMeasurements.length, sum, average, min, max };
};

describe("MeasurementService create()", () => {
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

describe("MeasurementService createMany()", () => {
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

describe("MeasurementService findAll()", () => {
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

  describe("Filtered stats retrieval", () => {
    test.each([
      ["AFTER startDate", { startDate: getISODateYearAgo() }, true],
      ["BEFORE startDate", { startDate: getISODateNextYear() }, false],
      ["BEFORE endDate", { endDate: getISODateNextYear() }, true],
      ["AFTER endDate", { endDate: getISODateYearAgo() }, false],
    ])("should retrieve results %s", async (_, filter, shouldFind) => {
      const foundMeasurements = await measurementService.findAll(filter);
      expect(foundMeasurements.length > 0).toBe(shouldFind);
    });

    it("should only return measurements with the matching meterID", async () => {
      const meterID = measurements[0].meterID;
      const foundMeasurements = await measurementService.findAll({ meterID });

      expect(foundMeasurements.every((m) => m.meterID === meterID)).toBe(true);
    });

    it("should only return measurements with the matching type", async () => {
      const type = measurements[0].type;
      const foundMeasurements = await measurementService.findAll({ type });

      expect(foundMeasurements.every((m) => m.type === type)).toBe(true);
    });
  });

  describe("Pagination and Limits", () => {
    it("should return different results on different pages", async () => {
      const limit = Math.ceil(measurements.length / 4);

      const page1 = await measurementService.findAll({ page: 1, limit });
      const page2 = await measurementService.findAll({ page: 2, limit });

      expect(page1.length).toBeGreaterThan(0);
      expect(page2.length).toBeGreaterThan(0);
      expect(page1).not.toEqual(page2);
    });

    it("should limit the number of results", async () => {
      const limit = Math.ceil(measurements.length / 4);
      const foundMeasurements = await measurementService.findAll({ limit });

      expect(foundMeasurements.length).toBeLessThanOrEqual(limit);
    });
  });
});

describe("MeasurementService getStats()", () => {
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
  it("should successfully retrieve stats from the database without filters", async () => {
    const stats = await measurementService.getStats({});

    expectMeasurementStats(
      stats,
      measurements.length,
      expectedSum,
      expectedAverage,
      measurements[0].value,
      measurements[measurements.length - 1].value
    );
  });

  describe("Filtered stats retrieval", () => {
    test.each([
      ["AFTER startDate", { startDate: getISODateYearAgo() }, () => measurements],
      ["BEFORE endDate", { endDate: getISODateNextYear() }, () => measurements],
      ["NO results AFTER endDate", { endDate: getISODateYearAgo() }, () => []],
      ["NO results BEFORE startDate", { startDate: getISODateNextYear() }, () => []],
    ])("should retrieve stats %s", async (_, filter, expectedFn) => {
      const expected = expectedFn();
      const { count, sum, average, min, max } = getExpectedStats(expected);
      const stats = await measurementService.getStats(filter);

      expectMeasurementStats(stats, count, sum, average, min, max);
    });

    it("should only return stats for the matching meterID", async () => {
      const meterID = measurements[0].meterID;
      const filteredMeasurements = measurements.filter((m) => m.meterID === meterID);
      const { count, sum, average, min, max } = getExpectedStats(filteredMeasurements);

      const stats = await measurementService.getStats({ meterID });

      expectMeasurementStats(stats, count, sum, average, min, max);
    });

    it("should only return stats for the matching type", async () => {
      const type = measurements[0].type;
      const filteredMeasurements = measurements.filter((m) => m.type === type);
      const { count, sum, average, min, max } = getExpectedStats(filteredMeasurements);

      const stats = await measurementService.getStats({ type });

      expectMeasurementStats(stats, count, sum, average, min, max);
    });
  });
});
