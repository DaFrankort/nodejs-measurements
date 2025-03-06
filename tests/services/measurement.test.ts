import { Database } from "sqlite3";
import { measurementTable } from "../../src/models/measurement";
import { MeasurementService } from "../../src/services/measurements";
import { Measurement } from "../../src/types/measurement";
import { MeasurementSeeder } from "../utils/seeders";

describe("MeasurementService create() and createMany() tests", () => {
  /*** CONFIG ***/
  let db: Database;
  let measurementService: MeasurementService;

  beforeAll(async () => {
    // In-memory database for testing purposes.
    db = new Database(":memory:");
    await measurementTable.create(db);

    measurementService = new MeasurementService(db);
  });

  afterAll(() => {
    db.close();
  });

  /*** TESTS ***/
  it("should succesfully add a single measurement to the database.", async () => {
    const measurement = MeasurementSeeder.generate();

    await measurementService.create(measurement);

    const row: Measurement = await getMeasurementRow(db, measurement);
    expect(row).toBeTruthy();
    expect(row.id).toBe(measurement.id);
    expect(row.meterID).toBe(measurement.meterID);
    expect(row.timestamp).toBe(measurement.timestamp);
    expect(row.type).toBe(measurement.type);
    expect(row.value).toBe(measurement.value);
  });

  it("should succesfully add multiple measurements to the database.", async () => {
    const measurements = MeasurementSeeder.generateMany(10);

    // Create all measurements and wait for them to be done
    let promises: Array<Promise<void>> = measurements.map((measurement) => measurementService.create(measurement));
    await Promise.all(promises);

    for (const measurement of measurements) {
      const row: Measurement = await getMeasurementRow(db, measurement);

      expect(row).toBeTruthy();
      expect(row.id).toBe(measurement.id);
      expect(row.meterID).toBe(measurement.meterID);
      expect(row.timestamp).toBe(measurement.timestamp);
      expect(row.type).toBe(measurement.type);
      expect(row.value).toBe(measurement.value);
    }
  });
});

/*
 * Helper functions
 */
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
