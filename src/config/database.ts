import { Database } from "sqlite3";
import { measurementTable } from "../models/measurement";

/*
 * Create Database Connection
 */
const db = new Database("db.sqlite");
export default db;

/*
 * Create tables
 */
export function initDatabaseTables() {
  measurementTable.create(db);
  // Add future tables here
  console.log("Database setup complete.");
}
