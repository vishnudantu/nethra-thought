import Queue from 'bull';
import { runOmniScan, getOmniScanStatus } from './services/omniscan.js';
import { generateMorningBrief } from './services/briefing.js';
import { updateSentimentScores } from './services/sentiment.js';
import { generateDailyContentPack } from './services/contentFactory.js';
import { generateVisitPlans } from './services/visitPlanner.js';
import { runSansadSync } from './services/sansad.js';
import { runAgentSystem } from './services/agentSystem.js';
import { runDeepfakeShield } from './services/deepfakeShield.js';
import { runCoalitionForecasts } from './services/coalitionForecast.js';
import { runWarRoomScan } from './services/warRoom.js';

let omniQueue;
let briefQueue;
let sentimentQueue;
let contentQueue;
let visitQueue;
let sansadQueue;
let agentQueue;
let deepfakeQueue;
let coalitionQueue;
let warRoomQueue;
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
    sentimentQueue = new Queue('sentiment', redis);
    contentQueue = new Queue('content-factory', redis);
    visitQueue = new Queue('visit-planner', redis);
    sansadQueue = new Queue('sansad-sync', redis);
    agentQueue = new Queue('agent-system', redis);
    deepfakeQueue = new Queue('deepfake-shield', redis);
    coalitionQueue = new Queue('coalition-forecast', redis);
    warRoomQueue = new Queue('crisis-war-room', redis);

    omniQueue.process(async job => runOmniScan({ trigger: job?.data?.trigger || 'queue' }));
    briefQueue.process(async job => generateMorningBrief({ politicianId: job?.data?.politicianId, force: true }));
    sentimentQueue.process(async () => updateSentimentScores());
    contentQueue.process(async job => generateDailyContentPack(job?.data?.politicianId));
    visitQueue.process(async job => generateVisitPlans(job?.data?.politicianId));
    sansadQueue.process(async () => runSansadSync());
    agentQueue.process(async job => runAgentSystem({ politicianId: job?.data?.politicianId }));
    deepfakeQueue.process(async job => runDeepfakeShield({ politicianId: job?.data?.politicianId }));
    coalitionQueue.process(async job => runCoalitionForecasts({ politicianId: job?.data?.politicianId }));
    warRoomQueue.process(async job => runWarRoomScan({ politicianId: job?.data?.politicianId }));

    const omniCron = process.env.OMNISCAN_CRON || '*/15 * * * *';
    const briefCron = process.env.BRIEFING_CRON || '0 0 * * *';
    const sentimentCron = process.env.SENTIMENT_CRON || '0 * * * *';
    const contentCron = process.env.CONTENT_CRON || '30 0 * * *';
    const visitCron = process.env.VISIT_CRON || '0 1 * * *';
    const sansadCron = process.env.SANSAD_CRON || '0 2 * * *';
    const agentCron = process.env.AGENT_CRON || '*/30 * * * *';
    const deepfakeCron = process.env.DEEPFAKE_CRON || '15 * * * *';
    const coalitionCron = process.env.COALITION_CRON || '0 3 * * *';
    const warRoomCron = process.env.WARROOM_CRON || '*/20 * * * *';

    omniQueue.add({ trigger: 'cron' }, { repeat: { cron: omniCron }, removeOnComplete: true });
    briefQueue.add({ trigger: 'cron' }, { repeat: { cron: briefCron }, removeOnComplete: true });
    sentimentQueue.add({}, { repeat: { cron: sentimentCron }, removeOnComplete: true });
    contentQueue.add({}, { repeat: { cron: contentCron }, removeOnComplete: true });
    visitQueue.add({}, { repeat: { cron: visitCron }, removeOnComplete: true });
    sansadQueue.add({}, { repeat: { cron: sansadCron }, removeOnComplete: true });
    agentQueue.add({}, { repeat: { cron: agentCron }, removeOnComplete: true });
    deepfakeQueue.add({}, { repeat: { cron: deepfakeCron }, removeOnComplete: true });
    coalitionQueue.add({}, { repeat: { cron: coalitionCron }, removeOnComplete: true });
    warRoomQueue.add({}, { repeat: { cron: warRoomCron }, removeOnComplete: true });

    omniQueue.on('error', err => console.error('[omniscan-queue]', err));
    briefQueue.on('error', err => console.error('[brief-queue]', err));
    sentimentQueue.on('error', err => console.error('[sentiment-queue]', err));
    contentQueue.on('error', err => console.error('[content-queue]', err));
    visitQueue.on('error', err => console.error('[visit-queue]', err));
    sansadQueue.on('error', err => console.error('[sansad-queue]', err));
    agentQueue.on('error', err => console.error('[agent-queue]', err));
    deepfakeQueue.on('error', err => console.error('[deepfake-queue]', err));
    coalitionQueue.on('error', err => console.error('[coalition-queue]', err));
    warRoomQueue.on('error', err => console.error('[warroom-queue]', err));

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

export async function enqueueSentimentUpdate() {
  if (!queuesEnabled || !sentimentQueue) {
    return updateSentimentScores();
  }
  return sentimentQueue.add({}, { removeOnComplete: true });
}

export async function enqueueContentPack(politicianId) {
  if (!queuesEnabled || !contentQueue) {
    return generateDailyContentPack(politicianId);
  }
  return contentQueue.add({ politicianId }, { removeOnComplete: true });
}

export async function enqueueVisitPlanner(politicianId) {
  if (!queuesEnabled || !visitQueue) {
    return generateVisitPlans(politicianId);
  }
  return visitQueue.add({ politicianId }, { removeOnComplete: true });
}

export async function enqueueAgentSystem(politicianId) {
  if (!queuesEnabled || !agentQueue) {
    return runAgentSystem({ politicianId });
  }
  return agentQueue.add({ politicianId }, { removeOnComplete: true });
}

export async function enqueueDeepfakeScan(politicianId) {
  if (!queuesEnabled || !deepfakeQueue) {
    return runDeepfakeShield({ politicianId });
  }
  return deepfakeQueue.add({ politicianId }, { removeOnComplete: true });
}

export async function enqueueCoalitionForecast(politicianId) {
  if (!queuesEnabled || !coalitionQueue) {
    return runCoalitionForecasts({ politicianId });
  }
  return coalitionQueue.add({ politicianId }, { removeOnComplete: true });
}

export async function enqueueWarRoomScan(politicianId) {
  if (!queuesEnabled || !warRoomQueue) {
    return runWarRoomScan({ politicianId });
  }
  return warRoomQueue.add({ politicianId }, { removeOnComplete: true });
}

export function getQueuesStatus() {
  return {
    enabled: queuesEnabled,
    omni: getOmniScanStatus(),
    agent: !!agentQueue,
    deepfake: !!deepfakeQueue,
    coalition: !!coalitionQueue,
    warroom: !!warRoomQueue,
  };
}
