import { Database } from "sqlite3";
import { Measurement, MeasurementFilter, MeasurementStats } from "../types/measurement";
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

      // TODO Change forEach to for(measurement of measurements), more readable
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
  public async findAll(filter: MeasurementFilter): Promise<Array<Measurement>> {
    console.log("Finding measurements with filter:", filter);
    let query = `SELECT * FROM ${measurementTable.name}`;
    let queryValues: Array<any> = [];
    let queryStatements: Array<string> = [];

    function addParameterToFilterIfExists(parameter: any, queryToAdd: string) {
      if (parameter) {
        queryStatements.push(queryToAdd);
        queryValues.push(parameter);
      }
    }

    addParameterToFilterIfExists(filter.startDate, "timestamp >= ?");
    addParameterToFilterIfExists(filter.endDate, "timestamp <= ?");
    addParameterToFilterIfExists(filter.meterID, "meterID = ?");
    addParameterToFilterIfExists(filter.type, "type = ?");
    if (queryStatements.length !== 0) {
      query += " WHERE " + queryStatements.join(" AND ");
    }

    // Apply pagination
    const page = filter.page ? filter.page : 1; // Default to page 1
    const limit = filter.limit ? filter.limit : 50; // Default to 50 results per page
    const offset = (page - 1) * limit;
    query += " LIMIT ? OFFSET ?";
    queryValues.push(limit, offset);

    console.log("Executing query:", query, "with params:", queryValues);
    return new Promise((resolve, reject) => {
      this.db.all(query, queryValues, (err: Error | null, rows: Array<Measurement>) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(rows);
      });
    });
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
