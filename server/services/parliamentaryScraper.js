import axios from 'axios';
import puppeteer from 'puppeteer';

// Parliamentary Activity Scraper for Sansad.in

export async function scrapeParliamentaryActivity(politicianId, fullName) {
  console.log('[parliamentary] Scraping activity for:', fullName);
  
  try {
    const activity = {
      questions_raised: 0,
      starred_questions: 0,
      debates_participated: 0,
      speech_minutes: 0,
      bills_voting: 0,
      recent_questions: [],
      recent_debates: [],
      recent_bills: [],
      last_updated: new Date().toISOString()
    };

    // Scrape Lok Sabha activity
    const lokSabhaData = await scrapeLokSabhaActivity(fullName);
    if (lokSabhaData) {
      Object.assign(activity, lokSabhaData);
    }

    // Scrape Rajya Sabha activity  
    const rajyaSabhaData = await scrapeRajyaSabhaActivity(fullName);
    if (rajyaSabhaData) {
      // Merge with existing data (add values)
      Object.keys(rajyaSabhaData).forEach(key => {
        if (typeof activity[key] === 'number' && typeof rajyaSabhaData[key] === 'number') {
          activity[key] += rajyaSabhaData[key];
        } else if (Array.isArray(activity[key]) && Array.isArray(rajyaSabhaData[key])) {
          activity[key] = [...activity[key], ...rajyaSabhaData[key]];
        }
      });
    }

    console.log('[parliamentary] Activity scraped successfully');
    return activity;
    
  } catch (error) {
    console.error('[parliamentary] Scraping failed:', error.message);
    return {
      questions_raised: 0,
      starred_questions: 0,
      debates_participated: 0,
      speech_minutes: 0,
      bills_voting: 0,
      recent_questions: [],
      recent_debates: [],
      recent_bills: [],
      last_updated: new Date().toISOString(),
      error: error.message
    };
  }
}

// LOK SABHA ACTIVITY SCRAPING
async function scrapeLokSabhaActivity(fullName) {
  try {
    console.log('[loksabha-activity] Scraping for:', fullName);
    
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      headless: true
    });
    
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    // Navigate to Sansad Lok Sabha search
    await page.goto('https://sansad.in/ls', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    // Search for politician
    try {
      await page.waitForSelector('input[type="search"], #search-member', { timeout: 10000 });
      await page.type('input[type="search"], #search-member', fullName);
      await page.click('.search-button, button[type="submit"]');
      
      // Wait for results and click on first result
      await page.waitForSelector('.member-card, .member-result', { timeout: 15000 });
      await page.click('.member-card:first-child, .member-result:first-child');
      
      // Wait for member profile page
      await page.waitForSelector('.member-profile, .profile-content', { timeout: 15000 });
      
      // Extract parliamentary activity data
      const activityData = await page.evaluate(() => {
        const data = {};
        
        // Questions section
        const questionsEl = document.querySelector('.questions-count, [data-section="questions"] .count');
        if (questionsEl) data.questions_raised = parseInt(questionsEl.textContent) || 0;
        
        const starredEl = document.querySelector('.starred-count, [data-section="starred"] .count');
        if (starredEl) data.starred_questions = parseInt(starredEl.textContent) || 0;
        
        // Debates section
        const debatesEl = document.querySelector('.debates-count, [data-section="debates"] .count');
        if (debatesEl) data.debates_participated = parseInt(debatesEl.textContent) || 0;
        
        const speechEl = document.querySelector('.speech-minutes, [data-section="speech"] .minutes');
        if (speechEl) data.speech_minutes = parseInt(speechEl.textContent) || 0;
        
        // Bills section
        const billsEl = document.querySelector('.bills-count, [data-section="bills"] .count');
        if (billsEl) data.bills_voting = parseInt(billsEl.textContent) || 0;
        
        // Recent questions (extract titles and dates)
        const recentQuestions = [];
        const questionElements = document.querySelectorAll('.recent-questions li, .question-item');
        questionElements.forEach(el => {
          const title = el.querySelector('.question-title, h4')?.textContent?.trim();
          const date = el.querySelector('.question-date, .date')?.textContent?.trim();
          if (title) {
            recentQuestions.push({ title, date });
          }
        });
        data.recent_questions = recentQuestions.slice(0, 5); // Last 5 questions
        
        // Recent debates
        const recentDebates = [];
        const debateElements = document.querySelectorAll('.recent-debates li, .debate-item');
        debateElements.forEach(el => {
          const title = el.querySelector('.debate-title, h4')?.textContent?.trim();
          const date = el.querySelector('.debate-date, .date')?.textContent?.trim();
          if (title) {
            recentDebates.push({ title, date });
          }
        });
        data.recent_debates = recentDebates.slice(0, 5); // Last 5 debates
        
        // Recent bills
        const recentBills = [];
        const billElements = document.querySelectorAll('.recent-bills li, .bill-item');
        billElements.forEach(el => {
          const title = el.querySelector('.bill-title, h4')?.textContent?.trim();
          const status = el.querySelector('.bill-status, .status')?.textContent?.trim();
          if (title) {
            recentBills.push({ title, status });
          }
        });
        data.recent_bills = recentBills.slice(0, 5); // Last 5 bills
        
        return data;
      });
      
      await browser.close();
      return activityData;
      
    } catch (error) {
      console.warn('[loksabha-activity] Scraping failed:', error.message);
      await browser.close();
      return null;
    }
    
  } catch (error) {
    console.warn('[loksabha-activity] Browser launch failed:', error.message);
    return null;
  }
}

