require("./config/env");

const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const requestRoutes = require("./routes/requests.routes");
const workflowRoutes = require("./routes/workflow.routes");
const referenceRoutes = require("./routes/reference.routes");
const reportRoutes = require("./routes/reports.routes");
const miscRoutes = require("./routes/misc.routes");

const app = express();
const port = Number(process.env.PORT ?? 5000);
const clientDistPath = path.join(__dirname, "..", "dist", "it-expense", "browser");
const clientIndexPath = path.join(clientDistPath, "index.html");

app.use(cors({ origin: process.env.CLIENT_ORIGIN ?? "http://localhost:4200" }));
app.use(express.json({ limit: "8mb" }));

app.use("/api/auth", authRoutes);
app.use("/api/expense-requests", requestRoutes);
app.use("/api/workflow", workflowRoutes);
app.use("/api/admin", referenceRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api", miscRoutes);

if (fs.existsSync(clientIndexPath)) {
  app.use(express.static(clientDistPath, { index: false }));
  app.use((req, res, next) => {
    if (req.method === "GET" && !req.path.startsWith("/api")) {
      return res.sendFile(clientIndexPath);
    }

    return next();
  });
}

app.use((req, res) => {
  res
    .status(404)
    .json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ message: "Unexpected server error." });
});

app.listen(port, () => {
  console.log(`IT Expense API running at http://localhost:${port}/api`);
});
