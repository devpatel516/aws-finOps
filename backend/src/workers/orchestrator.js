const { EC2Client, DescribeRegionsCommand } = require("@aws-sdk/client-ec2");
const Account = require("../models/Account");
const Resource = require("../models/Resource");
const AuditLog = require("../models/AuditLog");
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

async function runGlobalScanEngine(awsAccountIds = null) {
  // 🔒 If called with a list of account IDs (user-triggered scan), only scan those.
  //    If called from the cron job (no arg), scan all active accounts globally.
  const filter = { status: 'active' };
  if (awsAccountIds && awsAccountIds.length > 0) {
    filter.awsAccountId = { $in: awsAccountIds };
  }

  const accounts = await Account.find(filter);

  for (const account of accounts) {
    try {
      const baseClient = await getClient(account, "us-east-1");
      const regionsRes = await baseClient.send(new DescribeRegionsCommand({}));
      const regions = regionsRes.Regions.map(r => r.RegionName);

      for (const region of regions) {
        try {
          const client = await getClient(account, region);
          const [ebsIds, eipIds, ec2Ids] = await Promise.all([
            scanEBS(account, region, client),
            scanEIP(account, region, client),
            scanStoppedEC2(account, region, client)
          ]);

          const regionFoundIds = [...ebsIds, ...eipIds, ...ec2Ids];

          // Identify and clean up resources in the database that are no longer active/unused in AWS for this region and account
          const missingResources = await Resource.find({
            accountId: account._id,
            region: region,
            status: { $in: ['detected', 'marked_for_deletion', 'exempt'] },
            resourceId: { $nin: regionFoundIds }
          });

          for (const res of missingResources) {
            res.status = 'deleted';
            res.remediatedAt = new Date();
            await res.save();

            await AuditLog.create({
              awsAccountId: res.awsAccountId,
              resourceId: res.resourceId,
              resourceType: res.resourceType,
              region: res.region,
              action: 'DELETED',
              details: 'No longer detected on AWS during regional scan (cleaned up or altered externally).'
            });
          }
        } catch (err) {
          console.error(`Skipping regional sweep [${region}] for account ${account.awsAccountId}:`, err.message);
        }
      }
    } catch (err) {
      console.error(`Failed executing profile checks for account ${account.awsAccountId}:`, err.message);
    }
  }
}

async function runCleanupEngine() {
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
}

module.exports = { runGlobalScanEngine, runCleanupEngine };