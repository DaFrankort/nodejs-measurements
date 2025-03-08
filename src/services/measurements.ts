import { Database } from "sqlite3";
import { Measurement, MeasurementFilter, MeasurementStats } from "../types/measurement";
import { MeasurementQueryBuilder } from "../models/measurement";

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
          return;
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
                return;
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

    const queryBuilder: MeasurementQueryBuilder = new MeasurementQueryBuilder();
    queryBuilder.buildStatsSelect(filter);

    return new Promise((resolve, reject) => {
      this.db.get(queryBuilder.query, queryBuilder.values, (err: Error | null, row: any) => {
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
}
