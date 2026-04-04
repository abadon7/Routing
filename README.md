# Routing

Routing is a Vite-based single-page app for managing service schedules, congregation visits, assemblies, speakers, and reports. The UI is built with plain JavaScript modules and Tailwind CSS, and it uses Firebase Authentication plus Cloud Firestore for data storage.

## Tech stack

- Vite
- Tailwind CSS v4
- Firebase Auth
- Cloud Firestore
- date-fns

## Requirements

- Node.js 22 or newer recommended
- npm 10 or newer recommended
- A Firebase project configured for web auth and Firestore

## Getting started

1. Install dependencies:

```bash
npm install
```

2. Create a local env file from the template:

```bash
cp .env.example .env
```

3. Fill in these Firebase environment variables in `.env`:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

4. Start the development server:

```bash
npm run dev
```

5. Build the app for production:

```bash
npm run build
```

## Available scripts

- `npm run dev`: start the Vite dev server
- `npm run build`: create a production build
- `npm run preview`: preview the production build locally
- `npm run check`: run the current baseline project check by building the app

## Current quality baseline

This repository does not yet include automated unit, integration, or end-to-end tests. The current automated baseline is a successful production build via `npm run check`.

Use the manual smoke checklist in `docs/manual-test-checklist.md` to verify the main workflows after changes.

## Firebase notes

- Google sign-in must be enabled in Firebase Authentication.
- Firestore collections used by the app include `activities`, `congregations`, `assemblies`, and `speakers`.
- Security rules should be reviewed carefully before multi-user deployment.
