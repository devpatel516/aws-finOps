const { DescribeVolumesCommand, DescribeAddressesCommand, DescribeInstancesCommand } = require("@aws-sdk/client-ec2");
const Resource = require("../models/Resource");

async function scanEBS(account, region, ec2Client) {
  const command = new DescribeVolumesCommand({ Filters: [{ Name: "status", Values: ["available"] }] });
  const response = await ec2Client.send(command);
  const volumes = response.Volumes || [];
  const foundIds = [];

  for (const vol of volumes) {
    foundIds.push(vol.VolumeId);
    const cost = vol.Size * 0.08; 
    const existing = await Resource.findOne({ resourceId: vol.VolumeId });
    const updatePayload = {
      accountId: account._id,
      awsAccountId: account.awsAccountId,
      resourceType: 'EBS_VOLUME',
      region,
      monthlyCost: parseFloat(cost.toFixed(2)),
      awsDetails: vol
    };
    if (existing && existing.status === 'deleted') {
      updatePayload.status = 'detected';
      updatePayload.remediatedAt = null;
    }
    await Resource.findOneAndUpdate(
      { resourceId: vol.VolumeId },
      updatePayload,
      { upsert: true }
    );
  }
  return foundIds;
}

async function scanEIP(account, region, ec2Client) {
  const command = new DescribeAddressesCommand({});
  const response = await ec2Client.send(command);
  const addresses = response.Addresses || [];
  const unassociatedIPs = addresses.filter(ip => !ip.InstanceId && !ip.NetworkInterfaceId);
  const foundIds = [];

  for (const ip of unassociatedIPs) {
    const ipId = ip.AllocationId || ip.PublicIp;
    foundIds.push(ipId);
    const cost = 3.65; 
    const existing = await Resource.findOne({ resourceId: ipId });
    const updatePayload = {
      accountId: account._id,
      awsAccountId: account.awsAccountId,
      resourceType: 'ELASTIC_IP',
      region,
      monthlyCost: cost,
      awsDetails: ip
    };
    if (existing && existing.status === 'deleted') {
      updatePayload.status = 'detected';
      updatePayload.remediatedAt = null;
    }
    await Resource.findOneAndUpdate(
      { resourceId: ipId },
      updatePayload,
      { upsert: true }
    );
  }
  return foundIds;
}

async function scanStoppedEC2(account, region, ec2Client) {
  const command = new DescribeInstancesCommand({ Filters: [{ Name: "instance-state-name", Values: ["stopped"] }] });
  const response = await ec2Client.send(command);
  const foundIds = [];

  for (const res of response.Reservations || []) {
    for (const inst of res.Instances || []) {
      foundIds.push(inst.InstanceId);
      const cost = 5.00; 
      const existing = await Resource.findOne({ resourceId: inst.InstanceId });
      const updatePayload = {
        accountId: account._id,
        awsAccountId: account.awsAccountId,
        resourceType: 'STOPPED_EC2',
        region,
        monthlyCost: cost,
        awsDetails: inst
      };
      if (existing && existing.status === 'deleted') {
        updatePayload.status = 'detected';
        updatePayload.remediatedAt = null;
      }
      await Resource.findOneAndUpdate(
        { resourceId: inst.InstanceId },
        updatePayload,
        { upsert: true }
      );
    }
  }
  return foundIds;
}

module.exports = { scanEBS, scanEIP, scanStoppedEC2 };