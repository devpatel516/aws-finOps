require('dotenv').config();
const express = require('express');
const cron = require('node-cron');
const connectDB = require('./config/db');
const apiRoutes = require('./routes/api');
const { runGlobalScanEngine, runCleanupEngine } = require('./workers/orchestrator');

const app = express();
app.use(express.json());
connectDB();

app.use('/api', apiRoutes);

//Execution infrastructure sweeps automatically every 6 hours
cron.schedule('0 */6 * * *', () => {
  runGlobalScanEngine();
});

//Remediation removal updates engine executes daily at midnight
cron.schedule('0 0 * * *', () => {
  runCleanupEngine();
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`FinOps Optimization Core Control API operational over port ${PORT}`);
});