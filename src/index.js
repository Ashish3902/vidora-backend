import "dotenv/config";
import http from "http";
import app from "./app.js";

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑 SIGTERM received, shutting down gracefully");
  server.close(() => {
    console.log("✅ Process terminated");
    process.exit(0);
  });
});

process.on("uncaughtException", (err) => {
  console.error("💥 Uncaught Exception:", err);
  process.exit(1);
});

process.on("unhandledRejection", (err) => {
  console.error("💥 Unhandled Promise Rejection:", err);
  server.close(() => {
    process.exit(1);
  });
});

server.listen(PORT, () => {
  console.log(`
  🚀 ================================
  🎬 VIDORA BACKEND SERVER RUNNING
  🌍 Environment: ${process.env.NODE_ENV || "development"}
  🔗 Port: ${PORT}
  📡 Health Check: http://localhost:${PORT}/api/health
  🕐 Started: ${new Date().toLocaleString()}
  🚀 ================================
  `);
});
