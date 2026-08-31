import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  redact: ["req.body.email", "req.body.phone", "req.body.firstName", "req.body.lastName"]
});