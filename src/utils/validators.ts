import { Measurement, MeasurementFilter } from "../types/measurement";
import { v4 as uuidv4, validate as validateUuid } from "uuid";
import { ValidationError } from "./errors";

function isValidISOTimestamp(timestamp: string) {
  // Validate if is according to ISO 8601 standard.
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/.test(timestamp);
}

export const validateMeasurement = (data: any): Measurement => {
  // Check if all required fields are present
  const requiredFields = ["timestamp", "value", "meterID", "type"];
  const missingFields = requiredFields.filter((field) => data[field] === undefined || data[field] === null);
  if (missingFields.length > 0) {
    throw ValidationError.global.missingRequiredFields(missingFields);
  }

  // Validate timestamp format (ISO 8601)
  if (!isValidISOTimestamp(data.timestamp)) {
    throw ValidationError.global.invalidISOTimestamp("timestamp");
  }

  // Validate value is numeric and positive
  if (typeof data.value !== "number" || data.value < 0) {
    throw ValidationError.global.mustBePositiveNumber("value");
  }

  // Validate meter ID format
  if (typeof data.meterID !== "string" || data.meterID.trim() === "") {
    throw ValidationError.measurement.invalidMeterID;
  }

  // Validate measurement type
  if (!["production", "consumption"].includes(data.type)) {
    throw ValidationError.measurement.invalidType;
  }

  // Generate an ID if not provided or validate existing one
  const id = data.id || uuidv4();
  if (data.id && !validateUuid(data.id)) {
    throw ValidationError.measurement.invalidID;
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
      throw ValidationError.global.invalidISOTimestamp("startDate");
    }
    filter.startDate = data.startDate;
  }

  // Validate endDate timestamp format (ISO 8601), if endDate is given.
  if (data.endDate) {
    if (!isValidISOTimestamp(data.endDate)) {
      throw ValidationError.global.invalidISOTimestamp("endDate");
    }
    filter.endDate = data.endDate;
  }

  // Validate meter ID format, if meterID is given.
  if (data.meterID) {
    if (typeof data.meterID !== "string" || data.meterID.trim() === "") {
      throw ValidationError.measurement.invalidMeterID;
    }
    filter.meterID = data.meterID;
  }

  // Validate measurement type, if data.type is given.
  if (data.type) {
    if (!["production", "consumption"].includes(data.type)) {
      throw ValidationError.measurement.invalidType;
    }
    filter.type = data.type;
  }

  /*** Validate Pagination ***/
  if (!withPagination) {
    return filter;
  }

  // Validate page is numeric and positive, if page is given.
  if (data.page) {
    if (typeof data.page !== "number" || data.value < 0) {
      throw ValidationError.global.mustBePositiveNumber("page");
    }
    filter.page = data.page;
  }

  // Validate limit is numeric and positive and within 1 - 100, if limit is given.
  if (data.limit) {
    if (typeof data.limit !== "number" || data.limit < 1 || data.limit > 100) {
      throw ValidationError.measurement.invalidLimit;
    }
    filter.limit = data.limit;
  }

  return filter;
};
