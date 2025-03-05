import sqlite3 from "sqlite3";
import { Database } from "sqlite3";
import { Table } from "../utils/database";

sqlite3.verbose(); // TODO: delete, just for debugging purposes

const db = new Database("db.sqlite");
export default db;

const tables: Array<Table> = [
  new Table("measurements", [
    "id TEXT PRIMARY KEY", // Unique UUID
    "timestamp TEXT NOT NULL", // Timestamp of measurement (ISO 8601 FORMAT)
    "value REAL NOT NULL", // energy value (kWh)
    "meterID INTEGER NOT NULL", // Smart meter ID that took measurement
    "type TEXT NOT NULL", // Type of measurement (e.g., 'production', 'consumption')
  ]),
];

tables.forEach((table) => {
  table.create(db);
});
