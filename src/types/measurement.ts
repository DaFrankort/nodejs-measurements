export interface Measurement {
  id: string;
  timestamp: string;
  value: number;
  meterID: string;
  type: "production" | "consumption";
}

export interface MeasurementFilter {
  startDate?: string;
  endDate?: string;
  meterID?: string;
  type?: "production" | "consumption";
  page?: number;
  limit?: number;
}

export interface MeasurementStats {
  count: number;
  sum: number;
  average: number;
  min: number;
  max: number;
}
