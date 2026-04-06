/**
 * Simple scheduler — replaces bull/redis with setInterval
 * No Redis required, works on any VPS
 */
import { runOmniScan } from './services/omniscan.js';
import { generateMorningBrief } from './services/briefing.js';
import { updateSentimentScores } from './services/sentiment.js';
import { generateDailyContentPack } from './services/contentFactory.js';
import { generateVisitPlans } from './services/visitPlanner.js';
import { runAgentSystem } from './services/agentSystem.js';
import { runDeepfakeShield } from './services/deepfakeShield.js';
import { runCoalitionForecasts } from './services/coalitionForecast.js';
import { runWarRoomScan } from './services/warRoom.js';

const jobs = {};

function safe(name, fn) {
  return async (...args) => {
    try { return await fn(...args); }
    catch (e) { console.warn('[queue] ' + name + ' failed:', e.message); }
  };
}

export function initQueues() {
  console.log('[queues] Simple scheduler starting (no Redis required)');
  jobs.sentiment = setInterval(safe('sentiment', () => updateSentimentScores()), 30 * 60 * 1000);
  jobs.omniscan  = setInterval(safe('omniscan',  () => runOmniScan()),           15 * 60 * 1000);
  console.log('[queues] Scheduler ready');
}

export function getQueuesStatus() {
  return { type: 'simple-scheduler', running: Object.keys(jobs) };
}

export async function enqueueMorningBrief(p) {
  const id = (p && typeof p === 'object') ? p.politicianId : p;
  return safe('brief', () => generateMorningBrief(id))();
}
export async function enqueueSentimentUpdate() { return safe('sentiment', () => updateSentimentScores())(); }
export async function enqueueOmniScan()        { return safe('omniscan',  () => runOmniScan())(); }
export async function enqueueContentPack(p)    { return safe('content',   () => generateDailyContentPack(p))(); }
export async function enqueueVisitPlanner(p)   { return safe('visit',     () => generateVisitPlans(p))(); }
export async function enqueueAgentSystem(p)    { return safe('agent',     () => runAgentSystem(p))(); }
export async function enqueueDeepfakeScan(p)   { return safe('deepfake',  () => runDeepfakeShield(p))(); }
export async function enqueueCoalitionForecast(p) { return safe('coalition', () => runCoalitionForecasts(p))(); }
export async function enqueueWarRoomScan(p)    { return safe('warroom',   () => runWarRoomScan(p))(); }
