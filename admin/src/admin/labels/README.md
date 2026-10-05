# Create Label

Open **Create Label** in the admin sidebar (`/labels`). This feature uses the existing dashboard theme, authenticated API client, export-document language selector, and shared translation dictionaries. Original text is saved; language selection affects the rendered label and download. Names, headings, subheadings, row keys, row values and table headers all participate in translation. Text missing from the dictionaries is sent to the existing MyMemory translation service. Failed requests show a retry notice and disable PNG download until translation completes; original saved data remains unchanged. Nonsense text or identifiers may be returned unchanged by the provider.

## Deployment

1. From `Backend`, run `node src/scripts/setup-labels.js` to create only the new `Labels` table. Do not use the legacy database sync script for this feature.
2. Restart the backend and build/deploy the admin app normally. Existing backend startup also registers the Label model for normal non-destructive sync when `DB_SYNC` is enabled.
3. Preserve `Backend/uploads` on persistent storage. Logos use the existing `/uploads` service; image requests must allow the admin origin for PNG export.

The existing `admin` and `staff` roles have shared CRUD access. Updates and deletions require the last saved revision, so concurrent edits do not silently overwrite data. Limits: title 200 characters, heading 500, key 300, value 4000, heading size 8–200 px; section and row counts have no fixed template limit but the existing 2 MB request limit applies.

Logos are resized in the browser to at most 1024 px and validated by file signature/dimensions on upload (2 MB maximum). The API rejects missing logo references. The optional `node src/scripts/cleanup-label-logos.js` maintenance command removes only unreferenced label-prefixed uploads older than seven days. Run it in a maintenance window without concurrent label writes; do not run it against unrelated assets.

## Verification

From `Backend`: `node --test tests/labels.test.js`.
For the configured database: `node tests/labels.integration.mjs` (creates and removes its own test record and logo).
From `admin`: `npm run lint` and `npm run build`.
For the optional Windows browser smoke test, start Vite on port 5178 and run `node tests/labels.browser.mjs`. It uses installed Edge (or `LABEL_TEST_BROWSER`), mocks API traffic, and writes screenshots/downloads to `.label-browser-check`.

Unsaved drafts are recovered per tab using session storage where available. Reload/close and sidebar navigation warn before discarding changes. Browser history navigation can recover the draft when returning to its editor.

Manually check create/reload, a second account seeing the same record, editing without duplicates, two-tab revision conflicts, delete, mobile preview, loaded logos in PNG, and language changes affecting exports without altering original text.
