export class ValidationError extends Error {
  static global = {
    missingRequiredFields: (fields: Array<string>) =>
      new ValidationError(`Missing required fields: ${fields.join(", ")}`),
    invalidISOTimestamp: (paramName: string) =>
      new ValidationError(`Invalid timestamp format on \`${paramName}\`. Expected ISO 8601 format.`),
    mustBePositiveNumber: (paramName: string) => new ValidationError(`\`${paramName}\` must be positive number`),
  };

  static measurement = {
    invalidMeterID: new ValidationError("Invalid meterID, must be a string and may not contain whitespaces."),
    invalidType: new ValidationError('Type must be either "production" or "consumption"'),
    invalidID: new ValidationError("Invalid measurement ID format. Expected UUID format."),
    invalidLimit: new ValidationError("Limit must be positive number between 1 - 100."),
  };

  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class DatabaseError extends Error {
  static unavailable = new DatabaseError("Server is busy, please try again later.");

  constructor(message: string) {
    super(message);
    this.name = "DatabaseError";
  }
}
