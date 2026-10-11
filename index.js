require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

const bodyParser = require('body-parser');
const dns = require('dns');
const urlParser = require('url');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// In-memory URL database
const urlDatabase = [];

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

// POST /api/shorturl
app.post('/api/shorturl', function(req, res) {
  const originalUrl = req.body.url;

  let parsedUrl;
  try {
    parsedUrl = new URL(originalUrl);
  } catch (err) {
    return res.json({ error: 'invalid url' });
  }

  // Must have http: or https: protocol
  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    return res.json({ error: 'invalid url' });
  }

  // Verify hostname using dns.lookup
  dns.lookup(parsedUrl.hostname, (err, address) => {
    if (err || !address) {
      return res.json({ error: 'invalid url' });
    }

    let existingIndex = urlDatabase.indexOf(originalUrl);
    let shortUrl;
    if (existingIndex !== -1) {
      shortUrl = existingIndex + 1;
    } else {
      urlDatabase.push(originalUrl);
      shortUrl = urlDatabase.length;
    }

    res.json({
      original_url: originalUrl,
      short_url: shortUrl
    });
  });
});

// GET /api/shorturl/:short_url
app.get('/api/shorturl/:short_url', function(req, res) {
  const shortUrl = parseInt(req.params.short_url, 10);
  const originalUrl = urlDatabase[shortUrl - 1];

  if (!originalUrl) {
    return res.json({ error: 'No short URL found for the given input' });
  }

  res.redirect(originalUrl);
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
