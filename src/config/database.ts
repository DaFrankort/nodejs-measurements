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
  const tablePromises = [
    measurementTable.create(db),
    // Add future table create actions here
  ];

  Promise.all(tablePromises)
    .then(() => {
      console.log("Database setup complete.");
    })
    .catch((err) => {
      console.error("Error setting up the database:", err);
    });
}
