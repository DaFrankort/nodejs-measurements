import { Database } from "sqlite3";
import { MeasurementModel } from "../models/measurement";

/*
 * Create Database Connection
 */
const db = new Database("db.sqlite");
export default db;

/*
 * Create tables
 */
export function initDatabaseTables() {
  MeasurementModel.initTable(db);
  // Add future table initialisations here

  console.log("Database setup complete.");
}
