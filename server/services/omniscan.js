import Parser from 'rss-parser';
import pool from '../db.js';
import { getApiKey } from './secretStore.js';
import { updateSentimentScores } from './sentiment.js';

const parser = new Parser({ timeout: 10000 });

const RSS_SOURCES = [
  { name: 'The Hindu', url: 'https://www.thehindu.com/news/national/feeder/default.rss', type: 'Newspaper', language: 'English' },
  { name: 'Times of India', url: 'https://timesofindia.indiatimes.com/rssfeeds/-2128838597.cms', type: 'Newspaper', language: 'English' },
  { name: 'Indian Express', url: 'https://indianexpress.com/feed/', type: 'Newspaper', language: 'English' },
  { name: 'NDTV', url: 'https://feeds.feedburner.com/ndtvnews-top-stories', type: 'Online', language: 'English' },
  { name: 'Eenadu', url: 'https://www.eenadu.net/rss', type: 'Newspaper', language: 'Telugu' },
  { name: 'Sakshi', url: 'https://www.sakshi.com/rss.xml', type: 'Newspaper', language: 'Telugu' },
];

const NEGATIVE_HINTS = ['protest', 'attack', 'violence', 'corruption', 'scam', 'criticism', 'resign', 'arrest', 'delay', 'complaint'];
const POSITIVE_HINTS = ['inaugurate', 'launch', 'approved', 'award', 'wins', 'success', 'growth', 'boost', 'relief', 'support'];

const status = {
  lastRun: null,
  lastError: null,
  lastDurationMs: 0,
  counts: { rss: 0, youtube: 0, twitter: 0, facebook: 0, instagram: 0, whatsapp: 0, skipped: 0 },
  sources: {},
};

const OPPOSITION_KEYWORDS = (process.env.OPPOSITION_KEYWORDS || '').split(',').map(k => k.trim()).filter(Boolean);

function maybeInsertOpposition(text, politician_id) {
  if (!OPPOSITION_KEYWORDS.length || !politician_id) return false;
  const t = text.toLowerCase();
  const hit = OPPOSITION_KEYWORDS.find(k => t.includes(k.toLowerCase()));
  if (!hit) return false;
  return pool.query(
    'INSERT INTO opposition_intelligence (politician_id, opponent_name, opponent_party, opponent_constituency, activity_type, description, source, detected_at, sentiment_toward_us, threat_level) VALUES (?,?,?,?,?,?,?,?,?,?)',
    [politician_id, hit, '', '', 'Media', text.slice(0, 500), 'OmniScan', new Date(), 'Neutral', 5]
  );
}

export function getOmniScanStatus() {
  return status;
}

function inferSentiment(text) {
  const t = text.toLowerCase();
  if (NEGATIVE_HINTS.some(k => t.includes(k))) return 'Negative';
  if (POSITIVE_HINTS.some(k => t.includes(k))) return 'Positive';
  return 'Neutral';
}

async function safeInsert(table, data) {
  const keys = Object.keys(data);
  const cols = keys.map(k => `\`${k}\``).join(',');
  const ph = keys.map(() => '?').join(',');
  const values = keys.map(k => data[k]);
  try {
    await pool.query(`INSERT INTO \`${table}\` (${cols}) VALUES (${ph})`, values);
  } catch (err) {
    if (err?.code === 'ER_BAD_FIELD_ERROR' && 'politician_id' in data) {
      const { politician_id, ...rest } = data;
      const restKeys = Object.keys(rest);
      const restCols = restKeys.map(k => `\`${k}\``).join(',');
      const restPh = restKeys.map(() => '?').join(',');
      const restValues = restKeys.map(k => rest[k]);
      await pool.query(`INSERT INTO \`${table}\` (${restCols}) VALUES (${restPh})`, restValues);
      return;
    }
    throw err;
  }
}

async function insertMention(mention) {
  if (!mention.headline) return false;
  if (mention.url) {
    const [rows] = await pool.query('SELECT id FROM media_mentions WHERE url = ? LIMIT 1', [mention.url]);
    if (rows.length) return false;
  } else {
    const [rows] = await pool.query(
      'SELECT id FROM media_mentions WHERE headline = ? AND source = ? AND published_at = ? LIMIT 1',
      [mention.headline, mention.source, mention.published_at]
    );
    if (rows.length) return false;
  }
  await safeInsert('media_mentions', mention);
  return true;
}

async function fetchPoliticians() {
  const [rows] = await pool.query("SELECT id, full_name, display_name, constituency_name FROM politician_profiles WHERE is_active = 1 AND (role = 'politician' OR role IS NULL)");
  return rows || [];
}

function findPoliticianId(text, politicians) {
  const t = text.toLowerCase();
  for (const p of politicians) {
    const names = [p.full_name, p.display_name, p.constituency_name].filter(Boolean);
    if (names.some(n => t.includes(String(n).toLowerCase()))) return p.id;
  }
  return null;
}

function buildKeywords(politicians) {
  const env = process.env.OMNISCAN_KEYWORDS;
  if (env) return env.split(',').map(k => k.trim()).filter(Boolean);
  return politicians.flatMap(p => [p.full_name, p.display_name, p.constituency_name]).filter(Boolean);
}

