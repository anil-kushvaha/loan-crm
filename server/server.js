import app from "./app.js";

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});

process.on("unhandledRejection", (err) => {
  console.error("❌ Server shutting down due to:", err.message);
  server.close(() => process.exit(1));
});
