# Lagma Village notice board

## Where notices come from

The three original notices are preserved in `notice-data.js` as the public static fallback. Only information actually present in the old page was carried over; their dates, issuing bodies, original sources, and documents remain unspecified.

When Firebase is enabled, public community notices are read from the approved `visitorNotes` collection. The browser listens for up to 50 recent approved notes. New visitor submissions go to `pendingVisitorNotes` and are not shown publicly until reviewed and copied into the approved collection. The submission form keeps the current rules-compatible fields (`name`, `title`, `message`, `page`, `status`, `createdAt`). It does not accept source, category, PDF, or date metadata.

## Add or update a static notice

Edit the array in `notice-data.js`. Use a unique stable `id` and a URL-safe `slug`, and provide the title, summary, content, and one configured category key. Optional dates should be valid ISO dates (`YYYY-MM-DD`). Use `status: "archived"` only for a deliberate archive. Set `pinned: true` for an important notice and remove the flag when it should no longer be prominent. Do not make up publication or expiry dates.

To attach a document, set `documentUrl` to a real relative file path or HTTP(S) URL and optionally set `documentType` (for example, `PDF`). To cite a source, set `sourceName` and a verified `sourceUrl`. The board validates URLs and does not display document/source actions when a URL is missing or unsafe.

Current date rules: deliberately archived takes precedence; a future start date is upcoming; a past expiry date is expired; valid current start/expiry boundaries are active. Without a relevant date, the notice is undated. Expired entries remain available. Date filters apply to known publication dates; undated entries remain included because they cannot be safely placed inside or outside a date range.

For Firebase submissions, review pending records in Firebase Console and copy only reviewed, public-safe notices into `visitorNotes` with `status: "approved"`. There is no public admin interface. Keep private details out of public documents. The page currently has no configured push notification service or file upload system. Cross-origin document links can be opened, but browsers may not allow forced downloads.

## Checks

Run `npm test` for the repository test suite and `npm run check` for the existing JavaScript syntax checks. The notice tests are in `tests/notice-board.test.js`.
