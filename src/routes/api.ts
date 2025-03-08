import { Router } from "express";
import { MeasurementController } from "../controllers/measurement";
import { MeasurementService } from "../services/measurements";
import db from "../config/database";

const router = Router();
const measurementService = new MeasurementService(db);
const measurementController = new MeasurementController(measurementService);

// Measurement routes

/**
 * @swagger
 * /measurements:
 *   post:
 *     summary: Create new measurement(s)
 *     description: |
 *       Stores one or more measurements in the database. If an array of measurements is provided,
 *       they will all be validated and stored together. Each measurement must have a timestamp, value,
 *       meterID, and type. The request can contain either a single measurement object or an array of
 *       measurement objects.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - $ref: '#/components/schemas/Measurement'  # For a single measurement
 *               - type: array
 *                 items:
 *                   $ref: '#/components/schemas/Measurement'  # For multiple measurements
 *           examples:
 *             singleMeasurement:
 *               value:
 *                 timestamp: "2025-03-08T14:30:00Z"
 *                 value: 23.5
 *                 meterID: "meter123"
 *                 type: "production"
 *             multipleMeasurements:
 *               value:
 *                 - timestamp: "2025-03-08T14:30:00Z"
 *                   value: 23.5
 *                   meterID: "meter123"
 *                   type: "production"
 *                 - timestamp: "2025-03-08T14:35:00Z"
 *                   value: 45.0
 *                   meterID: "meter456"
 *                   type: "consumption"
 *     responses:
 *       201:
 *         description: Measurement(s) created successfully, response dependant on posting one or more measurements.
 *         content:
 *           application/json:
 *             oneOf:
 *               - $ref: '#/components/schemas/SingleMeasurementResponse'  # For single measurement
 *               - $ref: '#/components/schemas/MultipleMeasurementsResponse'  # For multiple measurements
 *       400:
 *         description: Validation errors.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServerErrorResponse'
 *       503:
 *         description: Server unable to handle incoming requests.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DatabaseErrorResponse'
 */
router.post("/measurements", (req, res) => measurementController.create(req, res));

/**
 * @swagger
 * /measurements:
 *   get:
 *     summary: Retrieve filtered measurements
 *     description: Fetch measurements based on filters (date range, meterID, type, pagination).
 *     parameters:
 *       - name: startDate
 *         in: query
 *         description: "Filter measurements from this date"
 *         required: false
 *         schema:
 *           type: string
 *           format: date-time
 *       - name: endDate
 *         in: query
 *         description: "Filter measurements up to this date"
 *         required: false
 *         schema:
 *           type: string
 *           format: date-time
 *       - name: meterID
 *         in: query
 *         description: "Filter measurements by meter ID"
 *         required: false
 *         schema:
 *           type: string
 *       - name: type
 *         in: query
 *         description: "Filter measurements by type (production or consumption)"
 *         required: false
 *         schema:
 *           type: string
 *           enum: ["production", "consumption"]
 *       - name: page
 *         in: query
 *         description: "The page number of results to return (default is 1)"
 *         required: false
 *         schema:
 *           type: integer
 *           default: 1
 *       - name: limit
 *         in: query
 *         description: "The number of results to return per page (default is 50)"
 *         required: false
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: List of measurements based on filters.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Measurements retrieved successfully"
 *                 response:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Measurement'
 *       400:
 *         description: Validation errors.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServerErrorResponse'
 *       503:
 *         description: Server unable to handle incoming requests.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DatabaseErrorResponse'
 */
router.get("/measurements", (req, res) => measurementController.findAll(req, res));

/**
 * @swagger
 * /measurements/stats:
 *   get:
 *     summary: Retrieve measurement statistics
 *     description: Get statistical data (count, sum, average, min, max) for measurements.
 *     parameters:
 *       - name: startDate
 *         in: query
 *         description: "Filter measurements from this date"
 *         required: false
 *         schema:
 *           type: string
 *           format: date-time
 *       - name: endDate
 *         in: query
 *         description: "Filter measurements up to this date"
 *         required: false
 *         schema:
 *           type: string
 *           format: date-time
 *       - name: meterID
 *         in: query
 *         description: "Filter measurements by meter ID"
 *         required: false
 *         schema:
 *           type: string
 *       - name: type
 *         in: query
 *         description: "Filter measurements by type (production or consumption)"
 *         required: false
 *         schema:
 *           type: string
 *           enum: ["production", "consumption"]
 *     responses:
 *       200:
 *         description: Statistical data for measurements.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MeasurementStatsResponse'
 *       400:
 *         description: Validation errors.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServerErrorResponse'
 *       503:
 *         description: Server unable to handle incoming requests.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DatabaseErrorResponse'
 */
router.get("/measurements/stats", (req, res) => measurementController.getStats(req, res));

export const measurementRoutes = router;
