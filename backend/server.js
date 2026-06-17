const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const requestRoutes = require('./routes/requests.routes');
const workflowRoutes = require('./routes/workflow.routes');
const referenceRoutes = require('./routes/reference.routes');
const reportRoutes = require('./routes/reports.routes');
const miscRoutes = require('./routes/misc.routes');

const app = express();
const port = Number(process.env.PORT ?? 5000);

app.use(cors({ origin: process.env.CLIENT_ORIGIN ?? 'http://localhost:4200' }));
app.use(express.json({ limit: '5mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/expense-requests', requestRoutes);
app.use('/api/workflow', workflowRoutes);
app.use('/api/admin', referenceRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api', miscRoutes);

app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ message: 'Unexpected server error.' });
});

app.listen(port, () => {
  console.log(`IT Expense API running at http://localhost:${port}/api`);
});
