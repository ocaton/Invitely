# Invitely

`Invitely` is a simple event site inspired by Partiful, redesigned around a minimal Material 3-style layout.

## What changed

- The featured event is now seeded as **Mother's Day Lunch** from the provided PDF.
- RSVPs are no longer stored in browser local storage.
- Events and RSVPs are saved in an Excel workbook at `data/gatherly-data.xlsx`.
- Hosts can sign in from the website to edit the logo and event list.

## Files

- `server.py` runs the local website and workbook-backed API.
- `index.html`, `styles.css`, and `app.js` power the frontend.
- `data/gatherly-data.xlsx` stores events and RSVPs after the server starts.
- `start.ps1` launches the app with the bundled Python runtime.

## Run locally

Use PowerShell:

```powershell
.\start.ps1
```

Then open:

```text
http://127.0.0.1:8000
```

## Host sign in

- Open the website and click `Host Sign In`
- Enter the host password: `m3-host-2026`

## Google Sheets setup

To let the host connect their own Google account:

1. Create a Google Cloud project.
2. Enable the Google Sheets API and Google Drive API.
3. Create OAuth web app credentials.
4. Set these environment variables on your server:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_REDIRECT_URI`
   - `INVITELY_ADMIN_PASSWORD`
5. Sign in as host in the app.
6. Click `Connect Google Sheets`.

On first connect, Invitely creates a spreadsheet in the host's Google account and migrates the current local workbook data into it.

## Notes

- The event details were pulled from the PDF you provided and loaded into the seeded featured event.
- The PDF shows Eastern Time on `Sunday, May 10, 2026`; the UI currently offers the `EST` and `IST` toggle labels you requested.
