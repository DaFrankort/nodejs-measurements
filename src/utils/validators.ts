import { Measurement } from "../types/measurement";
import { v4 as uuidv4, validate as validateUuid } from "uuid";

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export const validateMeasurement = (data: any): Measurement => {
  // Check if all required fields are present
  if (!data.timestamp || !data.value || !data.meterID || !data.type) {
    throw new ValidationError("Missing required fields");
  }

  // Validate timestamp format (ISO 8601)
  if (
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/.test(
      data.timestamp
    )
  ) {
    throw new ValidationError(
      "Invalid timestamp format. Expected ISO 8601 format."
    );
  }

  // Validate value is numeric and positive
  if (typeof data.value !== "number" || data.value < 0) {
    throw new ValidationError("Value must be a positive number");
  }

  // Validate meter ID format
  if (typeof data.meterID !== "string" || data.meterID.trim() === "") {
    throw new ValidationError("Invalid meter ID");
  }

  // Validate measurement type
  if (!["production", "consumption"].includes(data.type)) {
    throw new ValidationError(
      'Type must be either "production" or "consumption"'
    );
  }

  // Generate an ID if not provided or validate existing one
  const id = data.id || uuidv4();
  if (data.id && !validateUuid(data.id)) {
    throw new ValidationError("Invalid measurement ID format. Expected UUID.");
  }

  return {
    id,
    timestamp: data.timestamp,
    value: data.value,
    meterID: data.meterID,
    type: data.type as "production" | "consumption",
  };
};
