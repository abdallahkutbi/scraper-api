import express from 'express';
import cors from 'cors';
import pkg from 'linkedin-jobs-scraper';

const { LinkedinScraper, relevanceFilters } = pkg;

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// Root route
app.get('/', (req, res) => {
  res.send('✅ Scraper API is running! Use /scrape?q=<job title>');
});

app.get('/scrape', async (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.status(400).json({ error: 'Missing ?q=<job title>' });
  }

  console.log(`🚀 Incoming scrape request for: ${query}`);
  const results = [];

  try {
    const scraper = new LinkedinScraper({
      executablePath: '/usr/bin/chromium-browser',
      headless: 'new',
      protocolTimeout: 120000,
      slowMo: 500,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-accelerated-2d-canvas',
        '--allow-running-insecure-content',
        '--disable-web-security',
        '--disable-client-side-phishing-detection',
        '--disable-notifications',
        '--mute-audio',
        '--single-process',
      ],
      defaultViewport: null,
      pipe: true,
      // sessionCookieValue: 'YOUR_SESSION_COOKIE_HERE'
    });

    scraper.on('data', (job) => {
      console.log(`✅ Scraped job: ${job.title} @ ${job.company}`);
      results.push({
        title: job.title,
        company: job.company,
        location: job.place,
        date: job.date,
        description: job.description
      });
    });

    scraper.on('error', (err) => {
      console.error('⚠️ Scraper error:', err);
    });

    console.log('🔧 Starting scraper run…');
    await scraper.run(
      `https://www.linkedin.com/jobs/search?keywords=${encodeURIComponent(query)}&location=United%20States`,
      {
        limit: 5,
      }
    );

    console.log('✅ Scraper finished, sending response.');
    res.json(results);
  } catch (err) {
    console.error('❌ Fatal scraper error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Scraper API listening on port ${PORT}`);
});
