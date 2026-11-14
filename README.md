# Andrew Inbox

Andrew Inbox puts your Canvas, Gradescope, and Piazza assignments and announcements in one Chrome popup. This guide gets it running on your laptop in about 15 minutes. You only do the setup once.

**Pick your computer and follow only that guide:**

- 🪟 [**Windows guide**](#windows-guide)
- 🍎 [**Mac guide**](#mac-guide)

When you're done, go to [**Using Andrew Inbox**](#using-andrew-inbox). That part is the same on both.

---

## Windows guide

### W1. Install Chrome and Python

1. Install **Google Chrome** from [google.com/chrome](https://www.google.com/chrome) if you don't have it.
2. Install **Python**: go to [python.org/downloads](https://www.python.org/downloads), click the big yellow **Download Python** button, and open the file you downloaded.
3. **On the first screen of the installer, tick the box "Add python.exe to PATH"** at the bottom. It's easy to miss and it matters. Then click **Install Now**.
4. Check it worked: press the **Windows key**, type `cmd`, press **Enter**. In the black window, type `python --version` and press **Enter**. You should see `Python 3.12` or a higher number. If it says Python wasn't found, run the installer again and make sure you tick that box.

### W2. Download the project

1. Go to https://github.com/scottylabs-labrador/Andrew-Inbox
2. Near the top left, click the button that says **main** and choose **gmail-summary**.
3. Click the green **Code** button → **Download ZIP**.
4. Open your **Downloads** folder, **right-click** the ZIP file → **Extract All…** → **Extract**.
5. You'll get a folder like `Andrew-Inbox-gmail-summary`. Move it somewhere you'll keep it, like **Documents**. Don't use the files from inside the ZIP; the app only works from the extracted folder.

### W3. Make the `.env` file

The app needs a few private keys. They aren't on GitHub, so you'll make a small file for them yourself. Arav will send you the text that goes in it.

1. **Get the text from Arav.** Message Arav and ask for the `.env` contents. You'll get a few lines that look roughly like this:
   ```
   SUPABASE_URL=https://....supabase.co
   SUPABASE_KEY=sb_secret_...
   SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   OPENROUTER_API=sk-or-...
   ```
   Don't share this text with anyone else.
2. **Install Visual Studio Code** (a free code editor) from [code.visualstudio.com](https://code.visualstudio.com). Open it once it's installed.
3. **Open the project folder.** In VS Code, click **File** → **Open Folder…**, pick the `Andrew-Inbox-gmail-summary` folder from W2, and click **Select Folder**. If it asks "Do you trust the authors?", click **Yes, I trust the authors**.
4. **Make a new file.** On the left is a list of the project's files (things like `backend`, `start-backend.bat`, `README.md`). Click an **empty spot** in that list (not on a folder), then click the **New File** icon (a page with a **+**) at the top of the list.
5. **Name it `.env`.** Type exactly `.env` (a dot, then `env`, nothing else) and press **Enter**. The empty file opens on the right.
6. **Paste Arav's text.** Click inside the empty file and press **Ctrl+V**.
7. **Save.** Press **Ctrl+S**. The dot on the file's tab disappears once it's saved.

**Check it worked:** `.env` should be in the list on the left at the same level as `start-backend.bat`, not inside a folder. If it's inside a folder, drag it out onto an empty spot in the list. You can close VS Code now.

### W4. Add the extension to Chrome

1. In Chrome, type `chrome://extensions` in the address bar and press **Enter**.
2. Turn on **Developer mode** (the switch in the top-right corner).
3. Click **Load unpacked** (top left).
4. Go into your `Andrew-Inbox-gmail-summary` folder, click once on the **`andrew-inbox-extension`** folder, and click **Select Folder**.
5. Click the **puzzle-piece icon** in Chrome's toolbar, then click the **pin** next to **Andrew Inbox** so it stays visible.

### W5. Start the backend

The backend is the part that fetches your assignments. It runs in its own window.

1. Open your `Andrew-Inbox-gmail-summary` folder in File Explorer.
2. **Double-click `start-backend.bat`.** A black window opens.
   - If a blue box says **"Windows protected your PC"**, click **More info** → **Run anyway**.
3. The first time, it installs what it needs. This takes a few minutes. It's ready when the window shows:
   ```
   ==============================================================
     DONE! The backend is running and the extension works now.
   ```
4. **Leave that window open** while you use Andrew Inbox. Close it when you're done.

✅ Setup done. Go to [**Using Andrew Inbox**](#using-andrew-inbox).

**Every time after this:** double-click `start-backend.bat`, wait for **DONE!**, then click the Andrew Inbox icon in Chrome.

---

## Mac guide

### M1. Install Chrome and Python

1. Install **Google Chrome** from [google.com/chrome](https://www.google.com/chrome) if you don't have it.
2. Install **Python**: go to [python.org/downloads](https://www.python.org/downloads), click the big yellow **Download Python** button, open the `.pkg` file you downloaded, and click through the installer.
3. Check it worked: press **Cmd+Space**, type `Terminal`, press **Return**. In the window that opens, type `python3 --version` and press **Return**. You should see `Python 3.12` or a higher number.

### M2. Download the project

1. Go to https://github.com/scottylabs-labrador/Andrew-Inbox
2. Near the top left, click the button that says **main** and choose **gmail-summary**.
3. Click the green **Code** button → **Download ZIP**.
4. Open your **Downloads** folder in Finder. If you see a ZIP file, **double-click it** to unzip it. (Safari sometimes unzips it for you.)
5. You'll get a folder like `Andrew-Inbox-gmail-summary`. Drag it somewhere you'll keep it, like **Documents**.

### M3. Make the `.env` file

The app needs a few private keys. They aren't on GitHub, so you'll make a small file for them yourself. Arav will send you the text that goes in it.

1. **Get the text from Arav.** Message Arav and ask for the `.env` contents. You'll get a few lines that look roughly like this:
   ```
   SUPABASE_URL=https://....supabase.co
   SUPABASE_KEY=sb_secret_...
   SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   OPENROUTER_API=sk-or-...
   ```
   Don't share this text with anyone else.
2. **Install Visual Studio Code** (a free code editor) from [code.visualstudio.com](https://code.visualstudio.com). Open the download, drag **Visual Studio Code** into your **Applications** folder, and open it.
3. **Open the project folder.** In VS Code, click **File** → **Open Folder…** (on some versions it's just **Open…**), pick the `Andrew-Inbox-gmail-summary` folder from M2, and click **Open**. If it asks "Do you trust the authors?", click **Yes, I trust the authors**.
4. **Make a new file.** On the left is a list of the project's files (things like `backend`, `start-backend.sh`, `README.md`). Click an **empty spot** in that list (not on a folder), then click the **New File** icon (a page with a **+**) at the top of the list.
5. **Name it `.env`.** Type exactly `.env` (a dot, then `env`, nothing else) and press **Return**. The empty file opens on the right.
6. **Paste Arav's text.** Click inside the empty file and press **Cmd+V**.
7. **Save.** Press **Cmd+S**. The dot on the file's tab disappears once it's saved.

**Check it worked:** `.env` should be in the list on the left at the same level as `start-backend.sh`, not inside a folder. If it's inside a folder, drag it out onto an empty spot in the list. You can close VS Code now.

> Finder hides files that start with a dot, so you won't see `.env` there. That's normal. (Press **Cmd+Shift+.** in Finder if you want to see it.)

### M4. Add the extension to Chrome

1. In Chrome, type `chrome://extensions` in the address bar and press **Return**.
2. Turn on **Developer mode** (the switch in the top-right corner).
3. Click **Load unpacked** (top left).
4. Go into your `Andrew-Inbox-gmail-summary` folder, click once on the **`andrew-inbox-extension`** folder, and click **Select**.
5. Click the **puzzle-piece icon** in Chrome's toolbar, then click the **pin** next to **Andrew Inbox** so it stays visible.

### M5. Start the backend

The backend is the part that fetches your assignments. It runs in a Terminal window.

1. Open **Terminal** (**Cmd+Space**, type `Terminal`, press **Return**).
2. Type `cd` followed by a **space**. Don't press Return yet.
3. Drag your `Andrew-Inbox-gmail-summary` folder from Finder onto the Terminal window. Its location appears after `cd `. Now press **Return**.
4. Type `bash start-backend.sh` and press **Return**.
5. The first time, it installs what it needs. This takes a few minutes. It's ready when the window shows:
   ```
   ==============================================================
     DONE! The backend is running and the extension works now.
   ```
6. **Leave that window open** while you use Andrew Inbox. Close it when you're done.

✅ Setup done. Go to [**Using Andrew Inbox**](#using-andrew-inbox).

**Every time after this:** do steps 1–4 of M5, wait for **DONE!**, then click the Andrew Inbox icon in Chrome.

---

## Using Andrew Inbox

### First time: make an account

1. Click the **Andrew Inbox** icon in Chrome's toolbar.
2. At the top of the popup, choose **I'm new**. (Next time, choose **I have an account**.)
3. Type your **Andrew ID**, just the first part, like `jdoe`, not `jdoe@andrew.cmu.edu`.
4. Make up a **password** (at least 6 characters) and click **Create Account**.

### Connect Canvas

Next it asks for a **Canvas access token**. This lets Andrew Inbox read your classes. The popup shows these same steps.

1. Open your Canvas settings: [canvas.cmu.edu/profile/settings](https://canvas.cmu.edu/profile/settings) (or on Canvas click **Account** → **Settings**).
2. Scroll down to **Approved Integrations** and click **+ New Access Token**.
3. For **Purpose**, type `Andrew Inbox`.
4. For **Expiration date**, pick the **last day of this semester**. You'll make a new one next semester. (If you leave it blank, it never expires.)
5. Click **Generate Token**. Copy the long code it shows. It starts with numbers and a `~`, like `7752~AbCd…`. **Canvas only shows it once**, so copy it now.
6. Go back to the popup, paste it, and click **Save and continue**.

Andrew Inbox then fetches your assignments and announcements by itself. The first fetch takes a minute or two. After that it updates every 7 days when you open it, or click **Fetch** to update sooner.

**When your token expires** (for example at the start of next semester), make a new one the same way and paste it in the popup's **Settings**.

---

## If something goes wrong

| Problem | Fix |
| --- | --- |
| Chrome says **"Manifest file is missing"** | You picked the wrong folder. Pick `andrew-inbox-extension`, the one with `manifest.json` directly inside. |
| Backend says **Python 3.12 or newer was not found** | Install Python again (W1 / M1). On Windows, tick "Add python.exe to PATH". Then restart your laptop and try again. |
| Backend says **Missing the .env file** | The `.env` file isn't in the main project folder (it may have ended up inside `backend` or another folder), or it's not named exactly `.env`. Redo W3 / M3. |
| Windows: the `start-backend.bat` window flashes and closes | Press the Windows key, type `cmd`, press Enter. Drag `start-backend.bat` into that window, press Enter, and send Arav the error. |
| Mac: **No such file or directory** | Terminal isn't in the project folder. Redo M5 from step 2, dragging the `Andrew-Inbox-gmail-summary` folder itself. |
| Not sure whether to pick **I'm new** or **I have an account** | If you've never made an Andrew Inbox account, pick **I'm new**. If it says the account already exists, pick **I have an account**. |
| **"Wrong Andrew ID or password"** | Check both, or click **Forgot password?** on the sign-in screen. |
| Canvas token says **"doesn't look like a Canvas token"** | You copied only part of it. Make a new token and copy the whole code, starting with the numbers and `~`. |
| Popup just shows a spinning circle | You're offline. Connect to the internet and reopen the popup. |
| **Fetch** button turns red | The backend isn't running. Start it (W5 / M5) and keep the window open. Hover over the button to see the exact error. |

**Other browsers:** Edge, Brave, Arc, Opera and Vivaldi work the same way; use `edge://extensions`, `brave://extensions`, and so on. On **Firefox**, go to `about:debugging` → **This Firefox** → **Load Temporary Add-on…** and pick `manifest.json` inside `andrew-inbox-extension`. Firefox forgets it when it closes, so you redo this each time, and you still need Chrome installed for the backend. **Safari** isn't supported yet.

---

## For developers

This part is for people working on the code. If you just want to use Andrew Inbox, everything you need is above.

### One-time setup

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

### Supabase project (one time, per project)

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

### Run it

**1. Build the extension.** From the `Andrew-Inbox` folder:

```bash
npm run extension
```

This updates the `andrew-inbox-extension/` folder (and also makes `andrew-inbox-extension.zip` if you need to send it to someone).

**2. Load it in Chrome.**

- **First time only:** go to `chrome://extensions`, turn on **Developer mode**, click **Load unpacked**, and pick the `andrew-inbox-extension` folder.
- **Every time after:** just click **↻** on the Andrew Inbox card. You don't need to delete or re-add anything.

**3. Start the backend** (needed only for **Fetch**, which also runs by itself every 7 days):

- **Windows:** double-click `start-backend.bat`
- **macOS / Linux:** `./start-backend.sh`

It's ready when it prints `Uvicorn running on http://127.0.0.1:8000`. Keep that window open.

### If something breaks

| Problem | Fix |
| --- | --- |
| **"Invalid API key"** on sign-in | `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` are from different projects, or the key is wrong. Fix `.env`, run `npm run extension`, click ↻. |
| Build says **Missing SUPABASE_...** | Add that line to `.env`. |
| Popup is blank / old | Run `npm run extension` again, then click ↻. |
| Reset code email never arrives | Custom SMTP isn't set up, or the email went to spam. See "Supabase project", step 3. |
| **"That code is wrong or has expired"** | Click "Send another code" and use the newest email. Codes expire after an hour. |
| Fetch button turns red | The backend isn't running. Start it (step 3). |
| Port 8000 already in use | Another backend window is open. Close it. |
