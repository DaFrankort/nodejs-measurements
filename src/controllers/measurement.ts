import { Request, Response } from "express";
import { MeasurementService } from "../services/measurements";
import { validateMeasurement, validateMeasurementFilter, ValidationError } from "../utils/validators";
import { Measurement } from "../types/measurement";

export class MeasurementController {
  private measurementService: MeasurementService;

  constructor(measurementService: MeasurementService) {
    this.measurementService = measurementService;
  }

  private handleErrorResponse(error: unknown, res: Response): void {
    if (error instanceof ValidationError) {
      res.status(400).json({ success: false, message: error.message });
      return;
    }

    console.error("Error finding measurements:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }

  // Create measurement(s)
  public async create(req: Request, res: Response): Promise<void> {
    try {
      const data = req.body;

      // Handle both single measurement and array of measurements
      if (Array.isArray(data)) {
        const validMeasurements: Measurement[] = [];
        const errors: { index: number; message: string }[] = [];

        for (let i = 0; i < data.length; i++) {
          try {
            const validMeasurement = validateMeasurement(data[i]);
            validMeasurements.push(validMeasurement);
          } catch (error) {
            if (error instanceof ValidationError) {
              errors.push({
                index: i,
                message: error.message,
              });
            } else {
              throw error;
            }
          }
        }

        if (errors.length > 0 && validMeasurements.length === 0) {
          res.status(400).json({
            success: false,
            message: "All measurements failed validation",
            errors,
          });
          return;
        }

        await this.measurementService.createMany(validMeasurements);

        res.status(201).json({
          success: true,
          message: `Created ${validMeasurements.length} measurements`,
          failedCount: errors.length,
          errors: errors.length > 0 ? errors : undefined,
        });
      } else {
        // Single measurement
        const validMeasurement = validateMeasurement(data);
        await this.measurementService.create(validMeasurement);
        res.status(201).json({
          success: true,
          message: "Measurement created successfully",
          id: validMeasurement.id,
        });
      }
    } catch (error) {
      this.handleErrorResponse(error, res);
    }
  }

  public async findAll(req: Request, res: Response): Promise<void> {
    try {
      const validFilter = validateMeasurementFilter(req.body);
      const measurements: Array<Measurement> = await this.measurementService.findAll(validFilter);

      const message =
        measurements.length == 0 ? "No measurements found" : `Showing ${measurements.length} measurements.`;

      res.status(200).json({
        success: true,
        message: message,
        response: measurements,
      });
    } catch (error) {
      this.handleErrorResponse(error, res);
    }
  }
}
