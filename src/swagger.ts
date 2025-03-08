import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Application } from "express";

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Measurement API",
    version: "1.0.0",
    description: "API for managing and retrieving measurements.",
  },
  servers: [
    {
      url: "http://localhost:3000/api",
      description: "Local development server",
    },
  ],
  components: {
    schemas: {
      Measurement: {
        type: "object",
        required: ["timestamp", "value", "meterID", "type"],
        properties: {
          id: {
            type: "string",
            format: "uuid",
            description: "A unique identifier for the measurement, generated when not provided.",
          },
          timestamp: {
            type: "string",
            format: "date-time",
            description: "The timestamp of the measurement in ISO 8601 format.",
          },
          value: {
            type: "number",
            description: "The measured value as a positive number.",
            minimum: 0,
          },
          meterID: {
            type: "string",
            pattern: "^[^\\s]+$", // meterID must not contain whitespaces
            description: "The ID of the meter (no whitespaces allowed)",
          },
          type: {
            type: "string",
            enum: ["production", "consumption"],
            description: "The type of measurement (production or consumption)",
          },
        },
      },

      SingleMeasurementResponse: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
            description: "Whether the request was successful",
          },
          message: {
            type: "string",
            description: "A message about the outcome of the request",
          },
          id: {
            type: "string",
            format: "uuid",
            description: "The ID of the created measurement",
          },
        },
      },

      MultipleMeasurementsResponse: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
            description: "Whether the request was successful",
          },
          message: {
            type: "string",
            description: "A message about the outcome of the request",
          },
          failedCount: {
            type: "integer",
            description: "The number of measurements that failed validation",
          },
          errors: {
            type: "array",
            items: {
              type: "object",
              properties: {
                index: {
                  type: "integer",
                  description: "The index of the failed measurement in the request array",
                },
                message: {
                  type: "string",
                  description: "The error message for the failed measurement",
                },
              },
            },
            description: "List of errors for failed measurements",
          },
        },
      },

      MeasurementFilter: {
        type: "object",
        properties: {
          startDate: {
            type: "string",
            format: "date-time",
            description: "Filter measurements from this date",
          },
          endDate: {
            type: "string",
            format: "date-time",
            description: "Filter measurements up to this date",
          },
          meterID: {
            type: "string",
            description: "Filter measurements by meter ID",
          },
          type: {
            type: "string",
            enum: ["production", "consumption"],
            description: "Filter measurements by type",
          },
          page: {
            type: "integer",
            min: 1,
            default: 1,
            description: "The page number of results to return.",
          },
          limit: {
            type: "integer",
            min: 1,
            default: 50,
            max: 100,
            description: "The number of results to return per page.",
          },
        },
      },

      GetMeasurementsResponse: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
            description: "Whether the request was successful",
          },
          message: {
            type: "string",
            description: "A message about the outcome of the request",
          },
          response: {
            type: "array",
            description: "Array of measurements on the current page.",
            items: {
              $ref: "#/components/schemas/Measurement",
            },
          },
        },
      },

      MeasurementStatsResponse: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
            description: "Whether the request was successful",
          },
          message: {
            type: "string",
            description: "A message about the outcome of the request",
          },
          response: {
            type: "object",
            properties: {
              count: {
                type: "integer",
                description: "Total number of measurements that match the filters",
              },
              sum: {
                type: "number",
                description: "The total sum of all matching measurements",
              },
              average: {
                type: "number",
                description: "The average value of the measurements",
              },
              min: {
                type: "number",
                description: "The minimum value of the measurements",
              },
              max: {
                type: "number",
                description: "The maximum value of the measurements",
              },
            },
          },
        },
      },

      ValidationErrorResponse: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
            example: false,
          },
          message: {
            type: "string",
            description: "Error message describing what went wrong.",
            example: "Invalid request data or validation errors.",
          },
        },
      },

      ServerErrorResponse: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
            example: false,
          },
          message: {
            type: "string",
            description: "Error message stating internal server error.",
            example: "Internal server error.",
          },
        },
      },

      DatabaseErrorResponse: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
            example: false,
          },
          message: {
            type: "string",
            description: "Error message stating internal server error.",
            example: "Server is busy, please try again later.",
          },
        },
      },
    },
  },
};

const options = {
  swaggerDefinition,
  apis: ["./dist/routes/*.js"],
};

const swaggerSpec = swaggerJSDoc(options);

const setupSwagger = (app: Application): void => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};

export default setupSwagger;
