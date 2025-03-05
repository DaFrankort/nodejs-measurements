import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { measurementRoutes } from "./routes/api";

export const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

// Routes
app.use("/api", measurementRoutes);

// Error handling middleware
app.use(
  (
    err: any,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error(err.stack);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
);
