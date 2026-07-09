# Code Improvement Plan

## 1. Extract `src/ui.js` — Decompose the monolith
- Move `openAssignModal` → `src/ui/assign-modal.js`
- Move `renderAddSpeakerModal` + `renderBulkImportSpeakersModal` → `src/ui/speaker-modals.js`
- Move `downloadCSV` → `src/shared/csv.js`

## 2. Eliminate N+1 queries
- Add `last_visit_date` field to congregation documents
- Remove per-congregation `getLastVisit` calls in `openAssignModal`
- Remove per-activity `getLastTwoVisitsBefore` calls in `loadMonthActivities` — batch or cache

## 3. Share duplication
- Extract `TYPE_STYLES` into `src/shared/constants.js`
- Extract `expandActivityWeeks()` helper used in 3 places
- Extract a `createModal()` helper for consistent modal patterns
- Extract `designClass()` to replace `isTactician ? 'A' : 'B'` throughout

## 4. Add error handling + validation
- Wrap all Firestore reads in `db.js` with try/catch
- Add input validation (empty names, malformed emails) before writes
- Add a date-range limit to `searchActivities` (last 12 months)

## 5. Add Firestore indexes config
- Create `firestore.indexes.json` for composite index requirements
- Add offline persistence: `enableIndexedDbPersistence()`

## 6. Performance — targeted DOM updates
- Replace full `renderCalendarView()` re-renders with targeted element updates
- Debounce `searchActivities` (already partially done in `ui.js:130`)

## 7. Security — Firestore rules
- Add `user_id` ownership checks in Security Rules
- Restrict cross-user reads

## 8. Tests
- Add `vitest` for `shared/calendar.js` utilities
- Add a smoke test for calendar CRUD

## 9. Cleanup
- Remove duplicate mobile nav event listeners (`ui.js:86-98`)
- Remove inline styles in `app-shell.js:150`
- Fix silent error swallowing in `calendar.js:433`
- Either implement or remove the Reports stub (`reports.js`)