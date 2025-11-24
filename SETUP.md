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

### 2. OpenAI API Key

1. Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Add to `.env.local`:

```
OPENAI_API_KEY=your_api_key
```

### 3. Run the Application

```bash
npm install
npm run dev
```

The app will be available at `http://localhost:5000`

## Features

✅ **Firebase Authentication** - Email/password and Google login
✅ **PDF Upload** - Drag-and-drop PDF uploads
✅ **AI Analysis** - GPT-5 powered summaries, citations, paraphrasing
✅ **Plagiarism Detection** - AI-based plagiarism scoring
✅ **Text-to-Speech** - Listen to your papers with OpenAI TTS
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
│   ├── openai.ts       # OpenAI integration
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
