import Parser from 'rss-parser';
import fetch from 'node-fetch';
import pool from '../db.js';
import { getApiKey } from './secretStore.js';

const parser = new Parser({ 
  timeout: 10000,
  customFields: {
    item: ['description', 'content', 'contentSnippet', 'dc:creator', 'category']
  }
});

// ═══════════════════════════════════════════════════════════════
// COMPREHENSIVE RSS SOURCES - 30+ Sources
// ═══════════════════════════════════════════════════════════════
const RSS_SOURCES = [
  // ── NATIONAL ENGLISH (10) ─────────────────────────────────────
  { name: 'The Hindu', url: 'https://www.thehindu.com/news/national/feeder/default.rss', type: 'Newspaper', language: 'English', region: 'National' },
  { name: 'The Hindu - AP', url: 'https://www.thehindu.com/news/national/andhra-pradesh/feeder/default.rss', type: 'Newspaper', language: 'English', region: 'Andhra' },
  { name: 'Times of India', url: 'https://timesofindia.indiatimes.com/rssfeeds/-2128838597.cms', type: 'Newspaper', language: 'English', region: 'National' },
  { name: 'TOI - AP', url: 'https://timesofindia.indiatimes.com/rssfeeds/1281687.cms', type: 'Newspaper', language: 'English', region: 'Andhra' },
  { name: 'Indian Express', url: 'https://indianexpress.com/feed/', type: 'Newspaper', language: 'English', region: 'National' },
  { name: 'Hindustan Times', url: 'https://www.hindustantimes.com/feeds/rss/india-news/rssfeed.xml', type: 'Newspaper', language: 'English', region: 'National' },
  { name: 'NDTV', url: 'https://feeds.feedburner.com/ndtvnews-top-stories', type: 'Online', language: 'English', region: 'National' },
  { name: 'India Today', url: 'https://www.indiatoday.in/rss/feed', type: 'Magazine', language: 'English', region: 'National' },
  { name: 'Deccan Chronicle', url: 'https://www.deccanchronicle.com/rss', type: 'Newspaper', language: 'English', region: 'South' },
  { name: 'The News Minute', url: 'https://www.thenewsminute.com/rss', type: 'Online', language: 'English', region: 'South' },
  

  // ── TELUGU REGIONAL (60 Sources) - Complete RSS Feed List ─────────────────────────────────────
  { name: 'NTV Telugu', url: 'https://ntvtelugu.com/feed', type: 'TV', language: 'Telugu', region: 'AP/Telangana' },
  { name: 'Mana Telangana', url: 'https://manatelangana.news/feed', type: 'Newspaper', language: 'Telugu', region: 'Telangana' },
  { name: 'Nava Telangana', url: 'https://navatelangana.com/feed', type: 'Newspaper', language: 'Telugu', region: 'Telangana' },
  { name: 'Visala Andhra', url: 'https://visalaandhra.com/feed', type: 'Newspaper', language: 'Telugu', region: 'Andhra' },
  { name: 'OkTelugu', url: 'https://oktelugu.com/feed', type: 'Online', language: 'Telugu', region: 'AP/Telangana' },
  { name: 'Telugu Bulletin', url: 'https://telugubulletin.com/feed', type: 'Online', language: 'Telugu', region: 'AP/Telangana' },
  { name: 'Telugu Stop', url: 'https://telugustop.com/feed', type: 'Online', language: 'Telugu', region: 'AP/Telangana' },
  { name: 'V6 Velugu', url: 'https://v6velugu.com/feed', type: 'TV', language: 'Telugu', region: 'Telangana' },
  { name: 'Telugu Rajyam', url: 'https://telugurajyam.com/feed', type: 'Newspaper', language: 'Telugu', region: 'AP/Telangana' },
  { name: 'Adya News', url: 'https://adya.news/telugu/feed', type: 'Online', language: 'Telugu', region: 'AP/Telangana' },
  { name: 'Namasthe Telangana', url: 'https://ntnews.com/news/feed', type: 'Newspaper', language: 'Telugu', region: 'Telangana' },
  { name: 'Telugu360', url: 'https://telugu360.com/feed', type: 'Entertainment', language: 'Telugu', region: 'AP/Telangana' },
  { name: 'Telugu Journalist', url: 'https://telugujournalist.com/feed', type: 'Online', language: 'Telugu', region: 'AP/Telangana' },
  { name: 'Netidhathri', url: 'https://netidhatri.com/feed', type: 'Online', language: 'Telugu', region: 'Telangana' },
  { name: 'Gulte', url: 'https://telugu.gulte.com/feed', type: 'Entertainment', language: 'Telugu', region: 'AP/Telangana' },
  { name: 'Telugu Mirchi', url: 'https://telugumirchi.com/telugu/feed', type: 'Entertainment', language: 'Telugu', region: 'AP/Telangana' },
  { name: 'Prajatantra News', url: 'https://prajatantranews.com/feed', type: 'Newspaper', language: 'Telugu', region: 'Telangana' },
  { name: 'TeluguISM', url: 'https://teluguism.com/feed', type: 'Online', language: 'Telugu', region: 'AP/Telangana' },
  { name: 'Telugu Post', url: 'https://telugupost.com/latest-news/feed', type: 'Online', language: 'Telugu', region: 'AP/Telangana' },
  { name: '10 TV', url: 'https://10tv.in/latest/feed', type: 'TV', language: 'Telugu', region: 'Andhra' },
  { name: 'Manalokam', url: 'https://manalokam.com/news/feed', type: 'Online', language: 'Telugu', region: 'AP/Telangana' },
  { name: 'Telugu Bullet', url: 'https://telugu.telugubullet.com/feed', type: 'Online', language: 'Telugu', region: 'AP/Telangana' },
  { name: 'Iranews', url: 'https://iranewspaper.com/feed', type: 'Newspaper', language: 'Telugu', region: 'AP/Telangana' },
  { name: 'Namasteandhra', url: 'https://namasteandhra.com/feed', type: 'Newspaper', language: 'Telugu', region: 'Andhra' },
  { name: 'Andhrajyothy', url: 'https://andhrajyothy.com/rss/feed.xml', type: 'Newspaper', language: 'Telugu', region: 'AP/Telangana' },
  { name: 'NewsOrbit', url: 'https://newsorbit.com/feed', type: 'Online', language: 'Telugu', region: 'AP/Telangana' },
  { name: 'Mana Aksharam', url: 'https://manaaksharam.com/feed', type: 'Online', language: 'Telugu', region: 'Telangana' },
  { name: 'GreatAndhra', url: 'https://telugu.greatandhra.com/feed', type: 'Online', language: 'Telugu', region: 'Andhra' },
  { name: 'Tupaki', url: 'https://tupaki.com/feed', type: 'Entertainment', language: 'Telugu', region: 'AP/Telangana' },
  { name: 'TeluguOne', url: 'https://teluguone.com/news/feed', type: 'Online', language: 'Telugu', region: 'AP/Telangana' },
  { name: 'Andhrawatch', url: 'https://andhrawatch.com/feed', type: 'Online', language: 'Telugu', region: 'Andhra' },
  { name: 'Oneindia Telugu', url: 'https://telugu.oneindia.com/feed', type: 'Online', language: 'Telugu', region: 'AP/Telangana' },
  { name: 'Janam Sakshi', url: 'https://janamsakshi.org/feed', type: 'Newspaper', language: 'Telugu', region: 'Andhra' },
  { name: 'Asianet News Telugu', url: 'https://telugu.asianetnews.com/rss', type: 'TV', language: 'Telugu', region: 'AP/Telangana' },
  { name: 'M9News', url: 'https://m9.news/feed', type: 'Entertainment', language: 'Telugu', region: 'AP/Telangana' },
  { name: 'BBC News Telugu', url: 'https://feeds.bbci.co.uk/telugu/rss.xml', type: 'International', language: 'Telugu', region: 'AP/Telangana' },
  { name: 'Sakshi Post', url: 'https://sakshipost.com/feed', type: 'Newspaper', language: 'Telugu', region: 'AP/Telangana' },
  { name: 'TeluguPeople', url: 'https://telugupeople.com/feed', type: 'Online', language: 'Telugu', region: 'AP/Telangana' },
  { name: 'Telugu Gateway', url: 'https://telugugateway.com/feed', type: 'Online', language: 'Telugu', region: 'AP/Telangana' },
  { name: 'Vaartha', url: 'https://vaartha.com/feed', type: 'Newspaper', language: 'Telugu', region: 'Andhra' },
  { name: 'Suryaa', url: 'https://suryaa.com/feed', type: 'Newspaper', language: 'Telugu', region: 'Andhra' },
  { name: 'News 18 Telugu', url: 'https://telugu.news18.com/rss', type: 'TV', language: 'Telugu', region: 'AP/Telangana' },
  { name: 'Telugu Times', url: 'https://telugutimes.net/feed', type: 'NRI', language: 'Telugu', region: 'Global' },
  { name: 'Eenadu', url: 'https://news.google.com/rss/search?q=Eenadu&hl=te-IN&gl=IN&ceid=IN:te', type: 'Newspaper', language: 'Telugu', region: 'AP/Telangana' },
  { name: 'TV5 News', url: 'https://tv5news.in/feed', type: 'TV', language: 'Telugu', region: 'AP/Telangana' },
  { name: 'AP7AM', url: 'https://ap7am.com/feed', type: 'Online', language: 'Telugu', region: 'Andhra' },
  { name: 'Andhra Headlines', url: 'https://andhraheadlines.com/feed', type: 'Online', language: 'Telugu', region: 'Andhra' },
  { name: 'Prajapalana', url: 'https://prajapalana.com/feed', type: 'Online', language: 'Telugu', region: 'AP/Telangana' },
  { name: 'Sakshi', url: 'https://news.google.com/rss/search?q=Sakshi+news&hl=te-IN&gl=IN&ceid=IN:te', type: 'Newspaper', language: 'Telugu', region: 'AP/Telangana' },
  { name: 'Prajasakti', url: 'https://prajasakti.com/feed', type: 'Newspaper', language: 'Telugu', region: 'Andhra' },
  { name: 'T News', url: 'https://tnewstelugu.com/feed', type: 'TV', language: 'Telugu', region: 'Telangana' },
  { name: 'Samayam Telugu', url: 'https://telugu.samayam.com/rss', type: 'Online', language: 'Telugu', region: 'AP/Telangana' },
  { name: 'Webdunia Telugu', url: 'https://telugu.webdunia.com/rss', type: 'Online', language: 'Telugu', region: 'AP/Telangana' },
  { name: 'Telugu Global', url: 'https://teluguglobal.com/feed', type: 'Online', language: 'Telugu', region: 'AP/Telangana' },
  { name: 'TV9 Telugu', url: 'https://news.google.com/rss/search?q=TV9+Telugu&hl=te-IN&gl=IN&ceid=IN:te', type: 'TV', language: 'Telugu', region: 'AP/Telangana' },
  { name: 'ABN Telugu', url: 'https://news.google.com/rss/search?q=ABN+Telugu&hl=te-IN&gl=IN&ceid=IN:te', type: 'TV', language: 'Telugu', region: 'Andhra' },
  { name: 'ETV Telugu', url: 'https://news.google.com/rss/search?q=ETV+Telugu&hl=te-IN&gl=IN&ceid=IN:te', type: 'TV', language: 'Telugu', region: 'AP/Telangana' },
  { name: 'Zee News Telugu', url: 'https://news.google.com/rss/search?q=Zee+News+Telugu&hl=te-IN&gl=IN&ceid=IN:te', type: 'TV', language: 'Telugu', region: 'AP/Telangana' },
  { name: 'Republic Telugu', url: 'https://news.google.com/rss/search?q=Republic+Telugu&hl=te-IN&gl=IN&ceid=IN:te', type: 'TV', language: 'Telugu', region: 'AP/Telangana' },
  { name: 'HMTV', url: 'https://news.google.com/rss/search?q=HMTV+Telugu&hl=te-IN&gl=IN&ceid=IN:te', type: 'TV', language: 'Telugu', region: 'Telangana' },
  { name: 'Raj News Telugu', url: 'https://news.google.com/rss/search?q=Raj+News+Telugu&hl=te-IN&gl=IN&ceid=IN:te', type: 'TV', language: 'Telugu', region: 'AP/Telangana' },
  { name: 'CVR News', url: 'https://news.google.com/rss/search?q=CVR+News+Telugu&hl=te-IN&gl=IN&ceid=IN:te', type: 'TV', language: 'Telugu', region: 'AP/Telangana' },
  { name: 'Maha News', url: 'https://news.google.com/rss/search?q=Maha+News+Telugu&hl=te-IN&gl=IN&ceid=IN:te', type: 'TV', language: 'Telugu', region: 'AP/Telangana' },
  { name: 'Kushi TV', url: 'https://news.google.com/rss/search?q=Kushi+TV+Telugu&hl=te-IN&gl=IN&ceid=IN:te', type: 'TV', language: 'Telugu', region: 'AP/Telangana' },
  { name: 'Bhakthi TV', url: 'https://news.google.com/rss/search?q=Bhakthi+TV&hl=te-IN&gl=IN&ceid=IN:te', type: 'TV', language: 'Telugu', region: 'AP/Telangana' },
  { name: 'Dighvijay News', url: 'https://news.google.com/rss/search?q=Dighvijay+News&hl=te-IN&gl=IN&ceid=IN:te', type: 'TV', language: 'Telugu', region: 'Telangana' },
  { name: 'V6 News', url: 'https://news.google.com/rss/search?q=V6+News+Telugu&hl=te-IN&gl=IN&ceid=IN:te', type: 'TV', language: 'Telugu', region: 'Telangana' },
  { name: 'N1 TV', url: 'https://news.google.com/rss/search?q=N1+TV+Telugu&hl=te-IN&gl=IN&ceid=IN:te', type: 'TV', language: 'Telugu', region: 'Andhra' },
  { name: 'Kaveri TV', url: 'https://news.google.com/rss/search?q=Kaveri+TV+Telugu&hl=te-IN&gl=IN&ceid=IN:te', type: 'TV', language: 'Telugu', region: 'Telangana' },
  { name: 'Hindu Telugu', url: 'https://www.thehindu.com/news/national/andhra-pradesh/feeder/default.rss', type: 'Newspaper', language: 'Telugu', region: 'Andhra' },

  { name: 'Google News - AP', url: 'https://news.google.com/rss/search?q=Andhra+Pradesh&hl=te-IN&gl=IN&ceid=IN:te', type: 'Aggregator', language: 'Telugu', region: 'Andhra' },
  { name: 'Google News - AP Politics', url: 'https://news.google.com/rss/search?q=Andhra+Pradesh+politics+CM+minister&hl=te-IN&gl=IN&ceid=IN:te', type: 'Aggregator', language: 'Telugu', region: 'Andhra' },
  { name: 'Google News - TDP', url: 'https://news.google.com/rss/search?q=TDP+Telugu+Desam+Party&hl=te-IN&gl=IN&ceid=IN:te', type: 'Aggregator', language: 'Telugu', region: 'AP/Telangana' },
  { name: 'Google News - YSRCP', url: 'https://news.google.com/rss/search?q=YSRCP+Yeduguri+Jagan&hl=te-IN&gl=IN&ceid=IN:te', type: 'Aggregator', language: 'Telugu', region: 'Andhra' },
  
  // ── PRESS INFORMATION (3) ─────────────────────────────────────
  { name: 'PIB - AP', url: 'https://pib.gov.in/rss/AndhraPradesh', type: 'Government', language: 'English', region: 'Andhra' },
  { name: 'PIB - Telangana', url: 'https://pib.gov.in/rss/Telangana', type: 'Government', language: 'English', region: 'Telangana' },
  { name: 'DD News', url: 'https://ddnews.gov.in/rss', type: 'TV', language: 'English', region: 'National' },
];