export async function runOmniScan({ trigger = 'cron' } = {}) {
  const start = Date.now();
  status.lastError = null;
  status.counts = { rss: 0, youtube: 0, twitter: 0, facebook: 0, instagram: 0, whatsapp: 0, skipped: 0 };
  status.sources = {};
  try {
    const politicians = await fetchPoliticians();
    const keywords = buildKeywords(politicians).map(k => k.toLowerCase());

    for (const source of RSS_SOURCES) {
      try {
        const feed = await parser.parseURL(source.url);
        status.sources[source.name] = feed.items?.length || 0;
        for (const item of feed.items || []) {
          const title = item.title || '';
          const snippet = item.contentSnippet || item.content || '';
          const text = `${title} ${snippet}`.toLowerCase();
          if (keywords.length && !keywords.some(k => text.includes(k))) {
            status.counts.skipped += 1;
            continue;
          }
          const politician_id = findPoliticianId(text, politicians);
          const published_at = item.pubDate ? new Date(item.pubDate) : new Date();
          const mention = {
            headline: title.slice(0, 500),
            source: source.name,
            source_type: source.type,
            sentiment: inferSentiment(text),
            language: source.language,
            url: item.link || '',
            published_at: published_at.toISOString().slice(0, 19).replace('T', ' '),
            summary: snippet?.slice(0, 1000) || '',
            tags: JSON.stringify(['omniscan', 'rss']),
            is_read: 0,
            reach: 0,
            ...(politician_id ? { politician_id } : {}),
          };
          const inserted = await insertMention(mention);
          if (inserted) status.counts.rss += 1;
          await maybeInsertOpposition(`${title} ${snippet}`, politician_id);
        }
      } catch (err) {
        status.lastError = `RSS ${source.name}: ${err.message || err}`;
      }
    }

    const ytKey = await getApiKey('YOUTUBE_API_KEY');
    const ytChannels = (process.env.YOUTUBE_CHANNELS || '').split(',').map(s => s.trim()).filter(Boolean);
    if (ytKey && ytChannels.length) {
      for (const channelId of ytChannels) {
        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=5&order=date&type=video&key=${ytKey}`;
        const res = await fetch(url);
        if (!res.ok) continue;
        const data = await res.json();
        for (const item of data.items || []) {
          const title = item.snippet?.title || '';
          const description = item.snippet?.description || '';
          const text = `${title} ${description}`.toLowerCase();
          if (keywords.length && !keywords.some(k => text.includes(k))) {
            status.counts.skipped += 1;
            continue;
          }
          const politician_id = findPoliticianId(text, politicians);
          const published_at = item.snippet?.publishedAt ? new Date(item.snippet.publishedAt) : new Date();
          const videoId = item.id?.videoId;
          const mention = {
            headline: title.slice(0, 500),
            source: 'YouTube',
            source_type: 'Online',
            sentiment: inferSentiment(text),
            language: 'English',
            url: videoId ? `https://www.youtube.com/watch?v=${videoId}` : '',
            published_at: published_at.toISOString().slice(0, 19).replace('T', ' '),
            summary: description?.slice(0, 1000) || '',
            tags: JSON.stringify(['omniscan', 'youtube']),
            is_read: 0,
            reach: 0,
            ...(politician_id ? { politician_id } : {}),
          };
          const inserted = await insertMention(mention);
          if (inserted) status.counts.youtube += 1;
          await maybeInsertOpposition(`${title} ${description}`, politician_id);
        }
      }
    }

    const twitterToken = await getApiKey('TWITTER_BEARER_TOKEN');
    if (twitterToken && keywords.length) {
      const query = encodeURIComponent(keywords.slice(0, 5).join(' OR '));
      const url = `https://api.twitter.com/2/tweets/search/recent?query=${query}&max_results=10&tweet.fields=created_at`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${twitterToken}` } });
      if (res.ok) {
        const data = await res.json();
        for (const t of data.data || []) {
          const text = t.text || '';
          const politician_id = findPoliticianId(text, politicians);
          const published_at = t.created_at ? new Date(t.created_at) : new Date();
          const mention = {
            headline: text.slice(0, 500),
            source: 'X/Twitter',
            source_type: 'Social Media',
            sentiment: inferSentiment(text),
            language: 'English',
            url: `https://x.com/i/web/status/${t.id}`,
            published_at: published_at.toISOString().slice(0, 19).replace('T', ' '),
            summary: text.slice(0, 1000),
            tags: JSON.stringify(['omniscan', 'twitter']),
            is_read: 0,
            reach: 0,
            ...(politician_id ? { politician_id } : {}),
          };
          const inserted = await insertMention(mention);
          if (inserted) status.counts.twitter += 1;
          await maybeInsertOpposition(text, politician_id);
        }
      }
    }

    status.lastRun = new Date().toISOString();
    await updateSentimentScores();
  } catch (err) {
    status.lastError = err?.message || String(err);
  } finally {
    status.lastDurationMs = Date.now() - start;
    status.trigger = trigger;
  }
  return status;
}
