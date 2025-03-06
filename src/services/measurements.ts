import { Database } from "sqlite3";
import { Measurement, MeasurementFilter, MeasurementStats } from "../types/measurement";
import {} from "module";
import { measurementTable } from "../models/measurement";

export class MeasurementService {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  /**
   * Create a single measurement record
   */
  public async create(measurement: Measurement): Promise<void> {
    console.log("Creating measurement:", measurement);

    const query = `INSERT INTO ${measurementTable.name} (id, timestamp, value, meterID, type) VALUES (?, ?, ?, ?, ?);`;
    const values = [measurement.id, measurement.timestamp, measurement.value, measurement.meterID, measurement.type];

    this.db.run(query, values),
      (err: Error | null) => {
        if (err) {
          console.error("Error inserting data:", err.message);
        }
      };
  }

  /**
   * Create multiple measurement records
   */
  public async createMany(measurements: Measurement[]): Promise<void> {
    console.log(`Creating ${measurements.length} measurements`);

    const query = `INSERT INTO ${measurementTable.name} (id, timestamp, value, meterID, type) VALUES (?, ?, ?, ?, ?);`;

    this.db.serialize(() => {
      const statement = this.db.prepare(query);

      measurements.forEach((measurement) => {
        const values = [
          measurement.id,
          measurement.timestamp,
          measurement.value,
          measurement.meterID,
          measurement.type,
        ];

        statement.run(values, (err: Error | null) => {
          if (err) {
            console.error("Error inserting measurement:", err.message);
          }
        });
      });

      statement.finalize((err: Error | null) => {
        if (err) {
          console.error("Error finalizing statement:", err.message);
        }
      });
    });
  }

  /**
   * Find measurements based on filters
   */
  public async findAll(filter: MeasurementFilter): Promise<Measurement[]> {
    // Implementation would query the database with filters
    console.log("Finding measurements with filter:", filter);
    return [];
  }

  /**
   * Get statistics for measurements matching the filter
   */
  public async getStats(filter: MeasurementFilter): Promise<MeasurementStats> {
    // Implementation would calculate statistics from database records
    console.log("Calculating stats with filter:", filter);
    return {
      count: 0,
      sum: 0,
      average: 0,
      min: 0,
      max: 0,
    };
  }
}