// ── YOUTUBE CHANNELS ───────────────────────────────────────────
const YOUTUBE_CHANNELS = [
  { name: 'TDP Official', id: 'UCfG6zYlXXjTfGzqjJqKqKqA' },
  { name: 'TV9 Telugu', id: 'UCqK8G9jJZjJ9jJ9jJ9jJ9jJ9' },
  { name: 'ABN Telugu', id: 'UCrK8G9jJZjJ9jJ9jJ9jJ9jJ9' },
  { name: 'ETV Andhra', id: 'UCsK8G9jJZjJ9jJ9jJ9jJ9jJ9' },
  { name: '10TV Telugu', id: 'UCtK8G9jJZjJ9jJ9jJ9jJ9jJ9' },
];

// ── SENTIMENT KEYWORDS (Telugu + English) ──────────────────────
const NEGATIVE_HINTS = [
  'protest', 'attack', 'violence', 'corruption', 'scam', 'criticism', 'resign', 'arrest', 
  'delay', 'complaint', 'controversy', 'allegation', 'fraud', 'scandal', 'death', 'accident',
  // Telugu negative words (transliterated)
  'nindu', 'thappu', 'corruption', 'abbayi', 'chavu', 'pramadham', 'vyaktam', 'nirbandham'
];
const POSITIVE_HINTS = [
  'inaugurate', 'launch', 'approved', 'award', 'wins', 'success', 'growth', 'boost', 
  'relief', 'support', 'development', 'scheme', 'benefit', 'achievement', 'record', 
  'progress', 'welfare', 'fund', 'grant',
  // Telugu positive words (transliterated)
  'vijayam', 'abivruddhi', 'panulu', 'pampu', 'sanmanam', 'karyakramam', 'laabhama'
];

