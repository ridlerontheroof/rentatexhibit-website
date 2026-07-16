import app from "./app";
import { logger } from "./lib/logger";
import { startLeadNotificationRetry } from "./lib/leadNotificationRetry";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  // Durable backstop: periodically retry leasing-team notifications for leads
  // whose fire-and-forget send failed (notified_at still NULL).
  startLeadNotificationRetry();
});
