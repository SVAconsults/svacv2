# SVA Consults — Netlify Deployment Guide

## Final File Structure

```
your-repo/
├── enterprise-consulting.html     ← Website (the frontend)
├── netlify.toml                   ← Tells Netlify where functions live
├── package.json                   ← Includes nodemailer dependency
├── .env.example                   ← Reference for env vars (do not commit real values)
└── netlify/
    └── functions/
        └── contact.js             ← Contact form email handler
```

---

## Step 1 — Push to GitHub

Create a GitHub repo and push all the files above.

```bash
git init
git add .
git commit -m "Initial SVA Consults site"
git remote add origin https://github.com/YOUR_USERNAME/sva-consults.git
git push -u origin main
```

---

## Step 2 — Connect to Netlify

1. Go to [app.netlify.com](https://app.netlify.com) → **Add new site** → **Import from Git**
2. Select your GitHub repo
3. Build settings:
   - **Build command:** *(leave blank)*
   - **Publish directory:** `.`
4. Click **Deploy site**

---

## Step 3 — Add Environment Variables

In Netlify Dashboard → **Site Settings** → **Environment Variables** → **Add a variable**

Add all five:

| Key | Example Value |
|-----|---------------|
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_SECURE` | `false` |
| `SMTP_USER` | `office@svaconsults.com` |
| `SMTP_PASS` | `your_app_password` |

After adding variables → **Trigger a redeploy** (Deploys tab → Trigger deploy).

---

## Step 4 — Gmail App Password Setup

If using Gmail:
1. Go to [myaccount.google.com](https://myaccount.google.com)
2. **Security** → **2-Step Verification** → enable it
3. Search **App Passwords** → create one for "Mail"
4. Copy the 16-character password → paste as `SMTP_PASS` in Netlify

---

## How the Contact Form Works

1. User submits the form on the website
2. Frontend sends `POST /.netlify/functions/contact`
3. Netlify runs `netlify/functions/contact.js`
4. Two emails are sent via Nodemailer:
   - **Notification** → `office@svaconsults.com` (with enquiry details + Reply button)
   - **Auto-reply** → the person who submitted (confirming receipt)
5. On success: modal shows success screen
6. On failure: modal shows the real error message (no fake success)

---

## Testing Locally with Netlify CLI

```bash
npm install -g netlify-cli
netlify dev
```

Create a `.env` file (copy from `.env.example`) with real SMTP values.
The site runs at `http://localhost:8888` with functions working locally.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Emails not sending | Check SMTP env vars in Netlify dashboard, redeploy after adding |
| Gmail "auth failed" | Use an App Password, not your main Gmail password |
| Function not found (404) | Check `netlify.toml` is in the repo root and `functions = "netlify/functions"` |
| nodemailer not found | Ensure `package.json` is in the repo root with nodemailer in dependencies |