// ── STATUS TRACKING ────────────────────────────────────────────
const status = {
  lastRun: null,
  lastError: null,
  lastDurationMs: 0,
  counts: { rss: 0, youtube: 0, twitter: 0, facebook: 0, instagram: 0, whatsapp: 0, skipped: 0, googleNews: 0, total: 0 },
  sources: {},
  politiciansScanned: [],
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
  const negativeCount = NEGATIVE_HINTS.filter(k => t.includes(k)).length;
  const positiveCount = POSITIVE_HINTS.filter(k => t.includes(k)).length;
  
  if (negativeCount > positiveCount) return 'Negative';
  if (positiveCount > negativeCount) return 'Positive';
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
      'SELECT id FROM media_mentions WHERE headline = ? AND source = ? LIMIT 1',
      [mention.headline, mention.source]
    );
    if (rows.length) return false;
  }
  await safeInsert('media_mentions', mention);
  return true;
}

async function fetchPoliticians() {
  const [rows] = await pool.query("SELECT id, full_name, display_name, constituency_name, party FROM politician_profiles WHERE is_active = 1 AND (role = 'politician' OR role IS NULL)");
  return rows || [];
}

// ── BUILD SEARCH KEYWORDS PER POLITICIAN ───────────────────────

// ── BUILD SEARCH KEYWORDS PER POLITICIAN (FROM DB) ─────────────
async function buildPoliticianKeywords(politician) {
  const keywords = new Set();
  
  // Get keywords from database
  const [dbKeywords] = await pool.query(
    'SELECT keyword, keyword_type FROM politician_keywords WHERE politician_id = ? AND is_active = 1',
    [politician.id]
  );
  
  // Add DB keywords
  for (const row of dbKeywords) {
    keywords.add(row.keyword.toLowerCase());
  }
  
  // If no DB keywords, fall back to profile data
  if (dbKeywords.length === 0) {
    if (politician.full_name) {
      keywords.add(politician.full_name.toLowerCase());
      keywords.add(politician.full_name.split(' ').slice(0, 2).join(' ').toLowerCase());
      keywords.add(politician.full_name.split(' ').pop().toLowerCase());
    }
    if (politician.display_name) {
      keywords.add(politician.display_name.toLowerCase());
    }
    if (politician.constituency_name) {
      keywords.add(politician.constituency_name.toLowerCase());
      keywords.add(`${politician.constituency_name} MLA`.toLowerCase());
      keywords.add(`${politician.constituency_name} MP`.toLowerCase());
    }
    if (politician.party) {
      keywords.add(politician.party.toLowerCase());
      if (politician.party.includes('Telugu Desam')) {
        keywords.add('tdp');
        keywords.add('chandrababu');
      }
      if (politician.party.includes('YSRCP')) {
        keywords.add('ysrcp');
        keywords.add('jagan');
      }
    }
  }
  
  return Array.from(keywords);
}


