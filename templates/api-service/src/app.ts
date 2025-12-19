// IMPORTANT: Load environment variables FIRST, before any other imports
// This ensures Prisma and other modules can access process.env at initialization
import dotenv from 'dotenv'
dotenv.config()

// Validate environment variables early - fails fast if invalid
import { env } from './config/env'

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { requestLogger } from './lib/logger'

import { errorHandler } from './middleware/errorHandler'
import { notFound } from './middleware/notFound'
import { globalLimiter } from './middleware/rateLimiting'
import authRoutes from './routes/auth'
import userRoutes from './routes/users'
import healthRoutes from './routes/health'

const app = express()

// Trust proxy - Required for rate limiting behind reverse proxies (Nginx, AWS ALB, etc.)
// Without this, all requests appear to come from the proxy IP
app.set('trust proxy', 1)

// Security middleware
app.use(helmet());
const corsOptions =
  env.CORS_ORIGIN === '*'
    ? { origin: '*', credentials: false }
    : { origin: env.CORS_ORIGIN, credentials: true }
app.use(cors(corsOptions));

// Rate limiting (global)
app.use(globalLimiter)

// Logging
app.use(requestLogger);

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.use("/health", healthRoutes);

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

export default app;
