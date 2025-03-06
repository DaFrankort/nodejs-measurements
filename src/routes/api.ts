import { Router } from "express";
import { MeasurementController } from "../controllers/measurement";
import { MeasurementService } from "../services/measurements";
import db from "../config/database";

const router = Router();
const measurementService = new MeasurementService(db);
const measurementController = new MeasurementController(measurementService);

// Measurement routes
router.post("/measurements", (req, res) =>
  measurementController.create(req, res)
);

export const measurementRoutes = router;
