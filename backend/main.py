import os
import tempfile
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from grading_engine import get_pronunciation_score
from coaching_engine import get_coaching_tips

# Load environment variables
load_dotenv()

app = FastAPI(title="AI Accent Coach API")

# Configure CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Sample sentences for practice
PRACTICE_SENTENCES = [
    {
        "id": 1,
        "text": "The quick brown fox jumps over the lazy dog.",
        "difficulty": "easy",
        "focus": "General pronunciation"
    },
    {
        "id": 2,
        "text": "She sells seashells by the seashore.",
        "difficulty": "medium",
        "focus": "S and SH sounds"
    },
    {
        "id": 3,
        "text": "Peter Piper picked a peck of pickled peppers.",
        "difficulty": "medium",
        "focus": "P sounds and rhythm"
    },
    {
        "id": 4,
        "text": "How much wood would a woodchuck chuck if a woodchuck could chuck wood?",
        "difficulty": "hard",
        "focus": "W sounds and tongue twisters"
    },
    {
        "id": 5,
        "text": "The thirty-three thieves thought that they thrilled the throne throughout Thursday.",
        "difficulty": "hard",
        "focus": "TH sounds"
    }
]


@app.get("/")
async def root():
    return {"message": "AI Accent Coach API", "status": "running"}


@app.get("/api/sentences")
async def get_sentences():
    """Get list of practice sentences"""
    return {"sentences": PRACTICE_SENTENCES}


@app.post("/api/analyze")
async def analyze_pronunciation(
    audio: UploadFile = File(...),
    reference_text: str = Form(...)
):
    """
    Analyze pronunciation from audio file.
    Returns scores and coaching tips.
    """
    try:
        # Save uploaded audio to temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_file:
            content = await audio.read()
            temp_file.write(content)
            temp_filepath = temp_file.name

        # Get pronunciation scores from Azure
        scores = get_pronunciation_score(temp_filepath, reference_text)
        
        # Clean up temp file
        os.unlink(temp_filepath)
        
        # Check for errors
        if "error" in scores and scores.get("pronunciation", 0) == 0:
            raise HTTPException(status_code=400, detail=scores["error"])
        
        # Get coaching tips from OpenAI
        coaching = get_coaching_tips(reference_text, scores)
        
        return {
            "scores": {
                "pronunciation": scores.get("pronunciation", 0),
                "fluency": scores.get("fluency", 0),
                "completeness": scores.get("completeness", 0)
            },
            "coaching": coaching,
            "mock_mode": scores.get("mock_data", False),
            "mock_details": scores.get("details", None)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "azure_configured": bool(os.getenv("AZURE_SPEECH_KEY")),
        "openai_configured": bool(os.getenv("OPENAI_API_KEY"))
    }
