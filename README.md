# 📚 PaperMind AI - Research Assistant Platform

An intelligent, full-featured research paper analysis platform with Firebase Authentication, AI-powered document analysis, and a beautiful modern UI.

## ✨ Features

- **🔐 Firebase Authentication** - Email/password and Google sign-in
- **📄 PDF Upload** - Drag-and-drop PDF upload with automatic text extraction
- **🤖 AI-Powered Analysis** - Powered by OpenAI GPT-5:
  - Smart summaries of research papers
  - Citation extraction and formatting
  - Academic paraphrasing
  - Plagiarism detection
- **🎵 Text-to-Speech** - Listen to papers with OpenAI TTS
- **📊 Document History** - Search, manage, and organize your research
- **🌙 Dark Mode** - Full dark/light mode support
- **🌍 Multi-Language** - English, Spanish, French, German, Chinese
- **📱 Responsive Design** - Works on desktop, tablet, and mobile

## 🚀 Quick Start

### 1. Clone & Install
```bash
git clone <your-repo>
cd PaperMind-AI
npm install
```

### 2. Set Up Firebase
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project
3. Enable **Authentication** (Email/Password + Google)
4. Enable **Firestore Database**
5. Copy your Web config and create `.env.local`:

```env
# Firebase Client (Frontend)
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Firebase Admin (Backend)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PRIVATE_KEY=your_private_key

# OpenAI API
OPENAI_API_KEY=your_openai_api_key
```

### 3. Run the App
```bash
npm run dev
```
Visit `http://localhost:5000`

## 📁 Project Structure

```
├── client/
│   └── src/
│       ├── pages/           # React pages
│       ├── components/      # Reusable UI components
│       ├── hooks/           # Custom React hooks
│       ├── lib/             # Utilities (Firebase, API client)
│       └── contexts/        # React contexts (Theme, Language)
├── server/
│   ├── routes.ts           # API endpoints
│   ├── storage.ts          # Data storage logic
│   ├── openai.ts           # AI integration
│   └── firebase.ts         # Firebase initialization
├── shared/
│   └── schema.ts           # TypeScript types & Zod schemas
└── package.json
```

## 🔌 API Endpoints

- `POST /api/upload` - Upload PDF and extract text
- `POST /api/analyze` - Run AI analysis (summary, citations, paraphrase, plagiarism)
- `POST /api/tts` - Generate text-to-speech audio
- `GET /api/documents` - Get all documents
- `GET /api/documents/:id` - Get specific document
- `DELETE /api/documents/:id` - Delete document

## 🏗️ Tech Stack

**Frontend:**
- React 18 with TypeScript
- Vite for fast builds
- Wouter for routing
- TanStack Query for data fetching
- Tailwind CSS + shadcn/ui
- Firebase SDK for authentication

**Backend:**
- Express.js
- TypeScript
- Firebase Admin SDK
- OpenAI API
- Multer for file uploads
- pdf-parse for PDF extraction

**Database:**
- Firebase Firestore (documents)
- PostgreSQL (sessions, optional)

## 🔒 Security

- Firebase handles secure authentication
- All API routes use proper validation with Zod
- Environment variables protect sensitive keys
- PDF files processed server-side only

## 📦 Deployment

1. Build the app:
```bash
npm run build
```

2. Deploy to your hosting:
- **Vercel**: `vercel deploy`
- **Netlify**: `netlify deploy`
- **Railway**: `railway deploy`

Remember to set all environment variables in your hosting provider's dashboard.

## 🐛 Troubleshooting

**"Firebase is not configured"**
- Add your Firebase credentials to `.env.local`
- Restart the dev server with `npm run dev`

**PDF upload fails**
- Check file is under 10MB
- Ensure it's a valid PDF format
- Check browser console for detailed error

**AI features not working**
- Verify `OPENAI_API_KEY` is set in `.env.local`
- Check your OpenAI account has credits
- Review API key hasn't been disabled

## 📖 Documentation

- [Firebase Setup Guide](./SETUP.md)
- [API Documentation](./docs/API.md)
- [Component Library](./docs/COMPONENTS.md)

## 📄 License

MIT License - feel free to use this project for any purpose!

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📞 Support

For issues and feature requests, please open a GitHub issue or contact support.

---

**Happy researching with PaperMind AI!** 🎓
