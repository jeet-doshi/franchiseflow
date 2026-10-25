# Turn on the Google Sheets database (about 5 minutes)

1. Go to https://sheets.new and name the sheet **Veloce – FranchiseFlow DB**.
2. In the sheet, open **Extensions → Apps Script**.
3. Delete the sample code, paste everything from `backend/Code.gs`, and click **Save** (disk icon).
4. Click **Deploy → New deployment**. Click the gear next to "Select type" and choose **Web app**.
   - Description: `FranchiseFlow DB`
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Click **Deploy**, then **Authorize access**: pick your Google account → *Advanced* → *Go to project (unsafe)* → **Allow**. This warning appears because the script is yours and not verified by Google.
6. Copy the **Web app URL** (it ends in `/exec`) and send it to Claude, or paste it into `config.js`:
   ```js
   window.VELOCE_DB_URL = 'https://script.google.com/macros/s/XXXX/exec';
   ```
7. Push to GitHub. The badge in both apps changes from *This browser* to **Live**.

Each workspace becomes its own tab (`ws_V7K2QX`, `ws_public`). Every application, question, answer and decision is one row, so you can show judges the raw data in the Sheet.

If you change `Code.gs` later: **Deploy → Manage deployments → Edit → Version: New version → Deploy** (the URL stays the same).
