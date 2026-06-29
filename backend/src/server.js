require('dotenv').config();
const express = require('express');
const cron = require('node-cron');
const connectDB = require('./config/db');
const apiRoutes = require('./routes/api');
const authRoutes = require('./routes/auth');
const { runGlobalScanEngine, runCleanupEngine } = require('./workers/orchestrator');
const cors = require('cors');

connectDB();

const app = express();
app.use(cors());
app.use(express.json());

// Public auth routes (no JWT required)
app.use('/api/auth', authRoutes);

// Protected API routes (JWT required — middleware applied inside routes/api.js)
app.use('/api', apiRoutes);

// Execution infrastructure sweeps automatically every 6 hours
cron.schedule('0 */6 * * *', () => {
  runGlobalScanEngine();
});

// Remediation removal updates engine daily cron is disabled as requested by the user
// cron.schedule('0 0 * * *', () => {
//   runCleanupEngine();
// });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`FinOps Optimization Core Control API operational over port ${PORT}`);
});