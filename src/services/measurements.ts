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

    this.db.run(query, values), // TODO Return as promise, like the others
      (err: Error | null) => {
        if (err) {
          console.error("Error inserting data:", err.message);
          return;
        }
      };
  }

  /**
   * Create multiple measurement records
   */
  public async createMany(measurements: Measurement[]): Promise<void> {
    console.log(`Creating ${measurements.length} measurements`);

    const query = `INSERT INTO ${measurementTable.name} (id, timestamp, value, meterID, type) VALUES (?, ?, ?, ?, ?);`;

    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        const statement = this.db.prepare(query);
        const promises: Array<Promise<void>> = [];

        for (const measurement of measurements) {
          const promise = new Promise<void>((resolve, reject) => {
            statement.run(
              [measurement.id, measurement.timestamp, measurement.value, measurement.meterID, measurement.type],
              (err: Error | null) => {
                if (err) {
                  console.error("Error inserting measurement:", err.message);
                  reject(err);
                  return;
                }
                resolve();
              }
            );
          });

          promises.push(promise);
        }

        Promise.all(promises)
          .then(() => {
            statement.finalize((err: Error | null) => {
              if (err) {
                console.error("Error finalizing statement:", err.message);
                reject(err);
              } else {
                resolve();
              }
            });
          })
          .catch(reject);
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

    // Apply filters
    const filterQueryParts = this.buildFilterQuery(filter);
    if (filterQueryParts.conditions.length > 0) {
      query += " WHERE " + filterQueryParts.conditions.join(" AND ");
      queryValues.push(...filterQueryParts.values);
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
          console.error("Error selecting data:", err.message);
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
    console.log("Calculating stats with filter:", filter);
    let query = `SELECT COUNT(*) AS count, SUM(value) AS sum, AVG(value) AS average, MIN(value) AS min, MAX(value) AS max FROM ${measurementTable.name}`;
    let queryValues: Array<any> = [];

    // Apply filters
    const filterQueryParts = this.buildFilterQuery(filter); // TODO -> Refactor into a Query Class (?)
    if (filterQueryParts.conditions.length > 0) {
      query += " WHERE " + filterQueryParts.conditions.join(" AND ");
      queryValues.push(...filterQueryParts.values);
    }

    return new Promise((resolve, reject) => {
      this.db.get(query, queryValues, (err: Error | null, row: any) => {
        if (err) {
          console.error("Error selecting data:", err.message);
          reject(err);
          return;
        }

        resolve({
          count: row?.count ?? 0,
          sum: row?.sum ?? 0,
          average: row?.average ?? 0,
          min: row?.min ?? 0,
          max: row?.max ?? 0,
        });
      });
    });
  }

  /**
   * Helper functions
   */
  private buildFilterQuery(filter: MeasurementFilter): { conditions: string[]; values: any[] } {
    const conditions: string[] = [];
    const values: any[] = [];

    const filterMapping: { [key: string]: any } = {
      "timestamp >= ?": filter.startDate,
      "timestamp <= ?": filter.endDate,
      "meterID = ?": filter.meterID,
      "type = ?": filter.type,
    };

    for (const [condition, value] of Object.entries(filterMapping)) {
      if (value !== undefined && value !== null) {
        conditions.push(condition);
        values.push(value);
      }
    }

    return { conditions, values };
  }
}
