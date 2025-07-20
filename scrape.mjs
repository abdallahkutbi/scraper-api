import { LinkedinScraper, events } from 'linkedin-jobs-scraper';

const query = process.argv[2]; // read the first argument passed in
if (!query) {
  console.error("❌ No job title provided");
  process.exit(1);
}

(async () => {
  const scraper = new LinkedinScraper({
    headless: true,
    slowMo: 100,
    sessionCookieValue: 'AQEDATsjBxsBJIGKAAABly0M0roAAAGYM5DTVE4AeHtQ1vXkIvv-u6w7L1_OkCylZBlEV5JOAIRupzbwcv4FdD8pB3PbOT6wzUFHJLJh6Yeh7iVevPjkfY4ADMJgQDi_f8QWzIUi7a8v1upS-5RTnrlg',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
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

  scraper.on(events.scraper.end, () => {
    console.log(JSON.stringify(results)); // output as JSON
    process.exit(0);
  });

  await scraper.run(
    [
      {
        query: query,
        options: {},
      },
    ],
    {
      locations: ['United States'],
      limit: 10,
    }
  );
})();