// ── CHECK IF TEXT MENTIONS POLITICIAN ──────────────────────────
async function findPoliticianMatch(text, politicians) {
  const t = text.toLowerCase();
  
  for (const politician of politicians) {
    const keywords = await buildPoliticianKeywords(politician);
    const matchCount = keywords.filter(k => t.includes(k)).length;
    
    // Need at least 2 keyword matches to avoid false positives
    if (matchCount >= 2) {
      return { politician_id: politician.id, matchCount, keywords };
    }
  }
  
  return null;
}

// ── SCRAPE RSS WITH POLITICIAN-CENTRIC SEARCH ──────────────────
async function scrapeRSSForPoliticians(politicians) {
  let totalMentions = 0;
  
  for (const source of RSS_SOURCES) {
    try {
      console.log(`[omniscan] Scraping ${source.name}...`);
      const feed = await parser.parseURL(source.url);
      status.sources[source.name] = feed.items?.length || 0;
      
      for (const item of feed.items || []) {
        const title = item.title || '';
        const snippet = item.contentSnippet || item.content || '';
        const description = item.description || '';
        const text = `${title} ${snippet} ${description}`.toLowerCase();
        
        // Find which politician this mention is about
        const match = await findPoliticianMatch(text, politicians);
        
        if (!match) {
          status.counts.skipped += 1;
          continue;
        }
        
        const published_at = item.pubDate ? new Date(item.pubDate) : new Date();
        
        const mention = {
          headline: title.slice(0, 500),
          source: source.name,
          source_type: source.type,
          sentiment: inferSentiment(text),
          language: source.language,
          url: item.link || '',
          published_at: published_at.toISOString().slice(0, 19).replace('T', ' '),
          summary: snippet?.slice(0, 1000) || description?.slice(0, 1000) || '',
          tags: JSON.stringify(['omniscan', 'rss', source.region, source.language]),
          is_read: 0,
          reach: 0,
          politician_id: match.politician_id,
        };
        
        const inserted = await insertMention(mention);
        if (inserted) {
          totalMentions += 1;
          if (source.name.includes('Google')) status.counts.googleNews += 1;
          else status.counts.rss += 1;
        }
        
        await maybeInsertOpposition(`${title} ${snippet}`, match.politician_id);
      }
    } catch (err) {
      status.lastError = `RSS ${source.name}: ${err.message || err}`;
      console.warn('[omniscan-rss]', source.name, err.message);
    }
  }
  
  return totalMentions;
}

