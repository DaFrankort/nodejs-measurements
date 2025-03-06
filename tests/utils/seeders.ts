import { randomInt } from "crypto";
import { Measurement } from "../../src/types/measurement";
import { v4 as uuidv4 } from "uuid";

export class MeasurementSeeder {
  static generate(): Measurement {
    return {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      value: Math.random() * 5000,
      meterID: uuidv4(),
      type: randomInt(2) == 1 ? "production" : "consumption"
    };
  }

  static generateMany(amount: number): Array<Measurement> {
    let measurements: Array<Measurement> = [];

    for (let i = 0; i < amount; i++) {
      measurements.push(this.generate());
    }

    return measurements;
  }
}
