import { Database } from "sqlite3";
import { Table } from "../utils/database";

/*
 * Create Database Connection
 */
const db = new Database("db.sqlite");
export default db;

/*
 * Create tables
 */
export function initDatabaseTables() {
  const tables: Array<Table> = [
    new Table("measurements", [
      "id TEXT PRIMARY KEY", // Unique UUID
      "timestamp TEXT NOT NULL", // Timestamp of measurement (ISO 8601 FORMAT)
      "value REAL NOT NULL", // energy value (kWh)
      "meterID STRING NOT NULL", // Smart meter ID that took measurement
      "type TEXT NOT NULL", // Type of measurement (e.g., 'production', 'consumption')
    ]),
  ];

  tables.forEach((table) => {
    table.create(db);
  });

  console.log("Database setup complete.");
}
