# Andrew Inbox

Andrew Inbox puts your Canvas, Gradescope, and Piazza assignments and announcements in one Chrome popup. Sync runs on a hosted backend, so you do **not** need Python, a `.env` file, or a local server.

Setup takes a few minutes and you only do it once.

---

## Install the extension

1. Install **Google Chrome** from [google.com/chrome](https://www.google.com/chrome) if you don't have it.
2. Go to https://github.com/scottylabs-labrador/Andrew-Inbox
3. Make sure the branch near the top left says **main**.
4. Click the green **Code** button → **Download ZIP**.
5. Unzip the file. You'll get a folder like `Andrew-Inbox-main`. Move it somewhere you'll keep it, like **Documents**.
6. In Chrome, open `chrome://extensions` and turn on **Developer mode** (top right).
7. Click **Load unpacked**, open your unzipped folder, select **`andrew-inbox-extension`**, and confirm.
8. Click the **puzzle-piece icon** in Chrome's toolbar, then pin **Andrew Inbox**.

**Check it worked:** `andrew-inbox-extension` must contain `manifest.json` directly inside it. If Chrome says the manifest is missing, you picked the wrong folder.

**Other Chromium browsers:** Edge, Brave, Arc, Opera, and Vivaldi work the same way (`edge://extensions`, `brave://extensions`, and so on). **Safari** isn't supported yet.

---

## First-time setup

### Make an account

1. Click the **Andrew Inbox** icon in Chrome.
2. Choose **I'm new** (next time, choose **I have an account**).
3. Enter your **Andrew ID** — just the first part, like `jdoe`, not `jdoe@andrew.cmu.edu`.
4. Choose a **password** (at least 6 characters) and click **Create Account**.

### Connect Canvas

The popup asks for a **Canvas access token** so Andrew Inbox can read your classes.

1. Open [canvas.cmu.edu/profile/settings](https://canvas.cmu.edu/profile/settings) (or Canvas → **Account** → **Settings**).
2. Under **Approved Integrations**, click **+ New Access Token**.
3. For **Purpose**, type `Andrew Inbox`.
4. For **Expiration date**, pick the **last day of this semester** (or leave blank if you prefer it never expires).
5. Click **Generate Token**, copy the full code (it looks like `7752~…`), and paste it in the popup.
6. Click **Save and continue**.

Andrew Inbox then syncs your assignments and announcements. The first sync can take a minute or two.

When your token expires, create a new one the same way and paste it under **Settings**.

---

## Using Andrew Inbox

### Tasks and announcements

- **Tasks** shows assignments from Canvas and Gradescope, plus any you add yourself.
- **Announcements** shows Piazza (and related) posts.
- Use **All** / **Unread** (and similar filters) to narrow what you see.
- Click an assignment card to open it on Canvas or Gradescope when a link is available.
- Mark items done or unread from the card controls.

### Add or edit an assignment

Use the add/edit assignment form to set a title, course, and due date/time with separate month, day, year, hour, minute, and AM/PM fields. Clear the AM/PM control if you want to leave meridian unset while editing.

### Class filter

Use the class filter to show one or more courses. You can:

- Select multiple classes at once
- Rename how a class appears in the popup
- Pick a color for each class

Preferences stay on this computer.

### Sites

Open **Sites** for quick links to Canvas, Gradescope, Piazza, and similar tools. Press and hold a site control, then drag to the option you want.

### Fetch / sync

- Opening the popup can sync automatically, **at most once per hour**.
- Click **Fetch** anytime to sync right away.
- Keep the popup open until a long sync finishes; you can close it afterward.

### Settings

Use **Settings** to update your Canvas token, adjust preferences, and reach Sites / account options.

---

## If something goes wrong

| Problem | Fix |
| --- | --- |
| Chrome says **"Manifest file is missing"** | Select `andrew-inbox-extension` — the folder that contains `manifest.json` directly. |
| Not sure whether to pick **I'm new** or **I have an account** | First time → **I'm new**. If it says the account already exists → **I have an account**. |
| **"Wrong Andrew ID or password"** | Check both, or use **Forgot password?** on the sign-in screen. |
| Canvas token says **"doesn't look like a Canvas token"** | Copy the whole token, starting with the numbers and `~`. Create a new token if needed. |
| Popup just shows a spinning circle | Connect to the internet and reopen the popup. |
| **Fetch** button turns red | You're offline, or the hosted sync service is temporarily unavailable. Hover the button for the error, wait a minute, and try again. |
| Assignment cards don't open Canvas/Gradescope | Run **Fetch** once so links can be saved, then try again. Older items may not have links until they're re-synced. |
| Extension looks outdated after a GitHub update | Download a fresh ZIP from **main**, or replace the extension folder and click **↻** on the Andrew Inbox card at `chrome://extensions`. |
