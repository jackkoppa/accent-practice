# 🎙️ AI Accent Coach

A modern web application that helps users improve their English pronunciation. Unlike standard voice assistants that tolerate accents, this app detects specific phonemic deviations and provides actionable coaching.

![AI Accent Coach](https://img.shields.io/badge/React-18-blue?logo=react) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript) ![FastAPI](https://img.shields.io/badge/FastAPI-Python-green?logo=fastapi) ![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38bdf8?logo=tailwindcss)

## Features

- 🎤 **Browser-based audio recording** - No software installation required
- 📊 **Real-time pronunciation scoring** - Pronunciation, Fluency, and Completeness metrics
- 🎯 **AI-powered coaching** - Personalized tips from GPT-4 based on your performance
- 📚 **Practice sentences** - Curated sentences targeting different sounds and difficulty levels
- 🎨 **Modern UI** - Clean, responsive design with beautiful animations

## Architecture

| Component | Technology | Purpose |
|-----------|------------|---------|
| Frontend | React + TypeScript + Tailwind CSS | Modern, responsive UI |
| Backend | FastAPI (Python) | API endpoints, orchestration |
| Grading Engine | Azure AI Speech | Phoneme-level pronunciation assessment |
| Coaching Engine | OpenAI API (GPT-4o) | Pedagogical feedback generation |

### How It Works

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Browser   │────▶│   FastAPI   │────▶│    Azure    │
│  (React UI) │     │   Backend   │     │   Speech    │
└─────────────┘     └──────┬──────┘     └─────────────┘
                          │
                          ▼
                   ┌─────────────┐
                   │   OpenAI    │
                   │   GPT-4o    │
                   └─────────────┘
```

1. User records audio in the browser
2. Audio is sent to FastAPI backend
3. Backend calls Azure Speech for pronunciation assessment
4. Scores are sent to OpenAI for coaching interpretation
5. Results displayed with beautiful visualizations

## Project Structure

```
accent-coach/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── grading_engine.py    # Azure Speech SDK wrapper
│   ├── coaching_engine.py   # OpenAI API wrapper
│   └── requirements.txt     # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── App.tsx          # Main application component
│   │   ├── components/      # React components
│   │   │   ├── AudioRecorder.tsx
│   │   │   ├── SentenceCard.tsx
│   │   │   ├── ScoreRing.tsx
│   │   │   └── ResultsPanel.tsx
│   │   ├── types.ts         # TypeScript types
│   │   └── index.css        # Tailwind styles
│   ├── package.json
│   └── index.html
├── .env.example             # Environment template
└── README.md
```

## Quick Start

### Prerequisites

- Python 3.9+
- Node.js 18+
- npm or yarn

### 1. Clone and Setup

```bash
# Clone the repository
git clone <repository-url>
cd accent-coach

# Copy environment file
cp .env.example backend/.env
```

### 2. Install Backend Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 3. Install Frontend Dependencies

```bash
cd frontend
npm install
```

### 4. Configure API Keys (Optional)

Edit `backend/.env` with your credentials:

```env
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxx
AZURE_SPEECH_KEY=xxxxxxxxxxxx
AZURE_SPEECH_REGION=eastus
```

> **Note:** The app works without API keys in **demo mode** with sample scores.

### 5. Run the Application

Open two terminal windows:

**Terminal 1 - Backend:**
```bash
cd backend
uvicorn main:app --reload --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Open your browser to `http://localhost:5173`

## Demo Mode

The app works without API keys:
- **Without Azure keys**: Returns mock pronunciation scores (85/90/95)
- **Without OpenAI key**: Returns placeholder coaching feedback

This allows you to test the full UI without any API credentials.

## Getting API Keys

### Azure Speech Services
1. Go to [Azure Portal](https://portal.azure.com)
2. Create a "Speech" resource under Cognitive Services
3. Copy the Key and Region from the resource overview

### OpenAI API
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create a new API key
3. Ensure you have access to GPT-4o model

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/sentences` | GET | Get list of practice sentences |
| `/api/analyze` | POST | Analyze pronunciation from audio |
| `/api/health` | GET | Health check with API status |

## Development

### Backend
```bash
cd backend
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm run dev      # Development server
npm run build    # Production build
```

## License

See [LICENSE](LICENSE) file.