// ── SCRAPE YOUTUBE WITH POLITICIAN SEARCH ──────────────────────
async function scrapeYouTubeForPoliticians(politicians) {
  let totalMentions = 0;
  const ytKey = await getApiKey('YOUTUBE_API_KEY');
  
  // Method 1: YouTube Data API (if key available)
  if (ytKey) {
    for (const politician of politicians) {
      const keywords = await buildPoliticianKeywords(politician);
      const searchQuery = keywords.slice(0, 5).join(' OR ');
      
      try {
        const encodedQuery = encodeURIComponent(searchQuery);
        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodedQuery}&maxResults=10&order=date&type=video&key=${ytKey}`;
        
        const res = await fetch(url);
        if (!res.ok) continue;
        
        const data = await res.json();
        
        for (const item of data.items || []) {
          const title = item.snippet?.title || '';
          const description = item.snippet?.description || '';
          const text = `${title} ${description}`.toLowerCase();
          const published_at = item.snippet?.publishedAt ? new Date(item.snippet.publishedAt) : new Date();
          const videoId = item.id?.videoId;
          
          const mention = {
            headline: title.slice(0, 500),
            source: 'YouTube',
            source_type: 'Video',
            sentiment: inferSentiment(text),
            language: 'Telugu',
            url: videoId ? `https://www.youtube.com/watch?v=${videoId}` : '',
            published_at: published_at.toISOString().slice(0, 19).replace('T', ' '),
            summary: description?.slice(0, 1000) || '',
            tags: JSON.stringify(['omniscan', 'youtube', 'api']),
            is_read: 0,
            reach: 0,
            politician_id: politician.id,
          };
          
          const inserted = await insertMention(mention);
          if (inserted) {
            totalMentions += 1;
            status.counts.youtube += 1;
          }
        }
      } catch (err) {
        console.warn('[omniscan-youtube-api]', politician.full_name, err.message);
      }
    }
  }
  
  // Method 2: YouTube RSS fallback (no API key needed)
  for (const politician of politicians) {
    const searchTerms = [
      politician.full_name,
      `${politician.full_name} ${politician.constituency_name || ''}`,
      `${politician.display_name || ''} news`,
      `${politician.constituency_name || ''} ${politician.party || ''}`,
    ].filter(Boolean);
    
    for (const search of searchTerms) {
      try {
        const encodedSearch = encodeURIComponent(`${search} telugu news`);
        const rssUrl = `https://www.youtube.com/feeds/videos.xml?query_string=${encodedSearch}`;
        const feed = await parser.parseURL(rssUrl);
        
        for (const item of feed.items || []) {
          const title = item.title || '';
          const text = title.toLowerCase();
          
          const keywords = await buildPoliticianKeywords(politician);
          const matchCount = keywords.filter(k => text.includes(k)).length;
          
          if (matchCount < 2) {
            status.counts.skipped += 1;
            continue;
          }
          
          const mention = {
            headline: title.slice(0, 500),
            source: 'YouTube',
            source_type: 'Video',
            sentiment: inferSentiment(text),
            language: 'Telugu',
            url: item.link || '',
            published_at: item.pubDate ? new Date(item.pubDate) : new Date(),
            summary: '',
            tags: JSON.stringify(['omniscan', 'youtube', 'rss-fallback']),
            is_read: 0,
            reach: 0,
            politician_id: politician.id,
          };
          
          const inserted = await insertMention(mention);
          if (inserted) {
            totalMentions += 1;
            status.counts.youtube += 1;
          }
        }
      } catch (err) {
        console.warn('[omniscan-youtube-rss]', search, err.message);
      }
    }
  }
  
  return totalMentions;
}

