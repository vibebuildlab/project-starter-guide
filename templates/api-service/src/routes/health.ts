import express from "express";
import { prisma } from "../lib/prisma";

const router = express.Router();

// GET /health - Basic health check endpoint (liveness probe)
router.get("/", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    version: "1.0.0",
  });
});

// GET /ready - Readiness probe with dependency checks
router.get("/ready", async (req, res) => {
  const startTime = Date.now();
  const checks = {
    database: { status: "unknown", latency: 0, error: null as string | null },
  };

  try {
    // Check database connectivity
    const dbStartTime = Date.now();
    await prisma.$queryRaw`SELECT 1 as test`;
    checks.database = {
      status: "healthy",
      latency: Date.now() - dbStartTime,
      error: null,
    };
  } catch (error) {
    const errName = error instanceof Error ? error.constructor.name : "UnknownError";
    const errMsg = error instanceof Error ? error.message : "Unknown database error";
    checks.database = {
      status: "unhealthy",
      latency: Date.now() - startTime,
      error: `${errName}: ${errMsg}`,
    };
  }

  const totalLatency = Date.now() - startTime;
  const isHealthy = checks.database.status === "healthy";

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? "ready" : "not_ready",
    timestamp: new Date().toISOString(),
    checks,
    metrics: {
      totalLatency,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
    },
  });
});

// GET /metrics - Basic application metrics
router.get("/metrics", (req, res) => {
  const memUsage = process.memoryUsage();

  res.json({
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      rss: memUsage.rss,
      heapTotal: memUsage.heapTotal,
      heapUsed: memUsage.heapUsed,
      external: memUsage.external,
    },
    cpu: process.cpuUsage(),
    environment: process.env.NODE_ENV || "development",
    version: "1.0.0",
    nodejs: process.version,
  });
});

export default router;
