import { Request, Response } from "express";
import { MeasurementService } from "../services/measurements";
import { validateMeasurement, validateMeasurementFilter } from "../utils/validators";
import { Measurement, MeasurementStats } from "../types/measurement";
import { DatabaseError, ValidationError } from "../utils/errors";

export class MeasurementController {
  private measurementService: MeasurementService;

  constructor(measurementService: MeasurementService) {
    this.measurementService = measurementService;
  }

  private handleErrorResponse(error: Error | null, res: Response): void {
    if (error instanceof ValidationError) {
      res.status(400).json({ success: false, message: error.message });
      return;
    }

    if (error instanceof DatabaseError) {
      res.status(500).json({ success: false, message: error.message });
      return;
    }

    console.error("Error finding data:", error);
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
    } catch (error: any) {
      this.handleErrorResponse(error, res);
    }
  }

  public async findAll(req: Request, res: Response): Promise<void> {
    try {
      const filter = validateMeasurementFilter(req.body, true);
      const measurements: Array<Measurement> = await this.measurementService.findAll(filter);

      const measurementCount = measurements ? measurements.length : 0;
      const message = measurementCount === 0 ? "No measurements found" : `Showing ${measurementCount} measurements.`;
      res.status(200).json({
        success: true,
        message: message,
        response: measurements,
      });
    } catch (error: any) {
      this.handleErrorResponse(error, res);
    }
  }

  public async getStats(req: Request, res: Response): Promise<void> {
    try {
      const filter = validateMeasurementFilter(req.body, false);
      const stats: MeasurementStats = await this.measurementService.getStats(filter);

      res.status(200).json({
        success: true,
        message: "Measurement statistics received succesfully",
        response: stats,
      });
    } catch (error: any) {
      this.handleErrorResponse(error, res);
    }
  }
}
