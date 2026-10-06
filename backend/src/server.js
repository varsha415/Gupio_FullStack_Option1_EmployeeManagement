import "dotenv/config";
import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import { connectDatabase } from "./config/database.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import employeesRouter from "./routes/employees.js";

const app = express();
const port = Number(process.env.PORT) || 5000;

const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173,http://localhost:4173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.disable("x-powered-by");

app.use(
  cors({
    origin(origin, callback) {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin) return callback(null, true);

      // Allow any Vercel deployment URL, localhost, or explicit FRONTEND_URL matches
      const isAllowed =
        origin.endsWith(".vercel.app") ||
        origin.includes("localhost") ||
        allowedOrigins.includes(origin);

      if (isAllowed) {
        return callback(null, true);
      }

      callback(new Error("This origin is not allowed by the server's CORS configuration."));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "20kb" }));

app.get("/api/health", (req, res) => {
  const connected = mongoose.connection.readyState === 1;
  res.status(connected ? 200 : 503).json({
    status: connected ? "ok" : "database_unavailable",
    database: connected ? "connected" : "disconnected",
  });
});

app.use("/api/employees", employeesRouter);
app.use(notFoundHandler);
app.use(errorHandler);

try {
  await connectDatabase();
  app.listen(port, () => console.info(`Employee API listening on port ${port}`));
} catch (err) {
  console.error(`Unable to start API: ${err.message}`);
  process.exitCode = 1;
}