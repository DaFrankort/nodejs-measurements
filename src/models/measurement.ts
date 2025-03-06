import { Measurement } from "../types/measurement";
import { Table } from "../utils/database";

export const measurementTable = new Table("measurements", [
  "id TEXT PRIMARY KEY", // Unique UUID
  "timestamp TEXT NOT NULL", // Timestamp of measurement (ISO 8601 FORMAT)
  "value REAL NOT NULL", // energy value (kWh)
  "meterID STRING NOT NULL", // Smart meter ID that took measurement
  "type TEXT NOT NULL", // Type of measurement (e.g., 'production', 'consumption')
]);

export class MeasurementModel implements Measurement {
  id: string;
  timestamp: string;
  value: number;
  meterID: string;
  type: "production" | "consumption";

  constructor(
    id: string,
    timestamp: string,
    value: number,
    meterID: string,
    type: "production" | "consumption"
  ) {
    this.id = id;
    this.timestamp = timestamp;
    this.value = value;
    this.meterID = meterID;
    this.type = type;
  }
}
