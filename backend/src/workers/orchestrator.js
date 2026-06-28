const { EC2Client, DescribeRegionsCommand } = require("@aws-sdk/client-ec2");
const Account = require("../models/Account");
const Resource = require("../models/Resource");
const { scanEBS, scanEIP, scanStoppedEC2 } = require("./scanners");
const { remediateResource } = require("./remediators");

async function getClient(account, region) {
  return new EC2Client({
    region,
    credentials: {
      accessKeyId: account.accessKeyId,
      secretAccessKey: account.secretAccessKey
    }
  });
}

async function runGlobalScanEngine() {
  console.log("Starting Multi-Account Discovery Cycle...");
  const accounts = await Account.find({ status: 'active' });

  for (const account of accounts) {
    try {
      const baseClient = await getClient(account, "us-east-1");
      const regionsRes = await baseClient.send(new DescribeRegionsCommand({}));
      const regions = regionsRes.Regions.map(r => r.RegionName);

      for (const region of regions) {
        try {
          const client = await getClient(account, region);
          await Promise.all([
            scanEBS(account, region, client),
            scanEIP(account, region, client),
            scanStoppedEC2(account, region, client)
          ]);
        } catch (err) {
          console.error(`Skipping regional sweep [${region}] for account ${account.awsAccountId}:`, err.message);
        }
      }
    } catch (err) {
      console.error(`Failed executing profile checks for account ${account.awsAccountId}:`, err.message);
    }
  }
  console.log("Scan Engine Phase Completed.");
}

async function runCleanupEngine() {
  console.log("Running Automated Cleanup Execution Cycle...");
  const actionableResources = await Resource.find({ status: 'marked_for_deletion' });

  for (const resource of actionableResources) {
    const account = await Account.findById(resource.accountId);
    if (!account || account.status !== 'active') continue;

    try {
      const client = await getClient(account, resource.region);
      await remediateResource(resource, client);
    } catch (err) {
      console.error(`Failed establishing secure payload client for resource ${resource.resourceId}:`, err.message);
    }
  }
  console.log("Cleanup Execution Engine Completed.");
}

module.exports = { runGlobalScanEngine, runCleanupEngine };