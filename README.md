# Andrew Inbox

**Just want to use it?** Follow [HOW_TO_START.md](HOW_TO_START.md). No building needed.

The rest of this file is for developers working on the code.

## One-time setup

1. Install **Python 3.12+** (https://www.python.org/downloads, tick "Add python.exe to PATH"), **Node.js LTS** (https://nodejs.org), and **Google Chrome**.
2. Install the frontend packages:
   ```bash
   cd ui-react
   npm install
   ```
3. Create **one** file named `.env` in the `Andrew-Inbox` folder (this is the only `.env` in the project):
   ```env
   SUPABASE_URL=https://xxxx.supabase.co
   SUPABASE_KEY=sb_secret_...
   SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   OPENROUTER_API=sk-or-...
   ```
   All three Supabase values must come from the **same** Supabase project (Project Settings → Data API for the URL, → API Keys for the two keys).

## Supabase project (one time, per project)

1. **SQL Editor** → New query → paste all of `supabase/schema.sql` → **Run**.
2. **Authentication** → **Sign In / Providers** → **Email**: turn **off** "Confirm email" → Save.
3. **Forgot password** needs two things:
   - **Authentication** → **Emails** → **SMTP Settings**: turn on custom SMTP. Supabase's built-in sender only delivers to your own team's addresses (a couple per hour), so it can't reach students' @andrew.cmu.edu inboxes. Any SMTP provider works, e.g. [Resend](https://resend.com) (free tier) or a Gmail account with an [app password](https://myaccount.google.com/apppasswords) (`smtp.gmail.com`, port 465).
   - **Authentication** → **Emails** → **Templates** → **Reset Password**: replace the message with:
     ```html
     <h2>Reset your Andrew Inbox password</h2>
     <p>Your code is: <strong>{{ .Token }}</strong></p>
     <p>Enter it in the extension. If you didn't ask for this, ignore this email.</p>
     ```
     The extension asks for this code instead of using a link, because a link can't open back into the extension.

## Run it

**1. Build the extension.** From the `Andrew-Inbox` folder:

```bash
npm run extension
```

This updates the `andrew-inbox-extension/` folder (and also makes `andrew-inbox-extension.zip` if you need to send it to someone).

**2. Load it in Chrome.**

- **First time only:** go to `chrome://extensions`, turn on **Developer mode**, click **Load unpacked**, and pick the `andrew-inbox-extension` folder.
- **Every time after:** just click **↻** on the Andrew Inbox card. You don't need to delete or re-add anything.

**3. Start the backend** (needed only for **Scrape**):

- **Windows:** double-click `start-backend.bat`
- **macOS / Linux:** `./start-backend.sh`

It's ready when it prints `Uvicorn running on http://127.0.0.1:8000`. Keep that window open.

## If something breaks

| Problem | Fix |
| --- | --- |
| **"Invalid API key"** on sign-in | `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` are from different projects, or the key is wrong. Fix `.env`, run `npm run extension`, click ↻. |
| Build says **Missing SUPABASE_...** | Add that line to `.env`. |
| Popup is blank / old | Run `npm run extension` again, then click ↻. |
| Reset code email never arrives | Custom SMTP isn't set up, or the email went to spam. See "Supabase project", step 3. |
| **"That code is wrong or has expired"** | Click "Send another code" and use the newest email. Codes expire after an hour. |
| Scrape button turns red | The backend isn't running. Start it (step 3). |
| Port 8000 already in use | Another backend window is open. Close it. |
