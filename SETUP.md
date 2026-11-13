# PaperMind AI - Setup Guide

## Quick Start

### 1. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project
3. Enable **Authentication** with:
   - Email/Password provider
   - Google provider
4. Enable **Firestore Database** in production mode
5. Copy your Firebase config and add to `.env.local`:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY=...
```

### 2. Gemini AI

1. Create a Gemini API key in [Google AI Studio](https://aistudio.google.com/apikey).
2. Add it to `.env.local`:

```
GEMINI_API_KEY=your_gemini_api_key
```

The app uses `gemini-3.1-flash-lite` by default. To select a different supported model, set:

```
GEMINI_MODEL=your-model-name
```

Gemini offers a free tier with usage limits; check [Google's current pricing and limits](https://ai.google.dev/gemini-api/docs/pricing). Usage beyond free limits may incur charges, so review your Google AI Studio or Cloud billing settings. Document text is sent to Google's API; do not submit sensitive documents unless appropriate for your use.
Text-to-speech is separate from AI analysis and continues to use the existing Google Translate TTS integration.

### 3. Run the Application

```bash
npm install
npm run dev
```

The app will be available at `http://localhost:5000`

## Deploy to Vercel

1. Push the project to GitHub, then import the repository in [Vercel](https://vercel.com/new).
2. Keep the project root as the **Root Directory**. Vercel uses `vercel.json` to run `npm run build`, serve `dist/public`, and route `/api/*` requests to the Express API function.
3. In **Project Settings → Environment Variables**, add the following variables from your local `.env.local`. Add them separately for Production (and Preview if you need preview deployments):

   - `GEMINI_API_KEY`
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY`
   - `DATABASE_URL`
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`

   Paste the values into Vercel's environment-variable fields; never commit `.env.local`. `GEMINI_MODEL` is optional and defaults to `gemini-3.1-flash-lite`.
   For `FIREBASE_PRIVATE_KEY`, copy the complete `private_key` value from your Firebase service-account JSON (including the `BEGIN PRIVATE KEY` and `END PRIVATE KEY` lines). In Vercel, paste the key value itself, without the `.env.local` variable name or extra quote characters.
4. Deploy. When you change environment variables, redeploy so the frontend is rebuilt with the updated `VITE_FIREBASE_*` values.
5. In Firebase Console, add your deployed `*.vercel.app` hostname under **Authentication → Settings → Authorized domains**.

The Vercel API function has a 60-second maximum duration. Vercel also limits request-body size, so use PDFs smaller than 4 MB with the current upload endpoint. This project needs Firebase Admin credentials and `DATABASE_URL` in Vercel; without them its server-side storage cannot initialize or persist documents correctly.

## Features

✅ **Firebase Authentication** - Email/password and Google login
✅ **PDF Upload** - Drag-and-drop PDF uploads
✅ **AI Analysis** - AI-powered summaries, citations, and paraphrasing
✅ **Plagiarism Detection** - AI-based plagiarism scoring
✅ **Text-to-Speech** - Listen to your papers with Google Translate TTS
✅ **Dark Mode** - Full dark/light mode support
✅ **Multi-Language** - Support for EN, ES, FR, DE, ZH
✅ **Document History** - Search and manage your documents

## Project Structure

```
├── client/src/
│   ├── pages/          # React pages (Dashboard, Upload, History, etc.)
│   ├── components/     # Reusable UI components
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utilities (Firebase auth, API client)
│   └── contexts/       # React contexts (Theme, Language)
├── server/
│   ├── routes.ts       # API endpoints
│   ├── storage.ts      # Data storage (Firebase + in-memory)
│   ├── openai.ts       # Gemini integration and text-to-speech
│   └── firebase.ts     # Firebase initialization
├── shared/
│   └── schema.ts       # Data schemas and types
└── package.json
```

## Authentication Flow

1. User lands on `/` → redirected to login page
2. User signs up or logs in with email/password or Google
3. Firebase handles authentication
4. User accesses the dashboard
5. All API calls are made from authenticated user's context
6. Click logout to sign out

## Deployment

To deploy:

1. Build: `npm run build`
2. The output is in the `dist/` folder
3. Deploy to your hosting provider (Vercel, Netlify, etc.)

Remember to set all environment variables in your hosting provider's dashboard.
