# Manual Test Checklist

Run this checklist after meaningful UI or data-layer changes.

## Setup

1. Confirm `.env` is present and points to the intended Firebase project.
2. Run `npm install` if dependencies are missing.
3. Start the app with `npm run dev`.
4. Keep `npm run check` available as the baseline automated verification.

## Authentication

1. Load the app and confirm the login screen appears for signed-out users.
2. Sign in with Google and confirm the main app shell renders.
3. Sign out and confirm the app returns to the login screen.

## Calendar and activity flow

1. Navigate to the dashboard/calendar view.
2. Move between months and confirm the calendar updates without errors.
3. Create or edit an activity if test data is available.
4. Confirm saved activity data appears in the expected date range.
5. Use search and confirm matching activities appear.

## Congregations

1. Open the congregations view.
2. Add a congregation.
3. Edit the congregation name or circuit.
4. Delete the test congregation if appropriate.
5. Confirm visit-related metadata still renders correctly.

## Assemblies and talks

1. Open the assemblies view.
2. Create an assembly and confirm it appears in the list.
3. Open the assembly details screen.
4. Add, edit, and delete a talk.
5. If bulk import is used, paste sample rows and confirm preview plus import work.

## Speakers

1. Open the speakers view.
2. Add a speaker.
3. Edit speaker details.
4. Delete the test speaker if appropriate.
5. Confirm speaker selection still works when creating or editing talks.

## Reports and exports

1. Open the reports view.
2. Generate any available report output.
3. If CSV export is used, confirm the file downloads and contains expected columns.

## Visual checks

1. Toggle light and dark mode.
2. Toggle the alternate design mode.
3. Check the mobile menu in a narrow viewport.
4. Confirm no obvious layout breaks appear in the main screens.
