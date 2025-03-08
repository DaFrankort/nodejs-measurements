import { Measurement, MeasurementFilter } from "../types/measurement";
import { Table } from "../utils/database";

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
