import { Database } from "sqlite3";
import { MeasurementTable } from "../services/measurements";

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
    MeasurementTable.create(db),
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
