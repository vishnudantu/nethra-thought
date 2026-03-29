import Queue from 'bull';
import { runOmniScan, getOmniScanStatus } from './services/omniscan.js';
import { generateMorningBrief } from './services/briefing.js';

let omniQueue;
let briefQueue;
let queuesEnabled = false;

function buildRedisConfig() {
  if (process.env.REDIS_URL) return process.env.REDIS_URL;
  return {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  };
}

export function initQueues() {
  if (queuesEnabled) return { enabled: true };
  try {
    const redis = buildRedisConfig();
    omniQueue = new Queue('omniscan', redis);
    briefQueue = new Queue('morning-brief', redis);

    omniQueue.process(async job => runOmniScan({ trigger: job?.data?.trigger || 'queue' }));
    briefQueue.process(async job => generateMorningBrief({ politicianId: job?.data?.politicianId, force: true }));

    const omniCron = process.env.OMNISCAN_CRON || '*/15 * * * *';
    const briefCron = process.env.BRIEFING_CRON || '0 0 * * *';

    omniQueue.add({ trigger: 'cron' }, { repeat: { cron: omniCron }, removeOnComplete: true });
    briefQueue.add({ trigger: 'cron' }, { repeat: { cron: briefCron }, removeOnComplete: true });

    omniQueue.on('error', err => console.error('[omniscan-queue]', err));
    briefQueue.on('error', err => console.error('[brief-queue]', err));

    queuesEnabled = true;
    return { enabled: true };
  } catch (err) {
    console.error('[queues]', err);
    queuesEnabled = false;
    return { enabled: false };
  }
}

export async function enqueueOmniScan() {
  if (!queuesEnabled || !omniQueue) {
    return runOmniScan({ trigger: 'direct' });
  }
  return omniQueue.add({ trigger: 'manual' }, { removeOnComplete: true });
}

export async function enqueueMorningBrief(politicianId) {
  if (!queuesEnabled || !briefQueue) {
    return generateMorningBrief({ politicianId, force: true });
  }
  return briefQueue.add({ politicianId }, { removeOnComplete: true });
}

export function getQueuesStatus() {
  return {
    enabled: queuesEnabled,
    omni: getOmniScanStatus(),
  };
}
