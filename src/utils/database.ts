import { Database } from "sqlite3";

export class Table {
  name: string;
  createQuery: string;

  constructor(name: string, fields: Array<string>) {
    this.name = name.toLowerCase();

    const queryFields: string = fields.join(", ");
    this.createQuery = `CREATE TABLE IF NOT EXISTS ${this.name} (${queryFields});`;
  }

  create(db: Database): Promise<void> {
    return new Promise((resolve, reject) => {
      db.run(this.createQuery, (err: Error | null) => {
        if (err != null) {
          console.error(`Error creating table '${this.name}':`, err.message);
          reject(err);
        } else {
          console.log(`- Table '${this.name}' created successfully.`);
          resolve();
        }
      });
    });
  }
}
