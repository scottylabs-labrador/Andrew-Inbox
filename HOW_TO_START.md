# How to Start Andrew Inbox

Andrew Inbox puts your Canvas, Gradescope, and Piazza assignments and announcements in one Chrome popup. This guide gets it running on your laptop in about 10 minutes.

**You need:** Google Chrome and Python 3.12 or newer. (Check Python by opening a terminal and running `python --version`. On Windows, if Python isn't found, reinstall it from [python.org](https://www.python.org/downloads) and tick **"Add python.exe to PATH"** on the first screen.)

---

## Step 1: Download the project

1. Go to https://github.com/scottylabs-labrador/Andrew-Inbox
2. Click the branch dropdown (it says **main**) and choose **gmail-summary**.
3. Click the green **Code** button → **Download ZIP**.
4. Unzip it. You'll get a folder like `Andrew-Inbox-gmail-summary`. Put it somewhere permanent, like Documents.

## Step 2: Add the `.env` file

Ask Arav for the `.env` file. It holds private keys, so it's sent to you directly, not on GitHub.

Put it **directly inside** the folder from Step 1, next to `start-backend.bat`. The file must be named exactly `.env`, with the dot and no `.txt` at the end.

> **Windows tip:** if you can't tell whether it's named `.env.txt`, open File Explorer → **View** → **Show** → turn on **File name extensions**.

## Step 3: Add the extension to Chrome

1. In Chrome, go to `chrome://extensions`
2. Turn on **Developer mode** (switch in the top-right corner).
3. Click **Load unpacked**.
4. Open the project folder, select the **`andrew-inbox-extension`** folder inside it, and click **Select Folder**.
5. Click the puzzle-piece icon in Chrome's toolbar and pin **Andrew Inbox**.

This works the same in other Chromium browsers: Edge (`edge://extensions`), Brave (`brave://extensions`), Arc, Opera and Vivaldi.

> **Using Firefox instead?** Go to `about:debugging` → **This Firefox** → **Load Temporary Add-on…**, open the `andrew-inbox-extension` folder, and pick **`manifest.json`**. Firefox removes temporary add-ons when it closes, so you redo this each time you open Firefox. You still need Google Chrome installed, because the backend uses it to read Gradescope and Piazza.
>
> **Safari** isn't supported yet. It needs the extension wrapped in a Mac app with Xcode.

## Step 4: Start the backend

The backend is the part that fetches your assignments.

- **Windows:** double-click **`start-backend.bat`** in the project folder.
- **Mac:** open Terminal, type `cd ` (with a space), drag the project folder onto the Terminal window, press Enter, then run `./start-backend.sh`.

The first time, it installs what it needs, which takes a few minutes. It's ready when the window shows:

```
==============================================================
  DONE! The backend is running and the extension works now.
```

**Keep that window open** while you use Andrew Inbox. Close it when you're done.

## Step 5: Use it

1. Click the **Andrew Inbox** icon in Chrome → **Create an account**. Use your Andrew ID (just `jdoe`, not the full email) and a password.
2. It asks for a **Canvas access token**:
   - Go to [canvas.cmu.edu](https://canvas.cmu.edu) → **Account** → **Settings** → **Approved Integrations** → **+ New Access Token**.
   - Name it "Andrew Inbox", click **Generate Token**, copy the long code (it starts with numbers and a `~`), paste it, and click **Save Token**.
3. Andrew Inbox fetches your assignments and announcements by itself. The first fetch takes a minute or two. After that it updates by itself every 7 days when you open it, or click **Fetch** to update sooner.

**Next time,** just do Step 4 (start the backend) and click the extension. Steps 1–3 and 5 are one-time.

---

## If something goes wrong

| Problem | Fix |
| --- | --- |
| Chrome says **"Manifest file is missing"** | You picked the wrong folder. Pick `andrew-inbox-extension`, the one with `manifest.json` directly inside. |
| `start-backend` says **Python 3.12 or newer was not found** | Install Python from python.org (tick "Add python.exe to PATH"), restart your laptop, try again. |
| `start-backend` says **Missing the .env file** | The `.env` isn't in the project folder, or it's secretly named `.env.txt` (see Step 2). |
| The `start-backend.bat` window flashes and closes | Open Command Prompt, drag `start-backend.bat` into it, press Enter, and send Arav the error. |
| Mac: **permission denied** | Run `chmod +x start-backend.sh` once, then `./start-backend.sh` again. |
| Popup just shows a spinning circle | You're offline. Connect to the internet and reopen the popup. |
| **Fetch** button turns red | The backend isn't running. Do Step 4 and keep the window open. Hover over the button to see the exact error. |
| **"Wrong Andrew ID or password"** | Check both, or use **Forgot password?** on the sign-in screen. |