// RAJYA SABHA ACTIVITY SCRAPING
async function scrapeRajyaSabhaActivity(fullName) {
  try {
    console.log('[rajyasabha-activity] Scraping for:', fullName);
    
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      headless: true
    });
    
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    // Navigate to Sansad Rajya Sabha
    await page.goto('https://sansad.in/rs', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    // Search for politician
    try {
      await page.waitForSelector('input[type="search"], #rs-search', { timeout: 10000 });
      await page.type('input[type="search"], #rs-search', fullName);
      await page.click('.search-btn, #rs-search-btn');
      
      // Wait for results and click on first result
      await page.waitForSelector('.rs-member, .senator-card', { timeout: 15000 });
      await page.click('.rs-member:first-child, .senator-card:first-child');
      
      // Wait for member profile page
      await page.waitForSelector('.member-profile, .profile-content', { timeout: 15000 });
      
      // Extract parliamentary activity data
      const activityData = await page.evaluate(() => {
        const data = {};
        
        // Questions section
        const questionsEl = document.querySelector('.questions-count, [data-section="questions"] .count');
        if (questionsEl) data.questions_raised = parseInt(questionsEl.textContent) || 0;
        
        const starredEl = document.querySelector('.starred-count, [data-section="starred"] .count');
        if (starredEl) data.starred_questions = parseInt(starredEl.textContent) || 0;
        
        // Debates section
        const debatesEl = document.querySelector('.debates-count, [data-section="debates"] .count');
        if (debatesEl) data.debates_participated = parseInt(debatesEl.textContent) || 0;
        
        const speechEl = document.querySelector('.speech-minutes, [data-section="speech"] .minutes');
        if (speechEl) data.speech_minutes = parseInt(speechEl.textContent) || 0;
        
        // Bills section
        const billsEl = document.querySelector('.bills-count, [data-section="bills"] .count');
        if (billsEl) data.bills_voting = parseInt(billsEl.textContent) || 0;
        
        // Recent questions
        const recentQuestions = [];
        const questionElements = document.querySelectorAll('.recent-questions li, .question-item');
        questionElements.forEach(el => {
          const title = el.querySelector('.question-title, h4')?.textContent?.trim();
          const date = el.querySelector('.question-date, .date')?.textContent?.trim();
          if (title) {
            recentQuestions.push({ title, date });
          }
        });
        data.recent_questions = recentQuestions.slice(0, 5);
        
        // Recent debates
        const recentDebates = [];
        const debateElements = document.querySelectorAll('.recent-debates li, .debate-item');
        debateElements.forEach(el => {
          const title = el.querySelector('.debate-title, h4')?.textContent?.trim();
          const date = el.querySelector('.debate-date, .date')?.textContent?.trim();
          if (title) {
            recentDebates.push({ title, date });
          }
        });
        data.recent_debates = recentDebates.slice(0, 5);
        
        // Recent bills
        const recentBills = [];
        const billElements = document.querySelectorAll('.recent-bills li, .bill-item');
        billElements.forEach(el => {
          const title = el.querySelector('.bill-title, h4')?.textContent?.trim();
          const status = el.querySelector('.bill-status, .status')?.textContent?.trim();
          if (title) {
            recentBills.push({ title, status });
          }
        });
        data.recent_bills = recentBills.slice(0, 5);
        
        return data;
      });
      
      await browser.close();
      return activityData;
      
    } catch (error) {
      console.warn('[rajyasabha-activity] Scraping failed:', error.message);
      await browser.close();
      return null;
    }
    
  } catch (error) {
    console.warn('[rajyasabha-activity] Browser launch failed:', error.message);
    return null;
  }
}

// Export functions
export { scrapeParliamentaryActivity };
