import { Measurement, MeasurementFilter } from "../types/measurement";
import { v4 as uuidv4, validate as validateUuid } from "uuid";

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

function isValidISOTimestamp(timestamp: string) {
  // Validate if is according to ISO 8601 standard.
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/.test(timestamp);
}

export const validateMeasurement = (data: any): Measurement => {
  // Check if all required fields are present
  const requiredFields = ["timestamp", "value", "meterID", "type"];
  const missingFields = requiredFields.filter((field) => data[field] === undefined || data[field] === null);
  if (missingFields.length > 0) {
    const errorMessage = `Missing required fields: ${missingFields.join(", ")}`;
    throw new ValidationError(errorMessage);
  }

  // Validate timestamp format (ISO 8601)
  if (!isValidISOTimestamp(data.timestamp)) {
    throw new ValidationError("Invalid timestamp format. Expected ISO 8601 format.");
  }

  // Validate value is numeric and positive
  if (typeof data.value !== "number" || data.value < 0) {
    throw new ValidationError("Value must be a positive number");
  }

  // Validate meter ID format
  if (typeof data.meterID !== "string" || data.meterID.trim() === "") {
    throw new ValidationError("Invalid meter ID, must be a string and may not contain spaces.");
  }

  // Validate measurement type
  if (!["production", "consumption"].includes(data.type)) {
    throw new ValidationError('Type must be either "production" or "consumption"');
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

export const validateMeasurementFilter = (data: any, withPagination: boolean): MeasurementFilter => {
  const filter: MeasurementFilter = {};

  // Validate startDate timestamp format (ISO 8601), if startDate is given.
  if (data.startDate) {
    if (!isValidISOTimestamp(data.startDate)) {
      throw new ValidationError("Invalid timestamp format for startDate. Expected ISO 8601 format.");
    }
    filter.startDate = data.startDate;
  }

  // Validate endDate timestamp format (ISO 8601), if endDate is given.
  if (data.endDate) {
    if (!isValidISOTimestamp(data.endDate)) {
      throw new ValidationError("Invalid timestamp format for endDate. Expected ISO 8601 format.");
    }
    filter.endDate = data.endDate;
  }

  // Validate meter ID format, if meterID is given.
  if (data.meterID) {
    if (typeof data.meterID !== "string" || data.meterID.trim() === "") {
      throw new ValidationError("Invalid meter ID, must be a string and may not contain spaces.");
    }
    filter.meterID = data.meterID;
  }

  // Validate measurement type, if data.type is given.
  if (data.type) {
    if (!["production", "consumption"].includes(data.type)) {
      throw new ValidationError('Type must be either "production" or "consumption"');
    }
    filter.type = data.type;
  }

  /*** Validate Pagination ***/
  if (!withPagination) {
    return filter;
  }

  // Validate page is numeric and positive, if page is given.
  if (data.page) {
    if (typeof data.page !== "number") {
      throw new ValidationError("Page value must be a positive number");
    }
    filter.page = data.page;
  }

  // Validate limit is numeric and positive, if limit is given.
  if (data.limit) {
    if (typeof data.limit !== "number") {
      throw new ValidationError("Limit value must be a positive number");
    }
    filter.limit = data.limit;
  }

  return filter;
};
