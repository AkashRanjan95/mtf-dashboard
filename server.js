const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Optional shared secret so random bots can't spam your webhook.
// Set WEBHOOK_SECRET in Render's environment variables, then add
// "?key=YOUR_SECRET" to the webhook URL you give TradingView.
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || '';

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory store: latest signal per symbol
// { SYMBOL: { symbol, action, entry, sl, target, qty, score, time } }
const symbols = new Map();
const MAX_HISTORY = 200;
const history = [];

app.post('/webhook', (req, res) => {
  if (WEBHOOK_SECRET && req.query.key !== WEBHOOK_SECRET) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const body = req.body || {};
  if (!body.symbol || !body.action) {
    return res.status(400).json({ error: 'symbol and action are required' });
  }

  const entry = {
    symbol: body.symbol,
    action: body.action,
    entry: body.entry ?? null,
    sl: body.sl ?? null,
    target: body.target ?? null,
    qty: body.qty ?? null,
    score: body.score ?? null,
    time: new Date().toISOString(),
  };

  symbols.set(entry.symbol, entry);
  history.unshift(entry);
  if (history.length > MAX_HISTORY) history.pop();

  res.json({ ok: true });
});

app.get('/api/symbols', (req, res) => {
  res.json(Array.from(symbols.values()).sort((a, b) => (a.symbol > b.symbol ? 1 : -1)));
});

app.get('/api/history', (req, res) => {
  res.json(history);
});

app.delete('/api/symbols', (req, res) => {
  symbols.clear();
  history.length = 0;
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`MTF-Confluence dashboard running on port ${PORT}`);
});