// ── SCRAPE TWITTER (if API key available) ──────────────────────
async function scrapeTwitterForPoliticians(politicians) {
  let totalMentions = 0;
  const twitterToken = await getApiKey('TWITTER_BEARER_TOKEN');
  
  if (!twitterToken) return 0;
  
  for (const politician of politicians) {
    const keywords = await buildPoliticianKeywords(politician);
    
    try {
      const query = encodeURIComponent(keywords.slice(0, 5).join(' OR '));
      const url = `https://api.twitter.com/2/tweets/search/recent?query=${query}&max_results=10&tweet.fields=created_at,author_id`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${twitterToken}` } });
      
      if (!res.ok) continue;
      
      const data = await res.json();
      
      for (const tweet of data.data || []) {
        const text = tweet.text || '';
        
        const mention = {
          headline: text.slice(0, 500),
          source: 'Twitter',
          source_type: 'Social',
          sentiment: inferSentiment(text),
          language: 'English',
          url: `https://twitter.com/status/${tweet.id}`,
          published_at: new Date(tweet.created_at).toISOString().slice(0, 19).replace('T', ' '),
          summary: '',
          tags: JSON.stringify(['omniscan', 'twitter']),
          is_read: 0,
          reach: 0,
          politician_id: politician.id,
        };
        
        const inserted = await insertMention(mention);
        if (inserted) {
          totalMentions += 1;
          status.counts.twitter += 1;
        }
        await maybeInsertOpposition(text, politician.id);
      }
    } catch (err) {
      console.warn('[omniscan-twitter]', politician.full_name, err.message);
    }
  }
  
  return totalMentions;
}

