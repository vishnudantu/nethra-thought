import express from 'express';
import { authMiddleware } from '../auth.js';
import { scrapePoliticianProfile, scrapeRegionalPoliticians } from '../services/scraperService.js';

const router = express.Router();

// Auto-fill politician profile
router.post('/autofill', authMiddleware, async (req, res) => {
  try {
    const { name, type = 'MP' } = req.body;
    if (!name) return res.status(400).json({ error: 'Politician name required' });

    const scrapedData = await scrapePoliticianProfile(name, type);
    
    if (scrapedData.error) {
      return res.status(404).json(scrapedData);
    }

    res.json(scrapedData);
  } catch (error) {
    console.error('[autofill]', error);
    res.status(500).json({ error: 'Failed to fetch politician data: ' + error.message });
  }
});

// Bulk scrape politicians for region
router.post('/bulk-scrape', authMiddleware, async (req, res) => {
  try {
    const { state, district, type = 'MP' } = req.body;
    
    if (!state) return res.status(400).json({ error: 'State required' });

    const politicians = await scrapeRegionalPoliticians(state, district, type);
    
    res.json({ 
      success: true, 
      politicians: politicians,
      count: politicians.length 
    });
  } catch (error) {
    console.error('[bulk-scrape]', error);
    res.status(500).json({ error: 'Failed to scrape politicians: ' + error.message });
  }
});

export default router;
    const { state, district, type = 'MP' } = req.body;
    
    if (!state) return res.status(400).json({ error: 'State required' });

    const politicians = await scrapeRegionalPoliticians(state, district, type);
    
    res.json({ 
      success: true, 
      politicians: politicians,
      count: politicians.length 
    });
  } catch (error) {
    console.error('[bulk-scrape]', error);
    res.status(500).json({ error: 'Failed to scrape politicians: ' + error.message });
  }
});

export default router;
