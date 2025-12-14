# 🎙️ AI Accent Coach

A web-based application that helps users correct their English accent. Unlike standard voice assistants that tolerate accents, this app is designed to detect specific phonemic deviations and provide actionable coaching.

## Architecture

| Component | Technology | Purpose |
|-----------|------------|---------|
| Frontend/Backend | Streamlit (Python) | Rapid prototyping, audio recording |
| Grading Engine | Azure AI Speech | Phoneme-level pronunciation assessment |
| Coaching Engine | OpenAI API (GPT-4o) | Pedagogical feedback generation |

### How It Works

1. **User records audio** in the browser (Streamlit audio recorder)
2. **App sends audio + reference text** to Azure Speech API
3. **Azure returns scores** (Pronunciation, Fluency, Completeness) and phoneme errors
4. **App sends Azure JSON to OpenAI** for interpretation
5. **OpenAI generates coaching tips** with actionable advice
6. **App displays scores and feedback** to the user

## Project Structure

```
accent-coach/
├── app.py                # Main Streamlit application entry point
├── grading_engine.py     # Wraps Azure SDK logic
├── coaching_engine.py    # Wraps OpenAI API logic
├── Dockerfile            # Instructions for building the container
├── requirements.txt      # Python dependencies
├── .env.example          # Template for environment variables
└── .gitignore            # Git ignore rules
```

## Local Development Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure Environment Variables

Copy the example environment file and fill in your API keys:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```
# OpenAI - https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxx

# Azure Speech Services - https://portal.azure.com/#create/Microsoft.CognitiveServicesSpeech
AZURE_SPEECH_KEY=xxxxxxxxxxxx
AZURE_SPEECH_REGION=eastus
```

### 3. Run the Application

```bash
streamlit run app.py
```

The app will be available at `http://localhost:8501`

## Demo Mode

The app works without API keys in **demo mode**:
- **Without Azure keys**: Returns mock pronunciation scores (85/90/95)
- **Without OpenAI key**: Returns placeholder coaching feedback

This allows you to test the UI without any API credentials.

## Getting API Keys

### Azure Speech Services
1. Go to [Azure Portal](https://portal.azure.com)
2. Create a "Speech" resource under Cognitive Services
3. Copy the Key and Region from the resource overview

### OpenAI API
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create a new API key
3. Ensure you have access to GPT-4o model

## Docker (For Future Deployment)

Build and run with Docker:

```bash
# Build the image
docker build -t accent-coach .

# Run the container
docker run -p 8501:8501 \
  -e AZURE_SPEECH_KEY=your_key \
  -e AZURE_SPEECH_REGION=your_region \
  -e OPENAI_API_KEY=your_key \
  accent-coach
```

## License

See [LICENSE](LICENSE) file.
