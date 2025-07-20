import express from 'express';
import cors from 'cors';
import { LinkedinScraper, events } from 'linkedin-jobs-scraper';

const app = express();
app.use(cors());

// Replace this with your valid li_at cookie from LinkedIn
const LI_AT_COOKIE = 'AQEDATsjBxsBJIGKAAABly0M0roAAAGYM5DTVE4AeHtQ1vXkIvv-u6w7L1_OkCylZBlEV5JOAIRupzbwcv4FdD8pB3PbOT6wzUFHJLJh6Yeh7iVevPjkfY4ADMJgQDi_f8QWzIUi7a8v1upS-5RTnrlg';

app.get('/scrape', async (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.status(400).json({ error: 'Missing q parameter (job title)' });
  }

  console.log(`🔎 Scraping LinkedIn jobs for query: "${query}"`);

  const scraper = new LinkedinScraper({
    headless: true,
    sessionCookieValue: LI_AT_COOKIE,
    slowMo: 500, // throttle between actions (increase if still blocked)
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  });

  const results = [];

  scraper.on(events.scraper.data, (data) => {
    results.push({
      title: data.title,
      company: data.company,
      location: data.location,
      date: data.date,
      applyLink: data.applyLink,
      description: data.description,
    });
  });

  scraper.on(events.scraper.error, (err) => {
    console.error('⚠️ Scraper error:', err);
  });

  scraper.on(events.scraper.end, () => {
    console.log(`✅ Scraping finished. Found ${results.length} jobs.`);
    res.json(results);
  });

  try {
    await scraper.run(
      [
        {
          query: query,
          options: {},
        },
      ],
      {
        locations: ['United States'],
        limit: 5, // keep low to avoid being blocked
      }
    );
  } catch (err) {
    console.error('❌ Fatal scraper error:', err);
    res.status(500).json({ error: 'Scraping failed', details: err.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`✅ Scraper API listening on port ${port}`);
});
