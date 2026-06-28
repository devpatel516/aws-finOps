const { DeleteVolumeCommand, ReleaseAddressCommand, TerminateInstancesCommand } = require("@aws-sdk/client-ec2");
const Resource = require("../models/Resource");
const AuditLog = require("../models/AuditLog");

async function remediateResource(resource, ec2Client) {
  try {
    if (resource.resourceType === 'EBS_VOLUME') {
      await ec2Client.send(new DeleteVolumeCommand({ VolumeId: resource.resourceId }));
    } else if (resource.resourceType === 'ELASTIC_IP') {
      await ec2Client.send(new ReleaseAddressCommand({ AllocationId: resource.resourceId }));
    } else if (resource.resourceType === 'STOPPED_EC2') {
      await ec2Client.send(new TerminateInstancesCommand({ InstanceIds: [resource.resourceId] }));
    }

    resource.status = 'deleted';
    resource.remediatedAt = new Date();
    await resource.save();

    await AuditLog.create({
      awsAccountId: resource.awsAccountId,
      resourceId: resource.resourceId,
      resourceType: resource.resourceType,
      region: resource.region,
      action: 'DELETED',
      savingsRealized: resource.monthlyCost,
      details: 'Successfully cleaned up via automated lifecycle cron execution.'
    });

    console.log(`Remediated ${resource.resourceType}: ${resource.resourceId}`);
  } catch (error) {
    console.error(`Remediation failure for ${resource.resourceId}:`, error.message);
    await AuditLog.create({
      awsAccountId: resource.awsAccountId,
      resourceId: resource.resourceId,
      resourceType: resource.resourceType,
      region: resource.region,
      action: 'DELETION_FAILED',
      details: `AWS Error: ${error.message}`
    });
  }
}

module.exports = { remediateResource };