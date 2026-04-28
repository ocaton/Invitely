# Invitely

`Invitely` is a lightweight invitation website inspired by Partiful. It lets guests view a featured event, RSVP through a popup flow, and lets the host manage event details, branding, images, and RSVP data from a protected host area.

## Current Version

`V 1.0`

## Current Features

- Public homepage with:
  - event image
  - event title
  - event description
  - date
  - time
  - location
  - town
  - host card
- Simple top navigation:
  - `Home`
  - `Host Sign In`
- RSVP modal with:
  - `Yes`, `Maybe`, `No` dropdown
  - name, email, phone, guest count, and note fields
  - animated success state after submit
- Host/admin tools for:
  - signing in
  - editing homepage event details
  - uploading event image up to `10 MB`
  - uploading host image up to `10 MB`
  - editing app name and logo mark
  - reviewing RSVP responses
  - connecting Google Sheets
- Storage:
  - local Excel workbook backup at `data/gatherly-data.xlsx`
  - optional Google Sheets sync through host OAuth
- Responsive layout tuned for desktop and mobile
- Host avatar behavior:
  - uploaded host photo shows in the host card
  - if there is no host image, the host initials are shown instead
- Timezone behavior:
  - if more than one timezone is configured, toggle buttons appear
  - if only one timezone is configured, the timezone block is hidden

## Tech Stack

- `Python` backend in `server.py`
- `HTML`, `CSS`, `JavaScript` frontend
- `openpyxl` for local workbook storage
- Google OAuth + Google Sheets API for optional cloud sync

## Project Files

- `server.py`
  Runs the local web server, API routes, admin session flow, uploads, workbook storage, and Google Sheets integration.
- `index.html`
  Main page markup and host/admin page structure.
- `styles.css`
  All layout, spacing, colors, modal styling, and responsive rules.
- `app.js`
  Frontend rendering, RSVP modal flow, host editor logic, image upload flow, and API requests.
- `data/gatherly-data.xlsx`
  Local backup storage for events, settings, and RSVP data.
- `data/uploads/`
  Local uploaded event and host images.
- `start.ps1`
  Helper script for launching the app with the bundled runtime.
- `render.yaml`
  Render deployment settings.
- `requirements.txt`
  Python dependencies.

## Run Locally

### Option 1: Standard Python

Open PowerShell in the project folder:

```powershell
cd "C:\Users\dasaj\Documents\Codex\Invitely"
python server.py
```

Then open:

```text
http://127.0.0.1:8000
```

### Option 2: Bundled Python Runtime

If `python` is not recognized:

```powershell
cd "C:\Users\dasaj\Documents\Codex\Invitely"
& "C:\Users\dasaj\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe" ".\server.py"
```

### Option 3: Start Script

```powershell
cd "C:\Users\dasaj\Documents\Codex\Invitely"
.\start.ps1
```

If PowerShell blocks the script, run:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

and then run `start.ps1` again.

## Stop The Local Server

In the PowerShell window where the server is running, press:

```text
Ctrl + C
```

## Host Sign In

1. Open the website.
2. Click `Host Sign In`.
3. Enter the host password.

Default host password:

```text
m3-host-2026
```

You can change it with the environment variable:

```text
INVITELY_ADMIN_PASSWORD
```

## Image Uploads

Hosts can upload:

- `event image`
- `host image`

Rules:

- max file size: `10 MB`
- supported formats: `JPG`, `PNG`, `WEBP`, `GIF`

Uploaded files are stored locally in:

```text
data/uploads/
```

## Data Storage

### Local Workbook

By default, Invitely stores data in:

```text
data/gatherly-data.xlsx
```

This includes:

- settings
- events
- RSVP responses

### Google Sheets

Hosts can connect their own Google account so events and RSVPs sync to Google Sheets.

To set that up:

1. Create a Google Cloud project.
2. Enable:
   - Google Sheets API
   - Google Drive API
3. Create OAuth `Web application` credentials.
4. Set these environment variables on the server:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_REDIRECT_URI`
   - `INVITELY_ADMIN_PASSWORD`
5. Sign in as host.
6. Click `Connect Google Sheets`.

On first connection, Invitely creates a spreadsheet in the host's Google account and migrates the local workbook data into it.

## Deployment Notes

The project is set up for Render.

Important note about uploads:

- if you deploy to Render without persistent storage, uploaded images may disappear after a restart or redeploy
- local workbook data can also be lost without persistent disk setup

For production, use either:

- Render persistent disk
- a real cloud image storage provider

## Event Defaults

The seeded featured event is:

- `Mother's Day Lunch`
- based on the provided PDF / invitation source
- stored as the default featured event when the workbook is first created

## Version History

### V 0.1

- Initial static event RSVP prototype
- Basic event cards and local browser-style flow

### V 0.2

- Added Python backend
- Added Excel workbook storage for events and RSVPs
- Added hidden host/admin access flow

### V 0.3

- Switched design direction toward Material 3 styling
- Seeded the main event as `Mother's Day Lunch`
- Added workbook-backed event editing

### V 0.4

- Added brand customization
- Added host ability to change app name and logo mark
- Added event image and host image URL support

### V 0.5

- Added Google OAuth scaffolding
- Added host-controlled Google Sheets connection flow
- Added migration from local workbook to Google Sheets

### V 0.6

- Updated public UI with a cleaner Invitely identity
- Added `Home` and `Host Sign In` navigation
- Simplified public event experience

### V 0.7

- Added richer host-editable event fields
- Added town, location, start/end times, and configurable time zones
- Made RSVP email and phone optional

### V 0.8

- Added real host image and event image upload support up to `10 MB`
- Added local upload storage and `/uploads` serving
- Improved host editor previews

### V 0.9

- Reworked the public homepage to match the newer Invitely mockup more closely
- Added modal RSVP flow with animated success state
- Removed extra public sections for a cleaner single-event homepage

### V 1.0

- Finalized the current simplified Invitely layout
- Kept only `Home` and `Host Sign In` in the nav
- Added host image fallback to initials when no host photo exists
- Hid timezone controls when only one timezone is configured
- Simplified footer to app branding plus `made in sikkim`
- Improved mobile responsiveness for the homepage and RSVP modal

## Notes

- If UI changes do not appear immediately, restart the local server and hard refresh the browser with:

```text
Ctrl + Shift + R
```

- If the host image is not visible, check whether the current event has a saved `hostImageUrl`.
- If a single timezone is configured, the top timezone section intentionally stays hidden.
