import { Table } from "../utils/database";

export const measurementTable = new Table("measurements", [
  "id TEXT PRIMARY KEY", // Unique UUID
  "timestamp TEXT NOT NULL", // Timestamp of measurement (ISO 8601 FORMAT)
  "value REAL NOT NULL", // energy value (kWh)
  "meterID STRING NOT NULL", // Smart meter ID that took measurement
  "type TEXT NOT NULL", // Type of measurement (e.g., 'production', 'consumption')
]);
