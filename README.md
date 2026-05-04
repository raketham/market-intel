# Market Intelligence v2 — AI Trading Analyst + Email Alerts

AI-powered market analysis with automatic BUY signal email alerts.

---

## What's New in v2

- **Signal Detection** — Claude returns BUY / HOLD / SELL for every analysis
- **Auto Email Modal** — When a BUY is detected, an email prompt pops up automatically
- **Manual Email Button** — "✉ Email Alert" button always visible after any analysis
- **Beautiful HTML Emails** — Styled dark-theme alert with ticker, signal, and full analysis

---

## Project Structure

```
market-intel/
├── pages/
│   ├── _app.js
│   ├── _document.js
│   ├── index.js              # Main UI + Email Modal
│   └── api/
│       ├── analyze.js        # Anthropic API (secure, server-side)
│       └── send-alert.js     # Email sender (Nodemailer + Gmail)
├── styles/
│   ├── globals.css
│   └── Home.module.css
├── .env.local                # Your secrets (never committed)
├── .gitignore
├── next.config.js
└── package.json
```

---

## Setup & Deploy

### Step 1 — Get your Anthropic API Key
1. Go to https://console.anthropic.com
2. Sign up → get $5 free credits
3. Go to **API Keys** → Create a key → copy it

### Step 2 — Set up Gmail App Password
Gmail requires an "App Password" (not your real password) for SMTP:
1. Go to https://myaccount.google.com/security
2. Enable **2-Step Verification** if not already on
3. Search for **App passwords** (or go to myaccount.google.com/apppasswords)
4. Create a new app password for "Mail"
5. Copy the 16-character password (no spaces)

### Step 3 — Install & run locally
```bash
cd market-intel
npm install
```

Edit `.env.local`:
```
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxx
EMAIL_USER=yourname@gmail.com
EMAIL_PASS=abcd efgh ijkl mnop   ← your 16-char App Password
```

```bash
npm run dev
# Open http://localhost:3000
```

### Step 4 — Deploy to Vercel
```bash
npm install -g vercel
vercel
```

### Step 5 — Add environment variables to Vercel
Go to: **vercel.com → Your project → Settings → Environment Variables**

Add all three:
| Key | Value |
|-----|-------|
| `ANTHROPIC_API_KEY` | your Anthropic key |
| `EMAIL_USER` | your Gmail address |
| `EMAIL_PASS` | your 16-char App Password |

Then redeploy:
```bash
vercel --prod
```

✅ Done! Your app is live with email alerts.

---

## How Email Alerts Work

1. Run any analysis (Trade Ideas or Technical Analysis)
2. Claude detects BUY / HOLD / SELL from the response
3. If **BUY** → email modal pops up automatically
4. For any signal → click **✉ Email Alert** button manually
5. Enter any email address → hit Send
6. Recipient gets a beautifully formatted dark-theme HTML email

---

## Cost Estimate

| Item | Cost |
|------|------|
| Vercel hosting | Free |
| Anthropic API (personal use) | ~$1–3/month |
| Gmail SMTP | Free |
| Anthropic signup credit | $5 free |
