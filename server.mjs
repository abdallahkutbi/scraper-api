import express from 'express';
import cors from 'cors';
import pkg from 'linkedin-jobs-scraper';

const { LinkedinScraper } = pkg; // relevanceFilters removed, not needed

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());

// Health check route
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
      // Use Chromium path from env (set in Dockerfile), fallback to default
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      headless: 'true',
      sessionCookieValue: 'AQEDATsjBxsBJIGKAAABly0M0roAAAGYM5DTVE4AeHtQ1vXkIvv-u6w7L1_OkCylZBlEV5JOAIRupzbwcv4FdD8pB3PbOT6wzUFHJLJh6Yeh7iVevPjkfY4ADMJgQDi_f8QWzIUi7a8v1upS-5RTnrlg',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-accelerated-2d-canvas',
        '--disable-web-security',
        '--disable-client-side-phishing-detection',
        '--disable-notifications',
        '--mute-audio',
        '--single-process'
      ],
      defaultViewport: null,
      pipe: true,
      protocolTimeout: 120000
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
      console.error('⚠️ Scraper error event:', err);
    });

    console.log('🔧 Starting scraper run…');

    await scraper.run([
        {
        query: query,
        options: {
            locations: ['United States'],
            limit: 5
        },
    }
    ]);

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
