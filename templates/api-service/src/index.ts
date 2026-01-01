import app from "./app";
import { env } from "./config/env";

// Validation happens on import - fails fast if env vars are invalid

// Only start server when this file is run directly (not imported by tests)
if (require.main === module) {
  const server = app.listen(env.PORT, () => {
    console.log(`🚀 Server running on port ${env.PORT}`);
    console.log(`📝 Environment: ${env.NODE_ENV}`);
  });

  server.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      console.error(`❌ Port ${env.PORT} is already in use`);
    } else if (err.code === "EACCES") {
      console.error(`❌ Permission denied for port ${env.PORT}`);
    } else {
      console.error("❌ Server failed to start:", err);
    }
    process.exit(1);
  });
}

export default app;
