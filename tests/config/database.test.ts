import { Database } from "sqlite3";
import { Table } from "../../src/utils/database";

describe("SQLite Table Creation", () => {
  /*** CONFIG ***/
  let db: Database;

  beforeAll(() => {
    // In-memory database for testing purposes.
    db = new Database(":memory:");
  });

  afterAll(() => {
    db.close();
  });

  /*** TESTS ***/
  it("Should create a table in the sqlite database correctly", (done) => {
    new Table("test", [
      "id INTEGER PRIMARY KEY",
      "string TEXT NOT NULL",
      "real REAL NOT NULL"
    ]).create(db);

    db.get("PRAGMA table_info(test);", (err, rows: any) => {
      expect(err).toBeNull();
      expect(rows).toBeTruthy();
      expect(rows.name).toBe("id");
      expect(rows.type).toBe("INTEGER");
      done();
    });
  });
});
