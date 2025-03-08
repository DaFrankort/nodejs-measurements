import { Database } from "sqlite3";
import { Measurement, MeasurementFilter, MeasurementStats } from "../types/measurement";
import { Table } from "../utils/database";
import { DatabaseError } from "../utils/errors";

export const MeasurementTable = new Table("measurements", [
  "id TEXT PRIMARY KEY", // Unique UUID
  "timestamp TEXT NOT NULL", // Timestamp of measurement (ISO 8601 FORMAT)
  "value REAL NOT NULL", // energy value (kWh)
  "meterID STRING NOT NULL", // Smart meter ID that took measurement
  "type TEXT NOT NULL", // Type of measurement (e.g., 'production', 'consumption')
]);

export class MeasurementQueryBuilder {
  query: string;
  values: Array<any>;

  constructor() {
    this.query = "";
    this.values = [];
  }

  buildMeasurementInsert(measurement: Measurement) {
    this.query = `INSERT INTO ${MeasurementTable.name} (id, timestamp, value, meterID, type) VALUES (?, ?, ?, ?, ?);`;
    this.values = [measurement.id, measurement.timestamp, measurement.value, measurement.meterID, measurement.type];
  }

  buildMeasurementSelect(filter: MeasurementFilter) {
    this.query = `SELECT * FROM ${MeasurementTable.name}`;
    this.applyFilters(filter);
    this.applyPagination(filter);
  }

  buildStatsSelect(filter: MeasurementFilter) {
    this.query = `SELECT COUNT(*) AS count, SUM(value) AS sum, AVG(value) AS average, MIN(value) AS min, MAX(value) AS max FROM ${MeasurementTable.name}`;
    this.applyFilters(filter);
  }

  private applyFilters(filter: MeasurementFilter) {
    const conditions: string[] = [];
    const filterMapping: { [key: string]: any } = {
      "timestamp >= ?": filter.startDate,
      "timestamp <= ?": filter.endDate,
      "meterID = ?": filter.meterID,
      "type = ?": filter.type,
    };

    for (const [condition, value] of Object.entries(filterMapping)) {
      if (value !== undefined && value !== null) {
        conditions.push(condition);
        this.values.push(value);
      }
    }

    if (conditions.length > 0) {
      this.query += " WHERE " + conditions.join(" AND ");
    }
  }

  private applyPagination(filter: MeasurementFilter) {
    let page = filter.page ? filter.page : 1; // Default to page 1
    page = Math.max(page, 1); // Min page is 1

    let limit = filter.limit ? filter.limit : 50; // Default to 50 results per page
    limit = Math.min(limit, 100); // Max limit is 100
    limit = Math.max(limit, 1); // Min limit is 1

    const offset = (page - 1) * limit;
    this.query += " LIMIT ? OFFSET ?";
    this.values.push(limit, offset);
  }
}

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

    const queryBuilder: MeasurementQueryBuilder = new MeasurementQueryBuilder();
    queryBuilder.buildMeasurementInsert(measurement);

    return new Promise((resolve, reject) => {
      this.db.run(queryBuilder.query, queryBuilder.values, (err: Error | null) => {
        if (err) {
          console.error("Error inserting data:", err.message);
          reject(err);
          throw DatabaseError.db.insertError;
        }

        resolve();
      });
    });
  }

  /**
   * Create multiple measurement records
   */
  public async createMany(measurements: Measurement[]): Promise<void> {
    console.log(`Creating ${measurements.length} measurements`);

    const queryBuilder: MeasurementQueryBuilder = new MeasurementQueryBuilder();
    queryBuilder.buildMeasurementInsert(measurements[0]); // Need to create base query to create statement

    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        const statement = this.db.prepare(queryBuilder.query);
        const promises: Array<Promise<void>> = [];

        for (const measurement of measurements) {
          queryBuilder.buildMeasurementInsert(measurement);

          const promise = new Promise<void>((resolve, reject) => {
            statement.run(queryBuilder.values, (err: Error | null) => {
              if (err) {
                console.error("Error inserting measurement:", err.message);
                reject(err);
                throw DatabaseError.db.insertError;
              }
              resolve();
            });
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

    const queryBuilder: MeasurementQueryBuilder = new MeasurementQueryBuilder();
    queryBuilder.buildMeasurementSelect(filter);

    return new Promise((resolve, reject) => {
      this.db.all(queryBuilder.query, queryBuilder.values, (err: Error | null, rows: Array<Measurement>) => {
        if (err) {
          console.error("Error selecting data:", err.message);
          reject(err);
          throw DatabaseError.db.selectError;
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

    const queryBuilder: MeasurementQueryBuilder = new MeasurementQueryBuilder();
    queryBuilder.buildStatsSelect(filter);

    return new Promise((resolve, reject) => {
      this.db.get(queryBuilder.query, queryBuilder.values, (err: Error | null, row: any) => {
        if (err) {
          console.error("Error selecting data:", err.message);
          reject(err);
          throw DatabaseError.db.selectError;
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
}
