const { DescribeVolumesCommand, DescribeAddressesCommand, DescribeInstancesCommand } = require("@aws-sdk/client-ec2");
const Resource = require("../models/Resource");

async function scanEBS(account, region, ec2Client) {
  const command = new DescribeVolumesCommand({ Filters: [{ Name: "status", Values: ["available"] }] });
  const response = await ec2Client.send(command);
  const volumes = response.Volumes || [];

  for (const vol of volumes) {
    const cost = vol.Size * 0.08; 
    await Resource.findOneAndUpdate(
      { resourceId: vol.VolumeId },
      {
        accountId: account._id,
        awsAccountId: account.awsAccountId,
        resourceType: 'EBS_VOLUME',
        region,
        monthlyCost: parseFloat(cost.toFixed(2)),
        awsDetails: vol
      },
      { upsert: true }
    );
  }
  return volumes.length;
}

async function scanEIP(account, region, ec2Client) {
  const command = new DescribeAddressesCommand({});
  const response = await ec2Client.send(command);
  const addresses = response.Addresses || [];
  const unassociatedIPs = addresses.filter(ip => !ip.InstanceId && !ip.NetworkInterfaceId);

  for (const ip of unassociatedIPs) {
    const cost = 3.65; 
    await Resource.findOneAndUpdate(
      { resourceId: ip.AllocationId || ip.PublicIp },
      {
        accountId: account._id,
        awsAccountId: account.awsAccountId,
        resourceType: 'ELASTIC_IP',
        region,
        monthlyCost: cost,
        awsDetails: ip
      },
      { upsert: true }
    );
  }
  return unassociatedIPs.length;
}

async function scanStoppedEC2(account, region, ec2Client) {
  const command = new DescribeInstancesCommand({ Filters: [{ Name: "instance-state-name", Values: ["stopped"] }] });
  const response = await ec2Client.send(command);
  let count = 0;

  for (const res of response.Reservations || []) {
    for (const inst of res.Instances || []) {
      const cost = 5.00; 
      await Resource.findOneAndUpdate(
        { resourceId: inst.InstanceId },
        {
          accountId: account._id,
          awsAccountId: account.awsAccountId,
          resourceType: 'STOPPED_EC2',
          region,
          monthlyCost: cost,
          awsDetails: inst
        },
        { upsert: true }
      );
      count++;
    }
  }
  return count;
}

module.exports = { scanEBS, scanEIP, scanStoppedEC2 };