// ── MAIN SCAN FUNCTION ─────────────────────────────────────────
export async function runOmniScan({ trigger = 'cron' } = {}) {
  const start = Date.now();
  status.lastError = null;
  status.counts = { rss: 0, youtube: 0, twitter: 0, facebook: 0, instagram: 0, whatsapp: 0, skipped: 0, googleNews: 0, total: 0 };
  status.sources = {};
  status.politiciansScanned = [];
  
  try {
    const politicians = await fetchPoliticians();
    
    if (!politicians.length) {
      console.warn('[omniscan] No active politicians found');
      return status;
    }
    
    console.log(`[omniscan] Starting scan for ${politicians.length} politicians:`);
    politicians.forEach(p => console.log(`  - ${p.full_name} (${p.constituency_name})`));
    
    status.politiciansScanned = politicians.map(p => p.full_name);
    
    // Build keyword index for all politicians
    console.log('[omniscan] Building keyword index...');
    
    // Scrape all sources
    console.log('[omniscan] Scraping RSS feeds...');
    const rssCount = await scrapeRSSForPoliticians(politicians);
    
    console.log('[omniscan] Scraping YouTube...');
    const youtubeCount = await scrapeYouTubeForPoliticians(politicians);
    
    console.log('[omniscan] Scraping Twitter...');
    const twitterCount = await scrapeTwitterForPoliticians(politicians);
    
    status.counts.total = rssCount + youtubeCount + twitterCount;
    status.lastRun = new Date().toISOString().slice(0, 19).replace('T', ' ');
    status.lastDurationMs = Date.now() - start;
    
    console.log(`[omniscan] Complete in ${Math.round(status.lastDurationMs / 1000)}s`);
    console.log(`[omniscan] Found ${status.counts.total} mentions (${rssCount} RSS, ${youtubeCount} YouTube, ${twitterCount} Twitter)`);
    console.log(`[omniscan] Skipped ${status.counts.skipped} irrelevant items`);
    
    return status;
  } catch (err) {
    status.lastError = err.message || err;
    console.error('[omniscan]', err);
    throw err;
  }
}
