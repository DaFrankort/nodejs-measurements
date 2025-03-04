import { Router } from "express";
import { MeasurementController } from "../controllers/measurement";
import { MeasurementService } from "../services/measurements";

const router = Router();
const measurementService = new MeasurementService();
const measurementController = new MeasurementController(measurementService);

// Measurement routes
router.post("/measurements", (req, res) =>
  measurementController.create(req, res)
);

export const measurementRoutes = router;
